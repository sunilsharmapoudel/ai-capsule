import { Link } from 'react-router-dom';
import Brand from './Brand.jsx';
import Icon from './Icons.jsx';

const FEATURES = [
  {
    icon: 'save',
    tone: '',
    title: 'Save a prompt',
    body: 'Store the prompt text along with its project, version, category and notes, so a prompt that worked is never lost in a chat history.'
  },
  {
    icon: 'star',
    tone: 'tone-gold',
    title: 'Review and improve',
    body: 'Mark a record as reviewed, rate how useful the answer was, and track whether a later version of the prompt improved the output.'
  },
  {
    icon: 'shield',
    tone: 'tone-ember',
    title: 'Private to you',
    body: 'You sign in with GitHub and only ever see the records saved under your own account. Nothing is shared between users.'
  }
];

const STEPS = [
  { title: 'Sign in with GitHub', body: 'No new password to remember.' },
  { title: 'Capture the prompt', body: 'Paste it in with a summary of what came back.' },
  { title: 'Rate and revise', body: 'Come back later and sharpen the wording.' }
];

export default function Landing() {
  return (
    <div className="page">
      <header className="site-header">
        <Brand to={null} />
        <Link className="button button-primary" to="/login">
          Sign in
          <Icon name="arrowRight" size={16} />
        </Link>
      </header>

      <main className="hero">
        <span className="eyebrow">
          <Icon name="sparkle" size={14} strokeWidth={2} />
          Your prompt library
        </span>

        <h1>Keep every prompt that <em>actually worked</em>.</h1>

        <p className="lead">
          AI Capsule is a private prompt library. Save the prompts you use with tools
          such as ChatGPT, Copilot, Gemini and Claude, record what the AI returned,
          rate how useful it was, and come back later to improve it.
        </p>

        <div className="hero-actions">
          <Link className="button button-github button-large" to="/login">
            <Icon name="github" size={18} />
            Sign in with GitHub
          </Link>
          <a className="button button-large" href="#features">
            See what it does
          </a>
        </div>

        <p className="section-label" id="features">What you get</p>

        <ul className="feature-list">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <span className={`feature-icon ${feature.tone}`.trim()}>
                <Icon name={feature.icon} size={21} />
              </span>
              <strong>{feature.title}</strong>
              {feature.body}
            </li>
          ))}
        </ul>

        <p className="section-label">How it works</p>

        <ol className="step-list">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="step-number">{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                {step.body}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <footer className="site-footer">
        <Icon name="capsule" size={14} />
        AI Capsule &middot; CSE3CWA / CSE5006 Assignment 3
      </footer>
    </div>
  );
}
