# notes-app-api

Simple Notes API with User Authentication (email, phone, password), JWT auth, password hashing, and optional email OTP on signup.

## Features
- Signup (name, email, phone, password) with validation
- Optional Email OTP verification (configurable via .env)
- Login returns JWT
- Protected note routes (examples included)
- Uses MongoDB + Mongoose
- Production-ready for Render (start script in package.json)

## Setup
1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (see `.env.example`) and set `MONGO_URI` and `JWT_SECRET`. If you want email OTP, add email SMTP settings.

3. Start in development:
```bash
npm run dev
```

Start in production:
```bash
npm start
```

## Environment variables
See `.env.example`.

## Folder structure
- controllers/
- middlewares/
- models/
- routes/
- utils/
- index.js
