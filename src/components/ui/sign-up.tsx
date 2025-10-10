import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  email?: string;
  emailDisabled?: boolean;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onBackToLogin?: () => void;
  loading?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Creează Cont</span>,
  description = "Completează detaliile pentru a crea contul tău",
  heroImageSrc,
  email = '',
  emailDisabled = false,
  onSignUp,
  onBackToLogin,
  loading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignUp}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Email address" 
                    defaultValue={email}
                    disabled={emailDisabled}
                    className={`w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none ${emailDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Parolă</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Minim 8 caractere" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? 
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : 
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      }
                    </button>
                  </div>
                </GlassInputWrapper>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Parola trebuie să conțină: majusculă, minusculă, cifră, caracter special
                </p>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">Confirmă Parola</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Repetă parola" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showConfirmPassword ? 
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : 
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      }
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Se creează contul...' : 'Creează Cont'}
              </button>
            </form>

            {onBackToLogin && (
              <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
                Ai deja cont? <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }} className="text-violet-400 hover:underline transition-colors">Autentifică-te</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
        </section>
      )}
    </div>
  );
};

