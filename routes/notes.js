const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');
const { createNote, listNotes, getNote, updateNote, deleteNote } = require('../controllers/notesController');

const router = express.Router();

// protect all routes
router.use(auth);

// Create note
router.post('/', [
  body('title').isString().notEmpty().withMessage('Title required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return createNote(req, res);
});

// List notes
router.get('/', listNotes);

// Get single note
router.get('/:id', getNote);

// Update
router.put('/:id', [
  body('title').optional().isString(),
  body('content').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return updateNote(req, res);
});

// Delete
router.delete('/:id', deleteNote);

module.exports = router;
