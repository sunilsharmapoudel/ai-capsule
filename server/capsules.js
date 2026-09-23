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

router.get('/', requireAuth, (req, res) => {
  const capsules = listCapsules(req.user.id);
  res.json({ capsules });
});

router.post('/', requireAuth, (req, res) => {
  const { errors, value } = validateCapsule(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  const capsule = createCapsule(req.user.id, value);
  res.status(201).location(`/api/capsules/${capsule.id}`).json({ capsule });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Capsule id must be a positive integer.' });
  }

  const { errors, value } = validateCapsule(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  const capsule = updateCapsule(id, req.user.id, value);
  if (!capsule) {
    return res.status(404).json({ error: 'Capsule not found.' });
  }

  res.json({ capsule });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Capsule id must be a positive integer.' });
  }

  const removed = deleteCapsule(id, req.user.id);
  if (!removed) {
    return res.status(404).json({ error: 'Capsule not found.' });
  }

  res.json({ ok: true, id });
});

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
