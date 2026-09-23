// ---------------------------------------------------------------------------
// Capsule CRUD API - mounted at /api/capsules.
//
// SECURITY: every route below passes through requireAuth (the JWT middleware),
// so a request with no token or an invalid token is rejected with 401 before
// any handler runs. The owner is always req.user.id, which comes from the
// verified JWT - never from the request body, query string or a header.
// ---------------------------------------------------------------------------
import express from 'express';
import { requireAuth } from './auth.js';
import { validateCapsule, parseId } from './validate.js';
import {
  listCapsules,
  getCapsule,
  createCapsule,
  updateCapsule,
  deleteCapsule
} from './db.js';

const router = express.Router();

// READ - only the authenticated user's own records.
router.get('/', requireAuth, (req, res) => {
  const capsules = listCapsules(req.user.id);
  res.json({ capsules });
});

// CREATE - the record is saved against the authenticated user.
router.post('/', requireAuth, (req, res) => {
  const { errors, value } = validateCapsule(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  const capsule = createCapsule(req.user.id, value);
  res.status(201).location(`/api/capsules/${capsule.id}`).json({ capsule });
});

// UPDATE - a full replacement of one record the authenticated user owns.
router.put('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Capsule id must be a positive integer.' });
  }

  const { errors, value } = validateCapsule(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  // The UPDATE statement itself is scoped by user_id, so a record belonging to
  // another user is never modified; it simply matches no rows and returns null.
  const capsule = updateCapsule(id, req.user.id, value);
  if (!capsule) {
    return res.status(404).json({ error: 'Capsule not found.' });
  }

  res.json({ capsule });
});

// DELETE - removes one record the authenticated user owns.
router.delete('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Capsule id must be a positive integer.' });
  }

  // Scoped by user_id for the same reason as UPDATE above.
  const removed = deleteCapsule(id, req.user.id);
  if (!removed) {
    return res.status(404).json({ error: 'Capsule not found.' });
  }

  res.json({ ok: true, id });
});

// Read a single owned record. Not required by the specification, but it keeps
// the resource complete and is used after a failed optimistic update.
router.get('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Capsule id must be a positive integer.' });
  }

  const capsule = getCapsule(id, req.user.id);
  if (!capsule) {
    return res.status(404).json({ error: 'Capsule not found.' });
  }

  res.json({ capsule });
});

export default router;
