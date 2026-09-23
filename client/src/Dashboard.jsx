import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from './api.js';
import CapsuleForm from './CapsuleForm.jsx';

export default function Dashboard() {
  const navigate = useNavigate();

  // The session check and the capsule request are tracked separately, so the
  // page never shows "no capsules yet" or an error while a request is still
  // in flight.
  const [sessionState, setSessionState] = useState('loading'); // loading | ready
  const [user, setUser] = useState(null);

  const [capsulesState, setCapsulesState] = useState('idle'); // idle | loading | ready | error
  const [capsules, setCapsules] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Any 401 from any request means the session is gone: send the user to /login.
  const handleUnauthorised = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadCapsules = useCallback(async () => {
    setCapsulesState('loading');
    setLoadError(null);
    try {
      const data = await api.listCapsules();
      setCapsules(data.capsules);
      setCapsulesState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorised();
        return;
      }
      setLoadError(error.message);
      setCapsulesState('error');
    }
  }, [handleUnauthorised]);

  // Confirm the session first, then load the records.
  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setSessionState('ready');
        loadCapsules();
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorised();
        } else {
          // The server could not be reached at all.
          setSessionState('ready');
          setCapsulesState('error');
          setLoadError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadCapsules, handleUnauthorised]);

  // A save or delete is in progress: lock the other controls so two writes
  // cannot overlap.
  const busy = saving || deletingId !== null;

  function openCreateForm() {
    setEditing(null);
    setFormErrors([]);
    setActionError(null);
    setShowForm(true);
  }

  function openEditForm(capsule) {
    setEditing(capsule);
    setFormErrors([]);
    setActionError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setFormErrors([]);
  }

  async function handleSubmit(payload) {
    setSaving(true);
    setFormErrors([]);
    setActionError(null);

    try {
      if (editing) {
        const data = await api.updateCapsule(editing.id, payload);
        setCapsules((current) =>
          current.map((item) => (item.id === editing.id ? data.capsule : item))
        );
        setNotice(`Capsule #${editing.id} updated.`);
      } else {
        const data = await api.createCapsule(payload);
        setCapsules((current) => [data.capsule, ...current]);
        setNotice('Capsule added.');
      }
      closeForm();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorised();
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        // The record was removed elsewhere; refresh so the list is accurate.
        setActionError('That capsule no longer exists. The list has been refreshed.');
        closeForm();
        loadCapsules();
        return;
      }
      setFormErrors(error.details?.length > 0 ? error.details : [error.message]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(capsule) {
    const confirmed = window.confirm(
      `Delete "${capsule.prompt_title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(capsule.id);
    setActionError(null);

    try {
      await api.deleteCapsule(capsule.id);
      setCapsules((current) => current.filter((item) => item.id !== capsule.id));
      setNotice(`Capsule #${capsule.id} deleted.`);
      if (editing?.id === capsule.id) closeForm();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorised();
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setCapsules((current) => current.filter((item) => item.id !== capsule.id));
        setActionError('That capsule had already been deleted.');
        return;
      }
      setActionError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Even if the request fails, send the user back to the public site.
    }
    navigate('/', { replace: true });
  }

  // --- Session check ---------------------------------------------------------
  if (sessionState === 'loading') {
    return (
      <div className="page">
        <main className="centered-card">
          <p className="muted" role="status" aria-live="polite">Checking your session…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="site-header">
        <Link className="brand" to="/">AI&nbsp;Capsule</Link>
        <div className="header-right">
          {user && (
            <span className="user-chip">
              {user.avatar && <img src={user.avatar} alt="" width="24" height="24" />}
              {user.name || user.login}
            </span>
          )}
          <button type="button" className="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-head">
          <div>
            <h1>Your capsules</h1>
            <p className="muted">
              {capsulesState === 'ready'
                ? `${capsules.length} saved ${capsules.length === 1 ? 'record' : 'records'}`
                : 'Loading your saved records…'}
            </p>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={openCreateForm}
            // Disabled until the list has loaded, and while a write is running,
            // so a record cannot be added against an unknown state.
            disabled={capsulesState !== 'ready' || busy || (showForm && !editing)}
          >
            New capsule
          </button>
        </div>

        {notice && (
          <p className="alert alert-success" role="status">
            {notice}
            <button type="button" className="link-button" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </p>
        )}

        {actionError && (
          <p className="alert alert-error" role="alert">
            {actionError}
            <button type="button" className="link-button" onClick={() => setActionError(null)}>
              Dismiss
            </button>
          </p>
        )}

        {showForm && (
          <CapsuleForm
            key={editing ? `edit-${editing.id}` : 'create'}
            capsule={editing}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            saving={saving}
            serverErrors={formErrors}
            disabled={deletingId !== null}
          />
        )}

        {/* Loading, error, empty and loaded are four distinct states. */}
        {capsulesState === 'loading' && (
          <p className="muted" role="status" aria-live="polite">Loading your capsules…</p>
        )}

        {capsulesState === 'error' && (
          <div className="alert alert-error" role="alert">
            <p>{loadError || 'Your capsules could not be loaded.'}</p>
            <button type="button" className="button" onClick={loadCapsules}>Try again</button>
          </div>
        )}

        {capsulesState === 'ready' && capsules.length === 0 && (
          <div className="empty-state">
            <h2>No capsules yet</h2>
            <p className="muted">
              Save your first prompt and it will appear here.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateForm}
              disabled={busy || showForm}
            >
              Add your first capsule
            </button>
          </div>
        )}

        {capsulesState === 'ready' && capsules.length > 0 && (
          <ul className="capsule-list">
            {capsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                onEdit={() => openEditForm(capsule)}
                onDelete={() => handleDelete(capsule)}
                deleting={deletingId === capsule.id}
                disabled={busy || (showForm && editing?.id !== capsule.id)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function CapsuleCard({ capsule, onEdit, onDelete, deleting, disabled }) {
  return (
    <li className="capsule-card">
      <div className="capsule-card-head">
        <div>
          <h3>{capsule.prompt_title}</h3>
          <p className="capsule-meta">
            <span className="tag">{capsule.project_name}</span>
            {capsule.prompt_version && <span className="tag tag-muted">{capsule.prompt_version}</span>}
            {capsule.category && <span className="tag tag-muted">{capsule.category}</span>}
            {capsule.usefulness && (
              <span className={`tag ${capsule.usefulness === 'Good' ? 'tag-good' : 'tag-warn'}`}>
                {capsule.usefulness}
              </span>
            )}
          </p>
        </div>
        <div className="capsule-actions">
          <button type="button" className="button" onClick={onEdit} disabled={disabled || deleting}>
            Edit
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={onDelete}
            disabled={disabled || deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <pre className="prompt-text">{capsule.prompt_text}</pre>

      {capsule.response_summary && (
        <p className="capsule-section"><strong>Response:</strong> {capsule.response_summary}</p>
      )}
      {capsule.notes && (
        <p className="capsule-section"><strong>Notes:</strong> {capsule.notes}</p>
      )}
      {capsule.screenshot_url && (
        <p className="capsule-section">
          <strong>Evidence:</strong>{' '}
          <a href={capsule.screenshot_url} target="_blank" rel="noreferrer noopener">
            {capsule.screenshot_url}
          </a>
        </p>
      )}

      <p className="capsule-footer">
        <span className={capsule.reviewed ? 'flag flag-on' : 'flag'}>
          {capsule.reviewed ? '✓ Reviewed' : 'Not reviewed'}
        </span>
        <span className={capsule.improved ? 'flag flag-on' : 'flag'}>
          {capsule.improved ? '✓ Improved' : 'Not improved'}
        </span>
        <span className="muted">#{capsule.id} · {formatDate(capsule.created_at)}</span>
      </p>
    </li>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
