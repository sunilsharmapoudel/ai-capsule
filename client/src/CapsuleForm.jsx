import { useState } from 'react';
import Icon from './Icons.jsx';

export const CATEGORIES = ['Coding', 'Writing', 'Research', 'Debugging', 'Study', 'Other'];
export const USEFULNESS = ['Good', 'Needs Improvement'];

const MAX = {
  project_name: 120,
  prompt_title: 120,
  prompt_version: 30,
  prompt_text: 5000,
  response_summary: 2000,
  screenshot_url: 2000,
  notes: 2000
};

const EMPTY = {
  project_name: '',
  prompt_title: '',
  prompt_version: '',
  prompt_text: '',
  response_summary: '',
  category: '',
  usefulness: '',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: ''
};

function toFormState(capsule) {
  if (!capsule) return { ...EMPTY };
  return {
    project_name: capsule.project_name ?? '',
    prompt_title: capsule.prompt_title ?? '',
    prompt_version: capsule.prompt_version ?? '',
    prompt_text: capsule.prompt_text ?? '',
    response_summary: capsule.response_summary ?? '',
    category: capsule.category ?? '',
    usefulness: capsule.usefulness ?? '',
    reviewed: Boolean(capsule.reviewed),
    improved: Boolean(capsule.improved),
    screenshot_url: capsule.screenshot_url ?? '',
    notes: capsule.notes ?? ''
  };
}

// Mirrors the server-side rules so problems are shown before a request is sent.
// The server validates independently; this is a convenience, not the guard.
function validate(form) {
  const errors = {};

  for (const field of ['project_name', 'prompt_title', 'prompt_text']) {
    const trimmed = form[field].trim();
    if (trimmed.length === 0) errors[field] = 'This field is required.';
    else if (trimmed.length > MAX[field]) errors[field] = `Maximum ${MAX[field]} characters.`;
  }

  for (const field of ['prompt_version', 'response_summary', 'notes']) {
    if (form[field].trim().length > MAX[field]) {
      errors[field] = `Maximum ${MAX[field]} characters.`;
    }
  }

  const url = form.screenshot_url.trim();
  if (url.length > 0) {
    if (url.length > MAX.screenshot_url) {
      errors.screenshot_url = `Maximum ${MAX.screenshot_url} characters.`;
    } else {
      let parsed = null;
      try {
        parsed = new URL(url);
      } catch {
        parsed = null;
      }
      if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
        errors.screenshot_url = 'Enter a full http:// or https:// URL.';
      }
    }
  }

  return errors;
}

// Builds the exact JSON body the API expects: trimmed strings, real booleans,
// and null for anything left blank.
function toPayload(form) {
  const text = (v) => (v.trim().length === 0 ? null : v.trim());
  return {
    project_name: form.project_name.trim(),
    prompt_title: form.prompt_title.trim(),
    prompt_version: text(form.prompt_version),
    prompt_text: form.prompt_text.trim(),
    response_summary: text(form.response_summary),
    category: form.category === '' ? null : form.category,
    usefulness: form.usefulness === '' ? null : form.usefulness,
    reviewed: form.reviewed,
    improved: form.improved,
    screenshot_url: text(form.screenshot_url),
    notes: text(form.notes)
  };
}

export default function CapsuleForm({ capsule, onSubmit, onCancel, saving, serverErrors, disabled }) {
  const [form, setForm] = useState(() => toFormState(capsule));
  const [touched, setTouched] = useState(false);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = Boolean(capsule);
  // Controls are locked while the record is being saved, and also whenever the
  // parent reports that another request is already in flight.
  const locked = saving || disabled;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (hasErrors || locked) return;
    onSubmit(toPayload(form));
  }

  // Only show a field error once the user has tried to submit.
  const errorFor = (field) => (touched ? errors[field] : undefined);

  // Renders one labelled control plus its hint / error text.
  const renderField = (name, label, { type = 'text', required = false, rows = 0, hint = '', icon = '' } = {}) => {
    const message = errorFor(name);
    const id = `field-${name}`;
    const Control = rows > 0 ? 'textarea' : 'input';
    return (
      <div className={`form-field${message ? ' has-error' : ''}`}>
        <label htmlFor={id}>
          {icon && <Icon name={icon} size={13} strokeWidth={2} />}
          {label} {required && <span className="required" aria-hidden="true">*</span>}
        </label>
        <Control
          id={id}
          type={rows > 0 ? undefined : type}
          rows={rows > 0 ? rows : undefined}
          value={form[name]}
          maxLength={MAX[name]}
          onChange={(event) => update(name, event.target.value)}
          disabled={locked}
          aria-invalid={message ? 'true' : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
        />
        {hint && !message && <span className="hint">{hint}</span>}
        {message && (
          <span className="field-error" id={`${id}-error`}>
            <Icon name="alert" size={13} strokeWidth={2} />
            {message}
          </span>
        )}
      </div>
    );
  };

  return (
    <form className="capsule-form" onSubmit={handleSubmit} noValidate>
      <h2>
        <Icon name={isEditing ? 'pencil' : 'plus'} size={19} strokeWidth={2} />
        {isEditing ? `Edit capsule #${capsule.id}` : 'Add a new capsule'}
      </h2>

      {serverErrors?.length > 0 && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert" size={16} />
          <div className="alert-body">
            <strong>The server rejected this record:</strong>
            <ul>
              {serverErrors.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="form-grid">
        {renderField('project_name', 'Project name', { required: true, hint: 'e.g. SmartFarm Irrigation', icon: 'folder' })}
        {renderField('prompt_title', 'Prompt title', { required: true, hint: 'e.g. Debug cloud deployment', icon: 'bookmark' })}
        {renderField('prompt_version', 'Prompt version', { hint: 'e.g. v1, v2, v3', icon: 'hash' })}

        <div className="form-field">
          <label htmlFor="field-category">
            <Icon name="tag" size={13} strokeWidth={2} />
            Category
          </label>
          <select
            id="field-category"
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            disabled={locked}
          >
            <option value="">Not set</option>
            {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="field-usefulness">
            <Icon name="star" size={13} strokeWidth={2} />
            Usefulness
          </label>
          <select
            id="field-usefulness"
            value={form.usefulness}
            onChange={(event) => update('usefulness', event.target.value)}
            disabled={locked}
          >
            <option value="">Not set</option>
            {USEFULNESS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {renderField('screenshot_url', 'Screenshot evidence URL', { hint: 'Optional link to a screenshot', icon: 'image' })}
      </div>

      {renderField('prompt_text', 'Prompt text', { required: true, rows: 5, icon: 'terminal' })}
      {renderField('response_summary', 'Response summary', { rows: 3, hint: 'What did the AI actually return?', icon: 'message' })}
      {renderField('notes', 'Notes', { rows: 2, hint: 'Reflection or comment', icon: 'note' })}

      <div className="checkbox-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.reviewed}
            onChange={(event) => update('reviewed', event.target.checked)}
            disabled={locked}
          />
          <Icon name="circleCheck" size={15} />
          Response reviewed
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.improved}
            onChange={(event) => update('improved', event.target.checked)}
            disabled={locked}
          />
          <Icon name="trending" size={15} />
          Output improved
        </label>
      </div>

      {touched && hasErrors && (
        <p className="alert alert-error" role="alert">
          <Icon name="alert" size={16} />
          <span className="alert-body">Please fix the highlighted fields before saving.</span>
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={locked || (touched && hasErrors)}
        >
          {saving ? <span className="spinner" /> : <Icon name="save" size={16} />}
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add capsule'}
        </button>
        {onCancel && (
          <button type="button" className="button button-ghost" onClick={onCancel} disabled={saving}>
            <Icon name="x" size={16} />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
