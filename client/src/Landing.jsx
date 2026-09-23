import { Link } from 'react-router-dom';

// Public page. Explains what AI Capsule is and links to the login page.
export default function Landing() {
  return (
    <div className="page">
      <header className="site-header">
        <span className="brand">AI&nbsp;Capsule</span>
        <Link className="button button-primary" to="/login">Sign in</Link>
      </header>

      <main className="hero">
        <h1>Keep every prompt that actually worked.</h1>
        <p className="lead">
          AI Capsule is a private prompt library. Save the prompts you use with tools
          such as ChatGPT, Copilot, Gemini and Claude, record what the AI returned,
          rate how useful it was, and come back later to improve it.
        </p>

        <ul className="feature-list">
          <li>
            <strong>Save a prompt</strong>
            Store the prompt text along with its project, version, category and notes.
          </li>
          <li>
            <strong>Review and improve</strong>
            Mark a record as reviewed, rate its usefulness and track whether the output improved.
          </li>
          <li>
            <strong>Private to you</strong>
            You sign in with GitHub and only ever see the records saved under your own account.
          </li>
        </ul>

        <Link className="button button-primary button-large" to="/login">
          Sign in with GitHub to get started
        </Link>
      </main>

      <footer className="site-footer">
        AI Capsule &middot; CSE3CWA / CSE5006 Assignment 3
      </footer>
    </div>
  );
}
