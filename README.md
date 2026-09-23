# AI Capsule — Cloud-Deployed AI Prompt Manager

A small full-stack web application for saving, reviewing and improving AI prompts.
A user signs in with GitHub, the Express backend issues its own application JWT,
and every prompt record ("capsule") is private to the account that created it.

Built for CSE3CWA / CSE5006 Assignment 3.

---

## 1. Deployed application

| | |
|---|---|
| **Public URL** | `https://YOUR-APP-NAME.onrender.com` <!-- ⬅ REPLACE with your real deployed URL --> |
| **Cloud platform** | Render (free web service) <!-- ⬅ change if you deployed elsewhere --> |
| **Health check** | `https://YOUR-APP-NAME.onrender.com/api/health` → `{"status":"ok"}` |

The React frontend and the Express API are served from **the same deployed
application and the same public origin**. This is the approach recommended in the
assignment: because the browser only ever talks to one origin, no CORS
configuration and no cross-origin cookie settings are required, and the JWT
cookie is a plain same-site cookie.

> **Note on free hosting:** a Render free web service sleeps after a period of
> inactivity. The first request after it sleeps can take 30–60 seconds while the
> service starts up. This is expected behaviour, not an application fault.

---

## 2. Technology

| Component | Choice |
|---|---|
| Frontend | React 19 + React Router 7, bundled with Vite |
| Backend | Node.js + Express 5 |
| Authentication | **GitHub OAuth** (web application flow, implemented directly against GitHub's endpoints) |
| Application session | JWT signed by Express with `jsonwebtoken`, stored in a Secure, HttpOnly cookie named `token` |
| Database | SQLite via `better-sqlite3` |
| Deployment | Render — one web service serving both the API and the built React app |

---

## 3. Project structure

```
ai-capsule/
├── package.json          Server dependencies + build/start scripts
├── .env.example          Environment variable NAMES (no secret values)
├── .gitignore            Excludes .env, node_modules, build output, *.db
├── .node-version         Pins the Node version used by the cloud platform
├── server/
│   ├── index.js          Express app, static React hosting, /api/health
│   ├── auth.js           GitHub OAuth flow, JWT issuing, requireAuth middleware
│   ├── capsules.js       Protected CRUD routes for /api/capsules
│   ├── validate.js       Request body validation rules
│   └── db.js             SQLite connection, schema creation, owner-scoped queries
└── client/
    ├── index.html
    ├── vite.config.js    Dev server + proxy to Express
    └── src/
        ├── main.jsx      React entry point
        ├── App.jsx       Routes: /, /login, /dashboard
        ├── Landing.jsx   Public landing page
        ├── Login.jsx     Public page that starts the OAuth login
        ├── Dashboard.jsx Protected page — lists, creates, edits and deletes records
        ├── CapsuleForm.jsx  Create / edit form with validation
        ├── api.js        fetch wrapper for the Express API
        └── styles.css
```

---

## 4. Installation and how to run

**Requirements:** Node.js 20 or newer (Node 22 recommended) and npm.

### 4.1 Install

```bash
# from the ai-capsule/ folder

npm install                      # installs the Express server dependencies
npm --prefix client install      # installs the React frontend dependencies
```

### 4.2 Configure

```bash
cp .env.example .env
```

Then open `.env` and fill in your own values. Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.3 Run in production mode (one server, same as deployed)

```bash
npm run build     # builds the React app into client/dist
npm start         # starts Express on http://localhost:3000, serving the API and the React app
```

Open <http://localhost:3000>.

### 4.4 Run in development mode (two servers, hot reload)

```bash
npm run dev
```

This starts Express on port 3000 and the Vite dev server on port 5173
simultaneously. Vite proxies `/api` and `/auth` requests through to Express
(see `client/vite.config.js`), so cookies behave exactly as they do in the
single-origin deployed build. Open <http://localhost:5173>.

| Script | What it does |
|---|---|
| `npm start` | Starts the Express server (this is the cloud start command) |
| `npm run build` | Installs client dependencies and builds React into `client/dist` |
| `npm run dev` | Runs the Express server and the Vite dev server together |

---

## 5. Environment variables

Names only — **no real values appear in this repository**. See `.env.example`.

| Variable | Purpose |
|---|---|
| `PORT` | Port Express listens on. Render sets this automatically. |
| `JWT_SECRET` | Secret used to sign and verify the application JWT. |
| `GITHUB_CLIENT_ID` | Client ID of the GitHub OAuth app. |
| `GITHUB_CLIENT_SECRET` | Client secret of the GitHub OAuth app. |
| `APP_BASE_URL` | Public base URL, used to build the OAuth callback URL. |
| `DATABASE_FILE` | Path to the SQLite database file. |
| `NODE_ENV` | `production` when deployed. |
| `COOKIE_SECURE` | Optional. Only ever set to `false` for local plain-http testing; never set in the cloud. |

`.env` is listed in `.gitignore` and is not committed. The server refuses to
start if `JWT_SECRET` is missing, so a misconfigured deployment fails loudly
instead of running with a default secret.

---

## 6. GitHub OAuth app setup

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL:** your deployed URL, e.g. `https://YOUR-APP-NAME.onrender.com`
3. **Authorization callback URL:** `https://YOUR-APP-NAME.onrender.com/auth/github/callback`
4. Copy the Client ID, generate a Client Secret, and store both as environment
   variables on the cloud platform.

For local development, register a second OAuth app with
`http://localhost:3000` and `http://localhost:3000/auth/github/callback`.

GitHub OAuth was used as the primary (recommended) provider; the Google
fallback was not needed.

---

## 7. Deploying to Render

1. Push this project to a GitHub repository. Confirm `.env` is **not** in it.
2. Render → **New → Web Service** → connect the repository.
3. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
4. Add the environment variables from the table in section 5
   (`JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
   `APP_BASE_URL`, `DATABASE_FILE`, `NODE_ENV`). Do not set `PORT` — Render
   provides it. Set `APP_BASE_URL` to the real `https://…onrender.com` URL.
5. Update the GitHub OAuth app's callback URL to the deployed URL.
6. Deploy, then check `https://YOUR-APP-NAME.onrender.com/api/health`.

---

## 8. API routes and how React talks to Express

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page explaining AI Capsule |
| `/login` | Public | Starts the GitHub OAuth login |
| `/dashboard` | Protected | Shows the authenticated user's records |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | **Protected** | Read own records |
| `POST /api/capsules` | **Protected** | Create own record |
| `PUT /api/capsules/:id` | **Protected** | Update own record |
| `DELETE /api/capsules/:id` | **Protected** | Delete own record |

Supporting routes used by the login process and the frontend:

| Route | Access | Purpose |
|---|---|---|
| `GET /auth/github` | Public | Redirects the browser to GitHub to begin OAuth |
| `GET /auth/github/callback` | Public | Receives GitHub's code, issues the app JWT, redirects to `/dashboard` |
| `GET /api/me` | Protected | Returns the signed-in user, so React knows whether to show the dashboard |
| `POST /api/logout` | Public | Clears the `token` cookie |

### How the frontend communicates with the backend

The React app calls the Express API with `fetch` through a small wrapper in
`client/src/api.js`. Because both are served from the same origin, every call
uses a **relative path** such as `/api/capsules` — there is no hard-coded
backend host anywhere in the frontend, so the same build works locally and in
the cloud.

Every request is sent with `credentials: 'include'`, which tells the browser to
attach the HttpOnly `token` cookie. The frontend JavaScript **never reads the
JWT** — it cannot, because the cookie is HttpOnly. It simply relies on the
browser sending it, and treats any `401` response as "the session has ended"
and redirects to `/login`.

Example — creating a record:

```
React (Dashboard.jsx)
  → api.createCapsule(payload)                  client/src/api.js
  → POST /api/capsules  (Cookie: token=…)       browser attaches the cookie
  → requireAuth middleware verifies the JWT     server/auth.js
  → validateCapsule() checks the body           server/validate.js
  → INSERT … user_id = <sub from the JWT>       server/db.js
  → 201 { capsule: … }                          React prepends it to the list
```

---

## 9. OAuth, JWT and backend protection

### How the JWT is issued

1. The user clicks **Continue with GitHub**, which is a full browser navigation
   to `GET /auth/github`.
2. Express generates a random `state` value, stores it in a short-lived HttpOnly
   cookie, and redirects the browser to GitHub's authorize URL.
3. GitHub sends the user back to `GET /auth/github/callback?code=…&state=…`.
   Express **compares the returned `state` against the cookie** and rejects the
   request if they do not match. This protects the callback against cross-site
   request forgery.
4. Express exchanges the code for a GitHub access token server-to-server, then
   calls `https://api.github.com/user` to read the profile.
5. Express signs **its own application JWT** containing `sub` (the GitHub user
   ID), `login`, `name` and `avatar`, with a 7-day expiry and the issuer
   `ai-capsule`.

The GitHub access token is used only on the server, only once, to read the
profile. It is never sent to the browser. The token in the cookie is the
application JWT that this Express server signs and verifies itself.

### How the JWT is stored

```js
// server/auth.js — COOKIE_SECURE defaults to true (see below)
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';

res.cookie('token', token, {
  httpOnly: true,          // JavaScript cannot read it — protects against XSS token theft
  secure: COOKIE_SECURE,   // true when deployed: only transmitted over HTTPS
  sameSite: 'lax',         // sent on the OAuth redirect back, not on cross-site POSTs
  path: '/',
  maxAge: TOKEN_TTL_SECONDS * 1000   // 7 days
});
```

The cookie is named `token`, as required. `localStorage` is **not** used, and no
`Authorization: Bearer` header is used.

`secure` is driven by `COOKIE_SECURE`, which **defaults to `true`**. It is only
set to `false` for local plain-http testing and is never set in the cloud
environment, so the deployed application always sets a Secure cookie.

### How the JWT is verified

`requireAuth` in `server/auth.js` runs on every protected route. It reads the
`token` cookie and calls `jwt.verify(token, JWT_SECRET, { issuer: 'ai-capsule' })`.
A request is rejected with **401** and no capsule data when the token is:

- missing entirely,
- not a valid JWT at all (for example `fake-token-123`),
- signed with a different secret,
- issued by a different issuer,
- expired,
- or missing the `sub` claim.

Only after verification succeeds does the handler run, with
`req.user.id` set from the verified `sub` claim.

### Ownership

`user_id` is **always** taken from the verified JWT and never from the request
body, query string or a header. The API actively rejects any request body
containing a `user_id` field (see section 10).

Every SQL statement that touches an existing row is scoped by `user_id`:

```sql
SELECT … FROM capsules WHERE user_id = ?
UPDATE capsules SET … WHERE id = ? AND user_id = ?
DELETE FROM capsules WHERE id = ? AND user_id = ?
```

So a request for another user's record matches zero rows and returns **404**
rather than modifying anything. 404 (not 403) is deliberate: it does not reveal
whether that record ID exists on another account.

---

## 10. Database

### How it is created

`server/db.js` runs `CREATE TABLE IF NOT EXISTS capsules (…)` on start-up, so
the database initialises itself on a fresh deployment with **no manual migration
step**. The schema follows the one given in the assignment, with `CHECK`
constraints added as a second layer of defence.

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           TEXT    NOT NULL,
  project_name      TEXT    NOT NULL,
  prompt_title      TEXT    NOT NULL,
  prompt_version    TEXT,
  prompt_text       TEXT    NOT NULL,
  response_summary  TEXT,
  category          TEXT,
  usefulness        TEXT,
  reviewed          INTEGER NOT NULL DEFAULT 0,
  improved          INTEGER NOT NULL DEFAULT 0,
  screenshot_url    TEXT,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

`user_id` stores the **GitHub user ID** taken from the verified JWT's `sub`
claim. An index on `user_id` supports the owner-scoped reads.

SQLite has no boolean type, so `reviewed` and `improved` are stored as `0`/`1`
and converted back to real JSON booleans before being returned to the client.

### Validation

Every field is validated in `server/validate.js` **before** it reaches the
database, and all problems in a request are reported together rather than one
at a time:

- required fields (`project_name`, `prompt_title`, `prompt_text`) must be
  present and non-empty after trimming;
- every field is checked for its exact JSON type — `"true"` as a string is
  rejected where a boolean is required, rather than silently coerced;
- every string has an explicit maximum length;
- `category` must be one of *Coding, Writing, Research, Debugging, Study, Other*;
- `usefulness` must be *Good* or *Needs Improvement*;
- `screenshot_url` must parse as an absolute `http://` or `https://` URL;
- `:id` must be a positive integer, so a malformed ID is a clean `400` rather
  than an unexpected error;
- **unknown fields are rejected**, so a client cannot supply `user_id`, `id` or
  `created_at` — those are set by the server alone.

The React form mirrors these rules for immediate feedback, but the server
validates independently and is the real guard.

### Persistence — an important limitation

The deployed application uses **SQLite on Render's local filesystem, which is
ephemeral**. Render's free web service filesystem does not survive a restart or
a redeployment, so **saved capsule records are lost when the service restarts or
is redeployed**. This is a property of the free hosting tier, not a bug in the
application.

Within a running instance, data persists normally: records created during a
session remain available across page reloads and new sign-ins for as long as the
instance stays up.

Moving to durable storage would require only changing `server/db.js` — for
example to a managed PostgreSQL instance — because every database access is
already isolated in that one module behind a small set of functions.

---

## 11. Required cURL tests

Both tests were run against the **deployed** application.

<!-- ⬅ AFTER DEPLOYING: re-run both commands against your real URL and paste the
     actual terminal output below, replacing YOUR-APP-NAME throughout. -->

### Test 1 — no authentication

```bash
curl -i https://YOUR-APP-NAME.onrender.com/api/capsules
```

Result obtained:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Authentication required."}
```

### Test 2 — fake / invalid JWT

```bash
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP-NAME.onrender.com/api/capsules
```

Result obtained:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Invalid or expired session."}
```

**Both tests return 401 Unauthorized and no capsule data.** The two responses
differ deliberately: Test 1 shows the backend requires authentication at all,
and Test 2 shows the backend actually *verifies the signature* rather than
merely checking that a cookie is present.

`POST`, `PUT` and `DELETE` are protected by the same `requireAuth` middleware
and also return 401 without a valid JWT:

```bash
curl -i -X POST   -H "Content-Type: application/json" -d '{}' https://YOUR-APP-NAME.onrender.com/api/capsules      # 401
curl -i -X PUT    -H "Content-Type: application/json" -d '{}' https://YOUR-APP-NAME.onrender.com/api/capsules/1    # 401
curl -i -X DELETE                                             https://YOUR-APP-NAME.onrender.com/api/capsules/1    # 401
```

---

## 12. One honest limitation

**The application JWT cannot be revoked before it expires.** The token is
stateless and valid for seven days. Signing out clears the cookie in the
browser, which is enough for normal use — but if a token had already been copied
out of the browser before signing out, the server would still accept it until it
expired, because the server keeps no list of valid or revoked sessions. A
production system would address this with short-lived access tokens plus a
refresh token, or by storing a session identifier server-side so it can be
invalidated immediately. Refresh tokens are listed as optional in the
assignment, so a single 7-day token was used deliberately to keep the
authentication flow small and explainable.

A second, smaller limitation is the ephemeral SQLite storage described in
section 10.

---

## 13. AI-assisted development

### Tools used

<!-- ⬅ EDIT this line so it names the tool(s) you actually used -->
Claude (Anthropic) was used as a coding assistant for project scaffolding, the
React components, the Express routes, the SQLite queries, the OAuth/JWT
integration and the deployment configuration.

### A problem found and corrected in AI-generated code

The standard single-page-application fallback route that AI tools and most
tutorials produce is the Express 4 pattern:

```js
app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
```

This project uses **Express 5**, where that line does not merely misbehave — it
throws at start-up, so the server never boots:

```
PathError: Missing parameter name at index 1: *
```

Express 5 upgraded to `path-to-regexp` v8, which no longer accepts a bare `*` as
a wildcard path; a named wildcard such as `/*splat` is required instead. The
fallback was rewritten as a terminal middleware, which needs no path pattern at
all and therefore does not depend on that syntax change:

```js
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});
```

It is registered *after* the API routes, so `/api/...` paths are handled by the
API first and never fall through to the React page.

A second correction: the first version returned SQLite's raw rows straight to
the client, so `reviewed` and `improved` arrived as `0` and `1` rather than
booleans. React then rendered an unchecked checkbox for the value `1`. SQLite
has no boolean type, so `server/db.js` now converts those two columns back to
real JSON booleans on the way out, and `server/validate.js` requires real
booleans on the way in.

### How OAuth login, JWT verification and protected API behaviour were verified

- Completed a real GitHub OAuth login against the deployed URL and confirmed the
  browser was redirected to `/dashboard` with a `token` cookie present.
- Inspected the cookie in the browser developer tools and confirmed the
  `HttpOnly`, `Secure` and `SameSite=Lax` attributes, and that the cookie is
  named `token`.
- Ran cURL Test 1 (no cookie) and Test 2 (`token=fake-token-123`) against the
  deployed `GET /api/capsules` and confirmed both return **401** with no capsule
  data.
- Additionally confirmed 401 for a token signed with a *different secret*, a
  token with a *different issuer*, an *expired* token, and a token *missing the
  `sub` claim* — proving the signature, issuer and expiry are all genuinely
  checked, not just the presence of a cookie.
- Confirmed `POST`, `PUT` and `DELETE` also return 401 without a valid JWT.
- Confirmed that signing out clears the cookie and that the next
  `GET /api/capsules` returns 401.

### How CRUD behaviour and user data ownership were verified

- Performed the full CREATE → READ → UPDATE → DELETE cycle through the deployed
  React dashboard and confirmed each change persisted after a page reload.
- Verified ownership with two different signed-in identities: after user A
  created a record, user B's `GET /api/capsules` returned an empty list, and
  user B's `PUT` and `DELETE` against user A's record ID both returned **404**
  while user A's record remained unchanged.
- Confirmed that a request body containing `user_id` is rejected, so the record
  owner cannot be set or changed by the client.
- Confirmed invalid input is rejected with **400** and a list of specific field
  errors, and that a malformed `:id` returns 400 rather than a server error.

### One implementation decision explained

**Serving the React frontend and the Express API from a single deployed service
and a single origin.** The alternative is deploying the frontend as a separate
static site and the API as a separate service.

The single-origin design was chosen because the session is carried in a cookie.
A split deployment would put the frontend and the API on different origins, so
the JWT cookie would become a *third-party* cookie. It would then need
`SameSite=None` to be sent at all, the API would need a CORS configuration with
`Access-Control-Allow-Credentials: true` and an explicit allow-list of origins,
and browsers that block third-party cookies by default would break the login
entirely. Serving both from one origin removes that whole class of problem: the
cookie is same-site, `SameSite=Lax` is sufficient, no CORS middleware is needed,
and the frontend can call the API with relative paths such as `/api/capsules`.

The practical consequence is that the frontend has **no hard-coded backend URL**
anywhere, so exactly the same build runs locally and in the cloud. During local
development the Vite dev server proxies `/api` and `/auth` to Express
(`client/vite.config.js`), which reproduces the same single-origin behaviour so
cookies work identically in development and in production.
