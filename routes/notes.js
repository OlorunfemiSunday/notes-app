const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middlewares/auth');
const { createNote, listNotes, getNote, updateNote, deleteNote } = require('../controllers/notesController');

const router = express.Router();

// protect all routes
router.use(auth);

// Create note
router.post('/', [
  body('title').isString().trim().notEmpty().withMessage('Title required'),
  body('content').isString().trim().notEmpty().withMessage('Content required'),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return createNote(req, res);
});

// List notes with optional tag filtering: ?tag=work or ?tags=work,urgent
router.get('/', [
  query('tag').optional().isString(),
  query('tags').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return listNotes(req, res);
});

// Get single note
router.get('/:id', getNote);

// Update
router.put('/:id', [
  body('title').optional().isString(),
  body('content').optional().isString(),
  body('tags').optional().isArray()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return updateNote(req, res);
});

// Delete
router.delete('/:id', deleteNote);

module.exports = router;
