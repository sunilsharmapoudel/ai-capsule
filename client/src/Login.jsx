import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from './api.js';
import Brand from './Brand.jsx';
import Icon from './Icons.jsx';

const OAUTH_ERRORS = {
  oauth_not_configured: 'GitHub sign-in is not configured on the server yet.',
  missing_code: 'GitHub did not return an authorisation code. Please try again.',
  state_mismatch: 'The sign-in request could not be verified. Please try again.',
  token_exchange_failed: 'GitHub rejected the sign-in request. Please try again.',
  profile_failed: 'Your GitHub profile could not be read. Please try again.',
  oauth_failed: 'Something went wrong during sign-in. Please try again.'
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [checkingSession, setCheckingSession] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const errorCode = searchParams.get('error');
  const errorMessage = errorCode ? OAUTH_ERRORS[errorCode] || OAUTH_ERRORS.oauth_failed : null;

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then(() => {
        if (!cancelled) navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function startOAuth() {
    setRedirecting(true);
    window.location.href = '/auth/github';
  }

  return (
    <div className="page">
      <header className="site-header">
        <Brand />
      </header>

      <main className="centered-card">
        <div className="card">
          <span className="card-icon"><Icon name="lock" size={24} /></span>

          <h1>Welcome back</h1>
          <p className="muted">
            AI Capsule uses your GitHub account to sign you in. Your prompt records are
            private to that account.
          </p>

          {errorMessage && (
            <p className="alert alert-error" role="alert">
              <Icon name="alert" size={16} />
              <span className="alert-body">{errorMessage}</span>
            </p>
          )}

          {checkingSession ? (
            <p className="status-line" role="status" aria-live="polite">
              <span className="spinner" />
              Checking your session…
            </p>
          ) : (
            <button
              type="button"
              className="button button-github button-large full-width"
              onClick={startOAuth}
              disabled={redirecting}
            >
              {redirecting ? (
                <>
                  <span className="spinner" />
                  Redirecting to GitHub…
                </>
              ) : (
                <>
                  <Icon name="github" size={18} />
                  Continue with GitHub
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
