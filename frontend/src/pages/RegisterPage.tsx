import { useState, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, type RegisterFormData } from '../types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BriefcaseIcon, type BriefcaseIconHandle } from '@/components/icons/BriefcaseIcon';
import { UsersIcon, type UsersIconHandle } from '@/components/icons/UsersIcon';
import Grainient from '@/components/Grainient';
import { cn } from '@/lib/utils';

export function RegisterPage(): React.ReactNode {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.FREELANCER,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const briefcaseRef = useRef<BriefcaseIconHandle>(null);
  const usersRef = useRef<UsersIconHandle>(null);

  if (user) {
    const dest =
      user.role === UserRole.CLIENT ? '/client/dashboard' : '/freelancer/dashboard';
    navigate(dest, { replace: true });
    return null;
  }

  function validate(): string | null {
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    if (!formData.email) return 'Email is required.';
    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const { error: authError } = await register(formData);
    setSubmitting(false);

    if (authError) {
      if (authError.message?.includes('already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(authError.message);
      }
      return;
    }

    const dest = formData.role === UserRole.CLIENT ? '/client/dashboard' : '/freelancer/dashboard';
    navigate(dest, { replace: true });
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
        {/* Overlay quote */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12">
          <blockquote className="max-w-xs space-y-3">
            <p className="text-xl font-light leading-relaxed text-white/80">
              &ldquo;Great work starts with the right foundation — build
              yours today.&rdquo;
            </p>
            <footer className="text-sm text-white/40">
              — Built for teams that ship
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-background overflow-y-auto">
        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12">
          <div className="w-full max-w-[420px]">
            <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Fill in the details below to get started
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
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[13px] font-medium">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jane"
                    autoComplete="given-name"
                    required
                    className="h-10"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[13px] font-medium">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Smith"
                    autoComplete="family-name"
                    required
                    className="h-10"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

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
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    required
                    minLength={6}
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

              {/* Role selection — compact inline */}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">I am a</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: UserRole.FREELANCER }))
                    }
                    onMouseEnter={() => briefcaseRef.current?.startAnimation()}
                    onMouseLeave={() => briefcaseRef.current?.stopAnimation()}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                      formData.role === UserRole.FREELANCER
                        ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/20 hover:bg-muted/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                        formData.role === UserRole.FREELANCER
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <BriefcaseIcon ref={briefcaseRef} size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">Freelancer</span>
                      <p className="text-[11px] text-muted-foreground">I do the work</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: UserRole.CLIENT }))
                    }
                    onMouseEnter={() => usersRef.current?.startAnimation()}
                    onMouseLeave={() => usersRef.current?.stopAnimation()}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                      formData.role === UserRole.CLIENT
                        ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/20 hover:bg-muted/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                        formData.role === UserRole.CLIENT
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <UsersIcon ref={usersRef} size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">Client</span>
                      <p className="text-[11px] text-muted-foreground">I hire talent</p>
                    </div>
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}
