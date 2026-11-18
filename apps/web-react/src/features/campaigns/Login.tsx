import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/AppState';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Controls';
import { StatusBanner } from '@/components/ui/Feedback';
import { LocaleSwitch } from '@/app/AppShell';

export default function Login() {
  const { t } = useI18n();
  const { loggedIn, login } = useApp();
  const [busy, setBusy] = useState<'google' | 'email'>();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string>();

  if (loggedIn) return <Navigate to="/campaigns" replace />;

  const go = async (p: 'google' | 'email') => {
    if (p === 'email' && !/^\S+@\S+\.\S+$/.test(email)) { setErr(t('auth.emailInvalid')); return; }
    setErr(undefined); setBusy(p);
    await login(p, email || undefined);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4"><LocaleSwitch /></div>
      <main className="surface w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="text-center">
          <p aria-hidden className="font-display text-6xl text-gold-400">✦</p>
          <h1 className="h-display mt-2 text-4xl">D&amp;D Atlas</h1>
          <p className="mt-1 text-sm text-star-300">{t('auth.tagline')}</p>
        </div>
        <Button size="lg" variant="primary" className="w-full" loading={busy === 'google'} disabled={!!busy} onClick={() => go('google')}>{t('auth.google')}</Button>
        <div className="flex items-center gap-3 text-xs text-star-400"><span className="h-px flex-1 bg-night-500" />{t('auth.or')}<span className="h-px flex-1 bg-night-500" /></div>
        <form onSubmit={(e) => { e.preventDefault(); go('email'); }} className="space-y-3">
          <Field label={t('auth.email')} htmlFor="login-email" error={err}>
            <input id="login-email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!err} />
          </Field>
          <Button type="submit" className="w-full" loading={busy === 'email'} disabled={!!busy}>{t('auth.emailLink')}</Button>
        </form>
        <StatusBanner kind="info" title={t('auth.mockTitle')}>{t('auth.mockBody')}</StatusBanner>
      </main>
    </div>
  );
}
