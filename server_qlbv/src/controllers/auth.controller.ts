import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../prismaClient';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ok, created, badRequest, unauthorized, serverError, forbidden } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service';

const OTP_ENABLED = process.env.OTP_ENABLED === 'true';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── STEP 1: Login — trả về OTP nếu bật, hoặc token ngay nếu tắt ─────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Email và mật khẩu là bắt buộc');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return unauthorized(res, 'Tài khoản không tồn tại hoặc đã bị khóa');

    // Kiểm tra tài khoản bị lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return forbidden(res, `Tài khoản tạm khóa. Thử lại sau ${remaining} phút`);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const lockData = attempts >= MAX_LOGIN_ATTEMPTS
        ? { loginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) }
        : { loginAttempts: attempts };
      await prisma.user.update({ where: { id: user.id }, data: lockData });

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return forbidden(res, `Sai mật khẩu quá ${MAX_LOGIN_ATTEMPTS} lần. Tài khoản bị khóa 15 phút`);
      }
      return unauthorized(res, `Sai mật khẩu. Còn ${MAX_LOGIN_ATTEMPTS - attempts} lần thử`);
    }

    // Reset login attempts khi đăng nhập đúng
    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null } });

    // Nếu OTP bật → gửi OTP qua email
    if (OTP_ENABLED) {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      // Xóa OTP cũ chưa dùng
      await prisma.otpCode.deleteMany({ where: { userId: user.id, type: 'LOGIN', used: false } });
      await prisma.otpCode.create({ data: { userId: user.id, code: otp, type: 'LOGIN', expiresAt } });

      let emailSent = false;
      try {
        await sendOtpEmail(user.email, otp, user.name);
        emailSent = true;
      } catch (e) {
        console.error('Email send failed:', e);
        console.log(`[DEV OTP] ${user.email}: ${otp}`);
      }

      return ok(res, { requireOtp: true, email: user.email }, 'Mã OTP đã gửi đến email của bạn');
    }

    // OTP tắt → cấp token ngay
    return issueTokens(res, user);
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── STEP 2: Xác nhận OTP ────────────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return badRequest(res, 'Email và OTP là bắt buộc');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return unauthorized(res, 'Tài khoản không tồn tại');

    const record = await prisma.otpCode.findFirst({
      where: { userId: user.id, type: 'LOGIN', used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.code !== otp) return unauthorized(res, 'Mã OTP không đúng hoặc đã hết hạn');

    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });

    return issueTokens(res, user);
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return badRequest(res, 'Email là bắt buộc');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return unauthorized(res, 'Tài khoản không tồn tại');

    // Rate limit: không cho resend nếu OTP cũ còn > 4 phút (tức là mới gửi < 1 phút trước)
    const recent = await prisma.otpCode.findFirst({
      where: { userId: user.id, type: 'LOGIN', used: false, expiresAt: { gt: new Date(Date.now() + 4 * 60 * 1000) } },
    });
    if (recent) return badRequest(res, 'Vui lòng chờ ít nhất 1 phút trước khi gửi lại');

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpCode.deleteMany({ where: { userId: user.id, type: 'LOGIN', used: false } });
    await prisma.otpCode.create({ data: { userId: user.id, code: otp, type: 'LOGIN', expiresAt } });

    let emailSent = false;
    try {
      await sendOtpEmail(user.email, otp, user.name);
      emailSent = true;
    } catch (e) {
      console.error('Email send failed:', e);
      console.log(`[DEV OTP] ${user.email}: ${otp}`);
    }

    return ok(res, {}, 'Mã OTP mới đã được gửi');
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── Helper: cấp access + refresh token ─────────────────────────────────────
async function issueTokens(res: Response, user: { id: string; name: string; email: string; role: string; avatar: string | null }) {
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  return ok(res, {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
}

// ─── Refresh token (rotation) ────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token là bắt buộc');

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      // Token đã hết hạn hoặc không tồn tại → xóa tất cả token của user (nếu có)
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      return unauthorized(res, 'Refresh token hết hạn, vui lòng đăng nhập lại');
    }

    const decoded = verifyRefreshToken(refreshToken) as { id: string; role: string; email: string };

    // Rotation: xóa token cũ, cấp token mới
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = signAccessToken({ id: decoded.id, role: decoded.role, email: decoded.email });
    const newRefreshToken = signRefreshToken({ id: decoded.id, role: decoded.role, email: decoded.email });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: decoded.id, expiresAt } });

    return ok(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return unauthorized(res, 'Refresh token không hợp lệ');
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return ok(res, null, 'Đã đăng xuất');
  } catch {
    return serverError(res);
  }
};

// ─── Forgot password — gửi link reset ────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return badRequest(res, 'Email là bắt buộc');

    const user = await prisma.user.findUnique({ where: { email } });
    // Luôn trả về success để tránh user enumeration
    if (!user) return ok(res, null, 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpires: resetExpires },
    });

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (e) {
      console.error('Reset email failed:', e);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV RESET] ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`);
      }
    }

    return ok(res, null, 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── Reset password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return badRequest(res, 'Token và mật khẩu mới là bắt buộc');
    if (newPassword.length < 8) return badRequest(res, 'Mật khẩu phải ít nhất 8 ký tự');

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
    });
    if (!user) return badRequest(res, 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null, loginAttempts: 0, lockedUntil: null },
    });

    // Revoke tất cả refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return ok(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại');
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── Register (admin only) ────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return badRequest(res, 'Email đã tồn tại');

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role, phone } });

    return created(res, { id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
};

// ─── Get me ───────────────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
    });
    return ok(res, user);
  } catch {
    return serverError(res);
  }
};

// ─── Change password (authenticated) ─────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Thiếu thông tin');
    if (newPassword.length < 8) return badRequest(res, 'Mật khẩu mới phải ít nhất 8 ký tự');

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return unauthorized(res);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return badRequest(res, 'Mật khẩu hiện tại không đúng');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    // Revoke tất cả refresh tokens để force re-login
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return ok(res, null, 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại');
  } catch {
    return serverError(res);
  }
};
