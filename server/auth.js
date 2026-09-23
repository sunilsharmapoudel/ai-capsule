// ---------------------------------------------------------------------------
// GitHub OAuth login and the application JWT.
//
// Flow:
//   1. GET /auth/github           -> redirect the browser to GitHub
//   2. GET /auth/github/callback  -> exchange the code for a GitHub access
//                                    token, read the GitHub profile, then
//                                    issue THIS application's own JWT and
//                                    store it in a Secure, HttpOnly cookie
//                                    named "token".
//
// The GitHub access token is only used server-side to read the profile once.
// It is never sent to the browser. The cookie holds the application JWT that
// this Express server signs and verifies itself.
// ---------------------------------------------------------------------------
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_BASE_URL = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const TOKEN_COOKIE = 'token';
const STATE_COOKIE = 'oauth_state';
const JWT_ISSUER = 'ai-capsule';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// The JWT cookie is Secure by default, which is what the deployed HTTPS app
// uses. COOKIE_SECURE=false is only an escape hatch for local plain-http
// testing; it is never set in the cloud environment.
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';

const cookieOptions = {
  httpOnly: true,            // not readable by JavaScript -> protects against XSS token theft
  secure: COOKIE_SECURE,     // only sent over HTTPS
  sameSite: 'lax',           // sent on the OAuth redirect back, not on cross-site POSTs
  path: '/',
  maxAge: TOKEN_TTL_SECONDS * 1000
};

// --- JWT helpers -------------------------------------------------------------

function issueToken(profile) {
  return jwt.sign(
    {
      sub: String(profile.id),   // the GitHub user id - the record owner
      login: profile.login,
      name: profile.name || profile.login,
      avatar: profile.avatar_url || null
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS, issuer: JWT_ISSUER }
  );
}

/**
 * JWT authentication middleware.
 *
 * Applied to every protected route. A request with no cookie, a malformed
 * token, a token signed with a different secret, a token from another issuer
 * or an expired token is rejected with 401 and no protected data is returned.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
  } catch {
    // Covers an invalid signature, a tampered or malformed token such as
    // "fake-token-123", and an expired token.
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  if (!payload.sub) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  // The authenticated identity comes only from the verified JWT.
  // user_id is never read from the request body or query string.
  req.user = {
    id: String(payload.sub),
    login: payload.login,
    name: payload.name,
    avatar: payload.avatar
  };
  next();
}

// --- Step 1: send the user to GitHub -----------------------------------------

router.get('/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.redirect('/login?error=oauth_not_configured');
  }

  // A random "state" value, echoed back by GitHub, protects the callback
  // against cross-site request forgery.
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000
  });

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', `${APP_BASE_URL}/auth/github/callback`);
  authorizeUrl.searchParams.set('scope', 'read:user');
  authorizeUrl.searchParams.set('state', state);

  res.redirect(authorizeUrl.toString());
});

// --- Step 2: GitHub sends the user back --------------------------------------

router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies?.[STATE_COOKIE];

  // The one-time state cookie is cleared however this request ends.
  res.clearCookie(STATE_COOKIE, { path: '/' });

  if (!code || typeof code !== 'string') {
    return res.redirect('/login?error=missing_code');
  }
  if (!state || !expectedState || state !== expectedState) {
    return res.redirect('/login?error=state_mismatch');
  }

  try {
    // Exchange the temporary code for a GitHub access token (server-to-server).
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${APP_BASE_URL}/auth/github/callback`
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData.error || tokenResponse.status);
      return res.redirect('/login?error=token_exchange_failed');
    }

    // Read the GitHub profile so we know who logged in.
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ai-capsule'
      }
    });

    if (!profileResponse.ok) {
      console.error('GitHub profile request failed:', profileResponse.status);
      return res.redirect('/login?error=profile_failed');
    }

    const profile = await profileResponse.json();
    if (!profile?.id) {
      return res.redirect('/login?error=profile_failed');
    }

    // Issue this application's own JWT and store it in the required cookie.
    res.cookie(TOKEN_COOKIE, issueToken(profile), cookieOptions);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect('/login?error=oauth_failed');
  }
});

// --- Session helpers ---------------------------------------------------------

// Who am I? Used by the React app to decide whether to show the dashboard.
router.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/api/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

export default router;
