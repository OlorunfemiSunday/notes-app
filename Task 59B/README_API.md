# API Endpoints

## Auth
- POST /api/auth/signup
  - body: { name, email, phone, password }
  - response: 201 created (OTP sent if email configured)

- POST /api/auth/verify-otp
  - body: { email, otp }

- POST /api/auth/login
  - body: { email, password }
  - response: { token, user }

## Notes (protected)
All notes routes require `Authorization: Bearer <token>`

- GET /api/notes
- POST /api/notes { title, content }
- GET /api/notes/:id
- PUT /api/notes/:id
- DELETE /api/notes/:id
