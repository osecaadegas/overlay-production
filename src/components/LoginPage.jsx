import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithTwitch,
  } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/overlay-center', { replace: true });
    }
  }, [loading, navigate, user]);

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

  if (loading || user) {
    return <div className="app-loading">Checking session...</div>;
  }

  return (
    <div className="landing-page overlay-landing-page">
      <section className="hero-image-section">
        <div className="hero-image-container">
          <img src="/Hero.svg" alt="Overlay Center hero" className="hero-image" />
          <div className="hero-image-fade" />
        </div>

        <div className="hero-content-overlay">
          <div className="landing-badge">Overlay Center</div>
          <h1 className="landing-title">Control your stream overlay from one place.</h1>
          <p className="landing-subtitle">
            Bring the same visual direction from the main site into a dedicated control center for OBS,
            widget management, and live preview adjustments.
          </p>

          <div className="hero-social-icons">
            <a href="https://www.twitch.tv/osecaadegas95" target="_blank" rel="noopener noreferrer" className="hero-social-icon" title="Twitch">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            </a>
            <a href="https://www.youtube.com/@osecaadegas" target="_blank" rel="noopener noreferrer" className="hero-social-icon" title="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/osecaadegas/" target="_blank" rel="noopener noreferrer" className="hero-social-icon" title="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://discord.gg/4yZ3F2Pk4z" target="_blank" rel="noopener noreferrer" className="hero-social-icon" title="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>

          <a href="#access" className="hero-scroll-indicator">
            <span>ENTER CONTROL CENTER</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
        </div>
      </section>

      <section className="landing-access-section" id="access">
        <div className="landing-access-grid">
          <div className="landing-copy">
            <div className="landing-copy-intro">
              <span className="landing-section-kicker">Dedicated Workspace</span>
              <h2>Everything your overlay needs, separated from the rest of the site.</h2>
              <p>
                Manage widgets, position elements on a live preview, copy your OBS browser source URL,
                and keep the extracted overlay center visually aligned with the main project.
              </p>
            </div>

            <div className="landing-copy-grid">
              <article className="landing-copy-card">
                <strong>OBS-ready output</strong>
                <span>Generate a browser source URL and open a live preview in one flow.</span>
              </article>
              <article className="landing-copy-card">
                <strong>Widget management</strong>
                <span>Control bonus hunt, stats, tournaments, chat, slot tools, and styling in one panel.</span>
              </article>
              <article className="landing-copy-card">
                <strong>Source-matched look</strong>
                <span>Carry over the darker hero-driven aesthetic from your main site into this standalone app.</span>
              </article>
              <article className="landing-copy-card">
                <strong>Premium-gated access</strong>
                <span>Only the signed-in premium account can open the control center and API-backed overlay tools.</span>
              </article>
            </div>
          </div>

          <section className="landing-login-card">
            <div className="login-header">
              <h2 className="login-title">Welcome</h2>
              <p className="login-subtitle">Sign in to access your overlay workspace</p>
            </div>

            {error ? (
              <div className="login-error">
                <span>⚠</span> {error}
              </div>
            ) : null}

            {message ? <div className="landing-auth-message">{message}</div> : null}

            <div className="login-providers">
              <button
                className="login-btn login-btn--twitch"
                onClick={() => handleOAuth('twitch')}
                disabled={busy}
              >
                <svg className="login-btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
                <span className="login-btn-text">{busy ? 'Connecting...' : 'Continue with Twitch'}</span>
              </button>

              <button
                className="login-btn login-btn--google"
                onClick={() => handleOAuth('google')}
                disabled={busy}
              >
                <svg className="login-btn-icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="login-btn-text">{busy ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="landing-auth-divider">or use email</div>

            <form className="landing-auth-form" onSubmit={handleSubmit}>
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

              <div className="landing-auth-actions">
                <button className="landing-primary-btn" type="submit" disabled={busy}>
                  {busy ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                <button
                  className="landing-secondary-btn"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
                    setError('');
                    setMessage('');
                  }}
                >
                  {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
                </button>
              </div>
            </form>

            <div className="login-footer">
              <p className="login-legal">
                OAuth redirects resolve from the current origin, so this extracted overlay center can live on
                its own domain without depending on the full site.
              </p>
            </div>
          </section>
        </div>
      </section>
      </div>
    </div>
  );
}