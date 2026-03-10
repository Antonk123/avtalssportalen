import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginLogo } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const { data: loginLogo } = useLoginLogo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError('Fel e-postadress eller lösenord');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar items-center justify-center p-16 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative max-w-sm"
        >
          {loginLogo && (
            <div className="flex items-center gap-4 mb-10">
              <img src={loginLogo} alt="Logo" className="h-16 w-16 object-contain" />
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-sidebar-accent-foreground tracking-tight leading-tight">
                  Prefabmästarna
                </span>
                <span className="text-xs text-sidebar-foreground/60 tracking-wide">
                  Avtalsportalen
                </span>
              </div>
            </div>
          )}
          {!loginLogo && (
            <div className="flex flex-col mb-10">
              <span className="font-heading text-2xl font-bold text-sidebar-accent-foreground tracking-tight leading-tight">
                Prefabmästarna
              </span>
              <span className="text-xs text-sidebar-foreground/60 tracking-wide">
                Avtalsportalen
              </span>
            </div>
          )}
          
          <h2 className="font-heading text-3xl font-bold text-sidebar-accent-foreground leading-tight mb-4">
            Smidigare avtalshantering för hela organisationen
          </h2>
          <p className="text-sidebar-foreground leading-relaxed">
            Ersätt kalkylblad och mejltrådar med en gemensam plattform för alla era avtal, 
            kunder och påminnelser.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Samlad överblick över alla avtal',
              'Automatiska påminnelser innan uppsägning',
              'Spårbarhet och historik per avtal',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shrink-0" />
                <span className="text-sm text-sidebar-foreground">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-primary/15 blur-sm" />
              <img src="/images/pfm-icon-transparent.png" alt="PFM" className="relative h-9 w-9" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-semibold text-foreground tracking-tight leading-tight">
                Prefabmästarna
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Avtalsportalen</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Logga in på ditt konto
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ange dina uppgifter för att fortsätta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">E-postadress</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@prefabmastarna.se"
                required
                autoComplete="email"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-10" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loggar in...</>
              ) : (
                <>Logga in <ArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Kontakta din administratör om du behöver åtkomst.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
