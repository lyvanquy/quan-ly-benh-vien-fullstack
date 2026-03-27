import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((err) => {
  if (err) {
    console.error('[EMAIL] Kết nối Gmail thất bại:', err.message);
    console.error('[EMAIL] Kiểm tra GMAIL_USER và GMAIL_APP_PASSWORD trong .env');
  } else {
    console.log('[EMAIL] Gmail SMTP sẵn sàng:', process.env.GMAIL_USER);
  }
});

export const sendOtpEmail = async (to: string, otp: string, name: string) => {
  await transporter.sendMail({
    from: `"HMS Hospital" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Mã xác thực đăng nhập HMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#1e40af;margin:0;">🏥 HMS Hospital</h2>
          <p style="color:#6b7280;font-size:13px;margin-top:4px;">Hệ thống quản lý bệnh viện</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb;">
          <p style="color:#374151;margin:0 0 8px;">Xin chào <strong>${name}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Mã OTP đăng nhập của bạn là:</p>
          <div style="text-align:center;background:#eff6ff;border:2px dashed #3b82f6;border-radius:8px;padding:20px;margin:0 0 20px;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#1d4ed8;">${otp}</span>
          </div>
          <p style="color:#ef4444;font-size:13px;margin:0;">⏱ Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, name: string, resetToken: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"HMS Hospital" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Đặt lại mật khẩu HMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#1e40af;margin:0;">🏥 HMS Hospital</h2>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb;">
          <p style="color:#374151;margin:0 0 8px;">Xin chào <strong>${name}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Nhấn nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>15 phút</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Đặt lại mật khẩu</a>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;">Hoặc copy link: <a href="${resetUrl}" style="color:#3b82f6;">${resetUrl}</a></p>
        </div>
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};
