import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, type LoginFormData } from '../types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Grainient from '@/components/Grainient';
import TextType from '@/components/TextType';

export function LoginPage(): React.ReactNode {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    const dest =
      user.role === UserRole.CLIENT ? '/client/dashboard' : '/freelancer/dashboard';
    navigate(dest, { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    const { error: authError, data } = await login(formData) as { error: any; data?: { session?: { user?: { id: string } } } };
    setSubmitting(false);

    if (authError) {
      if (authError.status === 400) {
        setError('The email or password you entered is incorrect.');
      } else {
        setError(authError.message);
      }
      return;
    }

    // Only navigate once sign-in returned a session (AuthContext already set state)
    if (data?.session?.user) {
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:block lg:w-[45%] relative">
        <Grainient
          color1="#c084fc"
          color2="#7c3aed"
          color3="#1e1b4b"
          timeSpeed={0.18}
          warpStrength={1.2}
          warpFrequency={3.5}
          warpSpeed={1}
          warpAmplitude={50}
          rotationAmount={400}
          noiseScale={2}
          grainAmount={0.04}
          grainScale={3}
          contrast={1.35}
          saturation={1.2}
          gamma={1.05}
          zoom={0.75}
        />
        {/* Overlay text */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12">
          <div className="max-w-xs space-y-4">
            <p className="text-sm font-medium uppercase tracking-widest text-white/40">
              Freelancer Dashboard
            </p>
            <TextType
              text={[
                'Find projects that match your skills.',
                'Submit bids. Win contracts.',
                'Track milestones. Get paid.',
                'Your freelance career, organised.',
              ]}
              typingSpeed={60}
              deletingSpeed={35}
              pauseDuration={2200}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.6}
              className="block text-2xl font-light leading-snug text-white/85 min-h-[4rem]"
            />
            <p className="text-sm text-white/35">
              One platform. Clients, projects &amp; payments.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12">
          <div className="w-full max-w-[380px]">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Sign in
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and password to continue
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/15 bg-destructive/5 px-4 py-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-10 pr-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
