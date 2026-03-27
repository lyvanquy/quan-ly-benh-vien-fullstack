import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { Activity, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ResetForm { newPassword: string; confirmPassword: string; }

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();

  const onSubmit = async (data: ResetForm) => {
    if (!token) return toast.error('Token không hợp lệ');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setDone(true);
      toast.success('Đặt lại mật khẩu thành công');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">HMS</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Thành công</h1>
            <p className="text-sm text-gray-500 mb-6">Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.</p>
            <button onClick={() => router.push('/login')} className="btn-primary w-full h-11 text-sm">
              Đăng nhập
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Đặt lại mật khẩu</h1>
            <p className="text-sm text-gray-400 mb-8">Nhập mật khẩu mới cho tài khoản của bạn</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Mật khẩu mới</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-9" placeholder="Tối thiểu 8 ký tự"
                    {...register('newPassword', { required: true, minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="label">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} className="input pl-9" placeholder="Nhập lại mật khẩu"
                    {...register('confirmPassword', {
                      required: true,
                      validate: v => v === watch('newPassword') || 'Mật khẩu không khớp',
                    })} />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={loading || !token} className="btn-primary w-full h-11 text-sm disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </span>
                ) : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
