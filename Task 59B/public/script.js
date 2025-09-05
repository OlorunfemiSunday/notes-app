let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        showApp();
        loadNotes();
    } else {
        showAuth();
    }
    
    // Add form event listeners
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('createNoteForm').addEventListener('submit', handleCreateNote);
});

// Show/hide sections
function showAuth() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
    clearErrors();
}

function showApp() {
    document.getElementById('appSection').classList.remove('hidden');
    document.getElementById('authSection').classList.add('hidden');
    
    if (currentUser) {
        document.getElementById('userEmail').textContent = currentUser.email;
    }
}

// Auth tab switching
function showSignIn() {
    document.getElementById('signInForm').classList.remove('hidden');
    document.getElementById('signUpForm').classList.add('hidden');
    
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    clearErrors();
}

function showSignUp() {
    document.getElementById('signUpForm').classList.remove('hidden');
    document.getElementById('signInForm').classList.add('hidden');
    
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    clearErrors();
}

function clearErrors() {
    document.getElementById('registerError').textContent = '';
    document.getElementById('loginError').textContent = '';
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, phone })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            authToken = data.token;
            currentUser = data.user;
            showApp();
            loadNotes();
            document.getElementById('registerForm').reset();
        } else {
            document.getElementById('registerError').textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        document.getElementById('registerError').textContent = 'Network error. Please try again.';
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            authToken = data.token;
            currentUser = data.user;
            showApp();
            loadNotes();
            document.getElementById('loginForm').reset();
        } else {
            document.getElementById('loginError').textContent = data.message || 'Login failed';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Network error. Please try again.';
    }
}

// Handle create note
async function handleCreateNote(e) {
    e.preventDefault();
    
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tagsInput = document.getElementById('noteTags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, content, tags })
        });

        if (response.ok) {
            document.getElementById('createNoteForm').reset();
            loadNotes();
        } else {
            alert('Failed to create note');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Load notes
async function loadNotes() {
    try {
        const response = await fetch('/api/notes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const notes = await response.json();
            displayNotes(notes);
        } else {
            document.getElementById('notesList').innerHTML = '<div class="empty-state">Failed to load notes</div>';
        }
    } catch (error) {
        document.getElementById('notesList').innerHTML = '<div class="empty-state">Error loading notes</div>';
    }
}

// Filter notes
async function filterNotes() {
    const filterInput = document.getElementById('filterTags').value;
    if (!filterInput.trim()) {
        loadNotes();
        return;
    }
    
    const tags = filterInput.split(',').map(tag => tag.trim()).join(',');
    
    try {
        const response = await fetch(`/api/notes?tags=${encodeURIComponent(tags)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const notes = await response.json();
            displayNotes(notes);
        } else {
            document.getElementById('notesList').innerHTML = '<div class="empty-state">Failed to filter notes</div>';
        }
    } catch (error) {
        document.getElementById('notesList').innerHTML = '<div class="empty-state">Error filtering notes</div>';
    }
}

// Display notes
function displayNotes(notes) {
    const notesList = document.getElementById('notesList');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-state">No notes found. Create your first note! 🚀</div>';
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="note-meta">
                Created: ${new Date(note.createdAt).toLocaleString()}
                ${note.updatedAt !== note.createdAt ? `| Updated: ${new Date(note.updatedAt).toLocaleString()}` : ''}
            </div>
            <div class="note-actions">
                <button onclick="deleteNote('${note._id}')" class="btn-danger">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            loadNotes();
        } else {
            alert('Failed to delete note');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showAuth();
    showSignIn(); // Default to sign in tab
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
