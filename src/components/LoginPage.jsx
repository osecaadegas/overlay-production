import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithTwitch,
  } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const title = useMemo(
    () => (mode === 'signin' ? 'Sign in to your overlay center' : 'Create an overlay account'),
    [mode]
  );

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    const action = mode === 'signin' ? signIn : signUp;
    const { error: authError } = await action(form.email.trim(), form.password);

    if (authError) {
      setError(authError.message || 'Authentication failed.');
      setBusy(false);
      return;
    }

    if (mode === 'signup') {
      setMessage('Account created. Check your inbox if email confirmation is enabled.');
    } else {
      navigate('/overlay-center');
    }

    setBusy(false);
  };

  const handleOAuth = async (provider) => {
    setBusy(true);
    setMessage('');
    setError('');

    const action = provider === 'google' ? signInWithGoogle : signInWithTwitch;
    const { error: authError } = await action();

    if (authError) {
      setError(authError.message || 'OAuth sign-in failed.');
      setBusy(false);
      return;
    }

    setBusy(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <section className="auth-hero">
          <div>
            <span className="auth-kicker">Standalone Extraction</span>
            <h1>Overlay center on its own domain.</h1>
            <p>
              This project isolates the overlay controls, the public overlay URL, and the minimum SQL
              footprint required to host the overlay independently from the rest of the original site.
            </p>
          </div>

          <div className="auth-feature-grid">
            <div className="auth-feature">
              <strong>Separate auth domain</strong>
              Redirect URLs resolve from the current origin so the new host can stand on its own.
            </div>
            <div className="auth-feature">
              <strong>OBS-ready preview</strong>
              Public overlay URLs stay copyable under `/premium/overlay?id=...`.
            </div>
            <div className="auth-feature">
              <strong>SQL kept small</strong>
              Only `user_roles`, `slots`, and `overlays` are required for this extracted build.
            </div>
            <div className="auth-feature">
              <strong>No broad app dependency</strong>
              The control center is decoupled from the casino pages and admin sections.
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <h2>{title}</h2>
          <p>Use email/password or an OAuth provider configured in Supabase.</p>

          {error ? <div className="auth-message auth-error">{error}</div> : null}
          {message ? <div className="auth-message">{message}</div> : null}

          {user ? (
            <div className="account-card">
              <div>
                <strong>Signed in</strong>
                <div>{user.email || user.user_metadata?.full_name || user.id}</div>
              </div>
              <div className="account-actions">
                <button className="button-link" onClick={() => navigate('/overlay-center')}>
                  Open overlay center
                </button>
                <button className="button-subtle" onClick={signOut} disabled={loading || busy}>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                  />
                </label>

                <div className="auth-actions">
                  <div className="button-row">
                    <button className="button-primary" type="submit" disabled={busy || loading}>
                      {busy ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={busy || loading}
                      onClick={() => {
                        setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
                        setError('');
                        setMessage('');
                      }}
                    >
                      {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="oauth-divider">or continue with</div>

              <div className="oauth-actions">
                <button className="button-oauth" onClick={() => handleOAuth('google')} disabled={busy || loading}>
                  Continue with Google
                </button>
                <button className="button-oauth" onClick={() => handleOAuth('twitch')} disabled={busy || loading}>
                  Continue with Twitch
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}