import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  errorMessage?: string;
  isLoading?: boolean;
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
  isLoading = false,
  quickAccounts = [],
  onQuickSelect,
  onSignIn,
  onResetPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('pemohon@blc.co.id');
  const [passwordInput, setPasswordInput] = useState('blc2026');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F4F3EF] text-[#111827]">
      <Card className="w-full max-w-xl bg-white border border-[#E4E2DD] shadow-sm rounded-2xl">
        <CardHeader className="text-center pb-6 border-b border-[#E4E2DD]">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img
              src={heroImageSrc}
              alt="Logo BLC Caready"
              className="h-12 w-12 object-contain bg-[#DC2626] rounded-xl p-2 shadow-xs"
            />
            <div className="text-left">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">
                PT Balai Lelang Caready
              </span>
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight mt-0.5">
                {title}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {errorMessage && (
            <div
              className="rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-xs font-semibold text-[#DC2626]"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSignIn}>
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Email Akun Korporat
              </Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="nama@blc.co.id"
                className="h-11 bg-white border-[#CBD5E1] focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password" className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Kata Sandi
              </Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="h-11 pr-11 bg-white border-[#CBD5E1] focus-visible:ring-primary"
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
                        className={`flex flex-col text-left p-3 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] shadow-xs ring-1 ring-[#DC2626]'
                            : 'bg-[#F8F7F4] border-[#E4E2DD] text-[#374151] hover:bg-white hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-1">
                          <span className="font-bold truncate text-[#111827]">{acc.label}</span>
                          <Badge
                            variant={active ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 font-mono font-bold shrink-0"
                          >
                            {acc.roleBadge}
                          </Badge>
                        </div>
                        {acc.description && (
                          <span
                            className={`text-[11px] font-normal mt-1 leading-snug line-clamp-2 ${
                              active ? 'text-[#B91C1C]' : 'text-[#6B7280]'
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
                  className="hover:underline text-[#DC2626] font-bold transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  Bantuan Akun
                </button>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full h-11 rounded-xl bg-primary hover:bg-[#B91C1C] text-white font-bold text-sm shadow-xs mt-2"
            >
              {isLoading ? 'Sedang masuk...' : <>Masuk ke Ruang Kerja <span aria-hidden="true">&rarr;</span></>}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-4 border-t border-[#E4E2DD] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#059669]" aria-hidden="true" />
            <span>Koneksi Aman Portal Internal</span>
          </div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
            <Lock size={12} aria-hidden="true" />
            <span>BLC Caready &copy; 2026</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignInPage;
