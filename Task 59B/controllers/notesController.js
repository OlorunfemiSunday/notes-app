const Note = require('../models/Note'); // Changed from Notes to Note

const createNote = async (req, res) => {
  try {
    console.log('Creating note for user:', req.user.userId);
    console.log('Note data:', req.body);
    
    const { title, content, tags } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = new Note({
      title: title.trim(),
      content: content.trim(),
      tags: tags || [],
      userId
    });

    const savedNote = await note.save();
    console.log('Note created successfully:', savedNote._id);
    
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ 
      message: 'Error creating note',
      error: error.message 
    });
  }
};

const listNotes = async (req, res) => {
  try {
    console.log('Fetching notes for user:', req.user.userId);
    
    const userId = req.user.userId;
    const { tag, tags } = req.query;

    let filter = { userId };

    // Handle tag filtering
    if (tag) {
      filter.tags = tag;
    } else if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagArray };
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${notes.length} notes`);
    
    res.json(notes);
  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ 
      message: 'Error fetching notes',
      error: error.message 
    });
  }
};

const getNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ 
      message: 'Error fetching note',
      error: error.message 
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    const updates = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ 
      message: 'Error updating note',
      error: error.message 
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ 
      message: 'Error deleting note',
      error: error.message 
    });
  }
};

module.exports = { createNote, listNotes, getNote, updateNote, deleteNote };
