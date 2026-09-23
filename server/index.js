// ---------------------------------------------------------------------------
// AI Capsule - Express server.
//
// A single deployed application serves both the built React frontend and the
// Express API from the same public origin, which is what the assignment
// recommends: no CORS and no cross-origin cookie configuration is needed.
// ---------------------------------------------------------------------------
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRouter from './auth.js';
import capsulesRouter from './capsules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const PORT = process.env.PORT || 3000;

// --- Fail fast on missing configuration --------------------------------------
// Secrets live in environment variables only; nothing is hard-coded here.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Add it to your .env file or cloud environment variables.');
  process.exit(1);
}
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn('WARNING: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not set. OAuth login will not work.');
}

const app = express();

// Render and similar platforms terminate TLS at a proxy in front of the app.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// --- Public health check -----------------------------------------------------
// Deliberately registered before any authentication so the deployed backend
// can be checked independently.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- OAuth login and session routes ------------------------------------------
app.use(authRouter);

// --- Protected capsule API ---------------------------------------------------
// Every route inside this router applies the requireAuth JWT middleware.
app.use('/api/capsules', capsulesRouter);

// Any other /api path is a JSON 404, so the SPA fallback below never returns
// an HTML page to a client that asked for JSON.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// --- React frontend ----------------------------------------------------------
const hasBuild = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));

if (hasBuild) {
  app.use(express.static(CLIENT_DIST));

  // Client-side routing: /, /login and /dashboard are all served by the same
  // index.html so a direct visit or a refresh works.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  console.warn('WARNING: client/dist not found. Run "npm run build" to build the React frontend.');
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res
      .status(503)
      .type('text/plain')
      .send('React frontend is not built yet. Run "npm run build" and restart the server.');
  });
}

// --- Error handler -----------------------------------------------------------
// Keeps malformed input as a clean 400 and never leaks a stack trace.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
});

export default app;
