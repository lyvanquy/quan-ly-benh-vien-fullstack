import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, RefreshCw, Clock } from 'lucide-react';

type Step = 'login' | 'otp' | 'forgot' | 'reset-sent';

interface LoginForm { email: string; password: string; }
interface OtpForm { otp: string; }
interface ForgotForm { email: string; }

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    setRemaining(seconds);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => setRemaining(r => { if (r <= 1) { clearInterval(ref.current!); return 0; } return r - 1; }), 1000);
  };
  return { remaining, start, expired: remaining === 0 };
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const countdown = useCountdown(300); // 5 phút

  const loginForm = useForm<LoginForm>();
  const otpForm = useForm<OtpForm>();
  const forgotForm = useForm<ForgotForm>();

  // ── Step 1: Login ──────────────────────────────────────────────────────────
  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const result = res.data.data;

      if (result.requireOtp) {
        setPendingEmail(data.email);
        setStep('otp');
        countdown.start();
        toast.success('Mã OTP đã gửi đến email của bạn');
      } else {
        // OTP tắt → đăng nhập thẳng
        const { user, accessToken, refreshToken } = result;
        setAuth(user, accessToken, refreshToken);
        toast.success(`Chào mừng, ${user.name}`);
        router.push('/dashboard');
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const onVerifyOtp = async (data: OtpForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: pendingEmail, otp: data.otp });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Chào mừng, ${user.name}`);
      router.push('/dashboard');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Mã OTP không đúng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const onResend = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-otp', { email: pendingEmail });
      countdown.start();
      toast.success('Đã gửi lại mã OTP');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi lại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const onForgot = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setStep('reset-sent');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-sidebar p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-400/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-none">HMS</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Hospital Management System</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Hệ thống quản lý<br />bệnh viện toàn diện
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Quản lý bệnh nhân, lịch khám, hồ sơ bệnh án, dược phẩm, tài chính và nhiều hơn nữa.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { label: 'Bệnh nhân', value: '10,000+' },
              { label: 'Bác sĩ', value: '200+' },
              { label: 'Ca khám/tháng', value: '5,000+' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-600">© 2026 HMS. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm animate-slideUp">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">HMS</span>
          </div>

          {/* ── Login form ── */}
          {step === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
              <p className="text-sm text-gray-400 mb-8">Nhập thông tin tài khoản để tiếp tục</p>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" className="input pl-9" placeholder="admin@hms.com"
                      {...loginForm.register('email', { required: 'Email là bắt buộc' })} />
                  </div>
                  {loginForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Mật khẩu</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-9" placeholder="••••••••"
                      {...loginForm.register('password', { required: 'Mật khẩu là bắt buộc' })} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep('forgot')} className="text-xs text-primary hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-sm disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang đăng nhập...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Đăng nhập <ArrowRight size={16} /></span>
                  )}
                </button>
              </form>
              <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Demo: <span className="font-mono text-gray-600">admin@hms.com</span> / <span className="font-mono text-gray-600">Admin@123</span>
                </p>
              </div>
            </>
          )}

          {/* ── OTP form ── */}
          {step === 'otp' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Xác thực 2 bước</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Mã OTP đã gửi đến</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                <Mail size={14} className="text-blue-500 shrink-0" />
                <span className="text-sm font-medium text-blue-700">{pendingEmail}</span>
              </div>

              {/* Countdown */}
              <div className={`flex items-center gap-1.5 mb-4 text-xs font-medium ${countdown.expired ? 'text-red-500' : 'text-gray-400'}`}>
                <Clock size={12} />
                {countdown.expired
                  ? 'Mã đã hết hạn — vui lòng gửi lại'
                  : `Mã hết hạn sau ${Math.floor(countdown.remaining / 60)}:${String(countdown.remaining % 60).padStart(2, '0')}`
                }
              </div>

              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
                <div>
                  <label className="label">Mã OTP (6 số)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input text-center text-2xl font-bold tracking-[0.5em] h-14"
                    placeholder="000000"
                    disabled={countdown.expired}
                    {...otpForm.register('otp', { required: true, pattern: /^\d{6}$/ })}
                  />
                  {otpForm.formState.errors.otp && <p className="text-red-500 text-xs mt-1">Nhập đúng 6 chữ số</p>}
                </div>
                <button type="submit" disabled={loading || countdown.expired} className="btn-primary w-full h-11 text-sm disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><ShieldCheck size={16} /> Xác nhận</span>
                  )}
                </button>
                <button type="button" onClick={onResend} disabled={loading || !countdown.expired && countdown.remaining > 240}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 py-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <RefreshCw size={13} /> Gửi lại mã OTP
                </button>
                <button type="button" onClick={() => setStep('login')} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
                  ← Quay lại đăng nhập
                </button>
              </form>
            </>
          )}

          {/* ── Forgot password ── */}
          {step === 'forgot' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <KeyRound size={24} className="text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Quên mật khẩu</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Nhập email để nhận link đặt lại</p>
                </div>
              </div>
              <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                <div>
                  <label className="label">Email tài khoản</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" className="input pl-9" placeholder="email@example.com"
                      {...forgotForm.register('email', { required: true })} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-sm disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : 'Gửi link đặt lại mật khẩu'}
                </button>
                <button type="button" onClick={() => setStep('login')} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
                  ← Quay lại đăng nhập
                </button>
              </form>
            </>
          )}

          {/* ── Reset sent ── */}
          {step === 'reset-sent' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Kiểm tra email</h1>
              <p className="text-sm text-gray-500 mb-6">
                Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi. Kiểm tra hộp thư đến và spam.
              </p>
              <button onClick={() => setStep('login')} className="btn-primary w-full h-11 text-sm">
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
