import { Router } from 'express';
import {
  login, verifyOtp, resendOtp, register, refresh, logout,
  getMe, forgotPassword, resetPassword, changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import rateLimit from 'express-rate-limit';

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập. Thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Quá nhiều lần nhập OTP. Thử lại sau 5 phút' },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: { success: false, message: 'Quá nhiều yêu cầu reset. Thử lại sau 1 giờ' },
});

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register', authenticate, authorize('ADMIN'), register);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
