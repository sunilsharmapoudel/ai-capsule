// ---------------------------------------------------------------------------
// Request body validation for capsule records.
//
// Rules enforced here (not left to the database):
//   * every field is checked for its exact JSON type - no silent coercion, so
//     "true" (a string) is rejected where a boolean is required;
//   * required fields must be present and non-empty after trimming;
//   * every string has an explicit maximum length;
//   * category and usefulness must be one of the allowed values;
//   * screenshot_url must parse as an absolute http(s) URL;
//   * unknown fields are rejected, so a client cannot inject columns such as
//     user_id, id or created_at (these are set by the server only);
//   * all problems are collected and returned together, not just the first.
// ---------------------------------------------------------------------------

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

// Fields a client is allowed to send. Anything else is rejected.
const ALLOWED_FIELDS = [
  'project_name', 'prompt_title', 'prompt_version', 'prompt_text',
  'response_summary', 'category', 'usefulness', 'reviewed', 'improved',
  'screenshot_url', 'notes'
];

const REQUIRED_TEXT = ['project_name', 'prompt_title', 'prompt_text'];
const OPTIONAL_TEXT = ['prompt_version', 'response_summary', 'notes'];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates a capsule payload for both POST (create) and PUT (full update).
 *
 * @returns {{ errors: string[], value: object|null }}
 *   `errors` is empty when the payload is valid, in which case `value` holds
 *   the cleaned record, ready to be written to the database.
 */
export function validateCapsule(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    return { errors: ['Request body must be a JSON object.'], value: null };
  }

  // --- reject anything we do not own ----------------------------------------
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (unknown.length > 0) {
    errors.push(`Unknown field(s) not allowed: ${unknown.join(', ')}.`);
  }

  const value = {};

  // --- required text fields --------------------------------------------------
  for (const field of REQUIRED_TEXT) {
    const raw = body[field];
    if (raw === undefined || raw === null) {
      errors.push(`${field} is required.`);
      continue;
    }
    if (typeof raw !== 'string') {
      errors.push(`${field} must be a string.`);
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      errors.push(`${field} must not be empty.`);
      continue;
    }
    if (trimmed.length > MAX[field]) {
      errors.push(`${field} must be ${MAX[field]} characters or fewer.`);
      continue;
    }
    value[field] = trimmed;
  }

  // --- optional text fields --------------------------------------------------
  // Absent, null or empty all mean "no value" and are stored as null.
  for (const field of OPTIONAL_TEXT) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') {
      value[field] = null;
      continue;
    }
    if (typeof raw !== 'string') {
      errors.push(`${field} must be a string.`);
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed.length > MAX[field]) {
      errors.push(`${field} must be ${MAX[field]} characters or fewer.`);
      continue;
    }
    value[field] = trimmed.length === 0 ? null : trimmed;
  }

  // --- constrained value lists -----------------------------------------------
  for (const [field, allowed] of [['category', CATEGORIES], ['usefulness', USEFULNESS]]) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') {
      value[field] = null;
      continue;
    }
    if (typeof raw !== 'string') {
      errors.push(`${field} must be a string.`);
      continue;
    }
    if (!allowed.includes(raw)) {
      errors.push(`${field} must be one of: ${allowed.join(', ')}.`);
      continue;
    }
    value[field] = raw;
  }

  // --- booleans --------------------------------------------------------------
  // Must be real JSON booleans. Strings such as "true" or numbers such as 1
  // are rejected rather than coerced.
  for (const field of ['reviewed', 'improved']) {
    const raw = body[field];
    if (raw === undefined || raw === null) {
      value[field] = false;
      continue;
    }
    if (typeof raw !== 'boolean') {
      errors.push(`${field} must be a boolean (true or false).`);
      continue;
    }
    value[field] = raw;
  }

  // --- screenshot URL --------------------------------------------------------
  const url = body.screenshot_url;
  if (url === undefined || url === null || url === '') {
    value.screenshot_url = null;
  } else if (typeof url !== 'string') {
    errors.push('screenshot_url must be a string.');
  } else {
    const trimmed = url.trim();
    if (trimmed.length === 0) {
      value.screenshot_url = null;
    } else if (trimmed.length > MAX.screenshot_url) {
      errors.push(`screenshot_url must be ${MAX.screenshot_url} characters or fewer.`);
    } else if (!isHttpUrl(trimmed)) {
      errors.push('screenshot_url must be a valid http:// or https:// URL.');
    } else {
      value.screenshot_url = trimmed;
    }
  }

  return { errors, value: errors.length === 0 ? value : null };
}

function isHttpUrl(candidate) {
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

/**
 * Validates an :id route parameter.
 * Accepts only a positive integer, so a malformed id is a clean 400 rather
 * than an unexpected database error.
 *
 * @returns {number|null} the parsed id, or null when invalid.
 */
export function parseId(raw) {
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}
