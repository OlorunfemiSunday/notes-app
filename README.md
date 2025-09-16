# notes-app-api

Notes API with User Authentication (email, phone, password), JWT auth, password hashing, email OTP (optional), note CRUD with tags, filtering, and a simple frontend.

## Features

- Signup (name, email, phone, password) with optional Email OTP verification
- Login returns a JWT
- Create / Read / Update / Delete notes with tags and timestamps
- Tag filtering: `/api/notes?tag=work` or `/api/notes?tags=work,urgent`
- Security: Helmet headers + rate limiting on login route
- Simple frontend at `/` to login, create notes, and view/filter notes

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` (use `.env.example`) with:

- `MONGO_URI`
- `JWT_SECRET`
- Optional SMTP settings for OTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `FROM_EMAIL`

3. Run:

- Development: `npm run dev`
- Production: `npm start`

## API Endpoints

### Auth

- `POST /api/auth/register`
  - body: `{ name, email, phone, password }`
  - response: `201 Created` (OTP sent if SMTP configured)

- `POST /api/auth/verify-otp`
  - body: `{ email, otp }`

- `POST /api/auth/login` (rate limited)
  - body: `{ email, password }`
  - response: `{ token, user }`

### Notes (protected with Authorization: Bearer <token>)

- `GET /api/notes` - list notes (supports `?tag=` and `?tags=comma,sep`)
- `POST /api/notes` - create note `{ title, content, tags: [] }`
- `GET /api/notes/:id` - get single note
- `PUT /api/notes/:id` - update (only owner) `{ title?, content?, tags? }`
- `DELETE /api/notes/:id` - delete (only owner)

## Frontend

Open `http://localhost:3000/` after running the server to access the simple frontend (login, create notes, view/filter).

## Notes for production (Render)

- Set environment variables in Render dashboard (`MONGO_URI`, `JWT_SECRET`, etc).
- Ensure `start` script is used.
- Add build & health check if necessary.


## Environment & Git Configuration ✅

### .gitignore Requirements:
```gitignore
# Environment variables
.env
.env.local
.env.production

# Dependencies
node_modules/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Build outputs
dist/
build/

module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Add your preferred rules
  },
};
