import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  errorMessage?: string;
  quickAccounts?: Array<{ label: string; email: string; roleBadge: string }>;
  onQuickSelect?: (email: string) => void;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 backdrop-blur-sm transition-colors focus-within:border-[#E51937] focus-within:bg-rose-50/20">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-contain rounded-2xl bg-[#E51937] p-1" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-bold text-[#111C2D]">{testimonial.name}</p>
      <p className="text-xs font-semibold text-[#E51937]">{testimonial.handle}</p>
      <p className="mt-1 text-xs text-[#5A6A85]">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc = "/logo.png",
  testimonials = [],
  errorMessage,
  quickAccounts = [],
  onQuickSelect,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('pemohon@blc.co.id');
  const [passwordInput, setPasswordInput] = useState('blc2026');

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-full bg-[#F0F5F9] text-[#111C2D]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-white md:rounded-r-3xl shadow-sm">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-black leading-tight text-[#111C2D]">{title}</h1>
            <p className="animate-element animate-delay-200 text-sm text-[#5A6A85]">{description}</p>

            {errorMessage && (
              <div className="rounded-xl bg-[#FDF2F4] border border-[#FECDD3] px-4 py-2.5 text-xs font-bold text-[#C8132D]" role="alert">
                {errorMessage}
              </div>
            )}

            <form className="space-y-4" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label htmlFor="demo-email" className="text-xs font-bold text-[#5A6A85] uppercase tracking-wider">Email akun demo</label>
                <GlassInputWrapper>
                  <input
                    id="demo-email" name="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Masukkan email korporat"
                    className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-[#111C2D] font-semibold"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label htmlFor="demo-password" className="text-xs font-bold text-[#5A6A85] uppercase tracking-wider">Kata sandi</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="demo-password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-2xl focus:outline-none text-[#111C2D] font-semibold"
                      required
                    />
                    <button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center border-0 bg-transparent">
                      {showPassword ? <EyeOff className="w-5 h-5 text-[#7C8FAC] hover:text-[#111C2D] transition-colors" /> : <Eye className="w-5 h-5 text-[#7C8FAC] hover:text-[#111C2D] transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {quickAccounts.length > 0 && (
                <div className="animate-element animate-delay-500 pt-1">
                  <div className="text-[11px] font-bold text-[#7C8FAC] uppercase tracking-wider mb-2">
                    Pilih Akun Sesuai Role (Klik untuk Isi Otomatis)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
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
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#FDF2F4] border-[#E51937] text-[#E51937]'
                              : 'bg-[#F8FAFD] border-[#EAEFF4] text-[#5A6A85] hover:border-[#DFE5EF]'
                          }`}
                        >
                          {acc.label} · <span className="font-mono text-[10px]">{acc.roleBadge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="animate-element animate-delay-500 flex items-center justify-end text-xs">
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-[#E51937] font-bold transition-colors">Reset password</a>
              </div>

              <button type="submit" className="animate-element animate-delay-600 w-full rounded-2xl bg-[#E51937] py-3.5 font-bold text-white hover:bg-[#C8132D] transition-colors shadow-md cursor-pointer">
                Masuk
              </button>
            </form>

            {onGoogleSignIn && <><div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-[#EAEFF4]"></span>
              <span className="px-4 text-xs text-[#7C8FAC] bg-white absolute">Or continue with</span>
            </div>

            <button type="button" onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-[#DFE5EF] rounded-2xl py-3.5 hover:bg-[#F8FAFD] transition-colors font-bold text-sm text-[#111C2D] cursor-pointer">
                <GoogleIcon />
                Continue with Google
            </button></>}

            {onCreateAccount && (
              <p className="animate-element animate-delay-900 text-center text-xs text-[#7C8FAC]">
                New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-[#E51937] hover:underline font-bold transition-colors">Create Account</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Right column: Caready Logo Hero + Testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-[#E51937] flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center 38%',
              backgroundSize: '260px auto',
            }}
          />
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SignInPage;
