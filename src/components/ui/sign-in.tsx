import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  errorMessage?: string;
  quickAccounts?: Array<{
    label: string;
    email: string;
    roleBadge: string;
    description?: string;
  }>;
  onQuickSelect?: (email: string) => void;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  title = 'BLC Procurement Portal',
  description = 'Sistem Otorisasi Pengadaan & Verifikasi Keuangan Lintas Cabang',
  heroImageSrc = '/logo.png',
  errorMessage,
  quickAccounts = [],
  onQuickSelect,
  onSignIn,
  onResetPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('pemohon@blc.co.id');
  const [passwordInput, setPasswordInput] = useState('blc2026');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F8FAFC] text-[#111827]">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-10">
        {/* Header Korporat Resmi */}
        <div className="text-center pb-6 border-b border-[#E2E8F0]">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <img
              src={heroImageSrc}
              alt="Logo BLC Caready"
              className="h-12 w-12 object-contain bg-[#E51937] rounded-xl p-2 shadow-sm"
            />
            <div className="text-left">
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#E51937]">
                PT Balai Lelang Caready
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight leading-none mt-0.5">
                {title}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Pesan Kesalahan */}
        {errorMessage && (
          <div
            className="my-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-xs font-semibold text-[#DC2626]"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* Formulir Autentikasi */}
        <form className="mt-6 space-y-4" onSubmit={onSignIn}>
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5"
            >
              Email Akun Korporat
            </label>
            <div className="rounded-lg border border-[#CBD5E1] bg-white transition-colors focus-within:border-[#E51937] focus-within:ring-2 focus-within:ring-[#E51937]/15">
              <input
                id="auth-email"
                name="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="nama@blc.co.id"
                className="w-full bg-transparent text-sm p-3 rounded-lg focus:outline-none text-[#111827] font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="rounded-lg border border-[#CBD5E1] bg-white transition-colors focus-within:border-[#E51937] focus-within:ring-2 focus-within:ring-[#E51937]/15">
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-transparent text-sm p-3 pr-11 rounded-lg focus:outline-none text-[#111827] font-medium"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2.5 flex items-center border-0 bg-transparent text-[#6B7280] hover:text-[#111827] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Pemilihan Cepat Akun Demo / Pengujian Peran */}
          {quickAccounts.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-2">
                Pilih Cepat Profil Pengujian (Klik untuk Mengisi Kredensial):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickAccounts.map((acc) => {
                  const active = emailInput === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmailInput(acc.email);
                        setPasswordInput('blc2026');
                        onQuickSelect?.(acc.email);
                      }}
                      className={`flex flex-col text-left p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        active
                          ? 'bg-[#FDF2F4] border-[#E51937] text-[#E51937] shadow-xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#374151] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{acc.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5 ${
                            active
                              ? 'bg-[#E51937] text-white'
                              : 'bg-[#E2E8F0] text-[#4B5563]'
                          }`}
                        >
                          {acc.roleBadge}
                        </span>
                      </div>
                      {acc.description && (
                        <span
                          className={`text-[11px] font-normal mt-1 leading-snug line-clamp-2 ${
                            active ? 'text-[#B81428]' : 'text-[#6B7280]'
                          }`}
                        >
                          {acc.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 text-[#6B7280]">
            <span>Kata sandi akun uji: <strong className="text-[#111827]">blc2026</strong></span>
            {onResetPassword && (
              <button
                type="button"
                onClick={onResetPassword}
                className="hover:underline text-[#E51937] font-bold transition-colors bg-transparent border-0 cursor-pointer p-0"
              >
                Bantuan Akun
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#E51937] py-3.5 font-bold text-white text-sm hover:bg-[#B81428] transition-colors shadow-sm cursor-pointer mt-4"
          >
            Masuk ke Ruang Kerja <span aria-hidden="true">&rarr;</span>
          </button>
        </form>

        {/* Footer Keamanan & Operasional */}
        <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#10B981]" aria-hidden="true" />
            <span>Koneksi Aman Portal Internal</span>
          </div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
            <Lock size={12} aria-hidden="true" />
            <span>BLC Caready &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
