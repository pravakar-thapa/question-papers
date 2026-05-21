# Question Papers

A full-stack question paper archive for students and educators. Users can browse, save, upload, download, and discuss PDF question papers while admins moderate uploads and manage the library.

## Live Demo

Frontend: https://question-papers-sable.vercel.app/
Backend API: https://questionpapers-backend.onrender.com

# Public Demo User / Signup as New User
username: demo_user
Password: du@123

# Public Admin User
"Admin features available upon request"


## Key Features

- JWT authentication & role-based access
- PDF upload + moderation workflow
- Nested comments and replies
- Admin dashboard & audit logs
- MongoDB + Cloudinary integration
- Fully deployed MERN stack app

## Features

- User signup and JWT login
- Public approved-paper browsing with filters and pagination
- PDF upload with metadata validation
- Cloudinary PDF storage
- MongoDB data storage with Mongoose models
- Saved papers and personal upload history
- Comments, replies, likes, dislikes, edits, and deletes
- Admin approval/rejection workflow
- Admin stats, audit logs, user management, bans, role changes, password resets, and user deletion
- User password change
- User account deletion request with a 30-day waiting period and cancellation option
- Duplicate detection by metadata and PDF file hash
- PDF validation by extension, MIME type, file signature, and size
- Basic security middleware with Helmet, CORS, rate limiting, and protected routes

## Tech Stack

- Frontend: React, Create React App, Tailwind CSS, Framer Motion, Lucide icons
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT and bcrypt
- File storage: Cloudinary
- Tests: Node test runner, React Testing Library

## Project Structure

```txt
backend/
  config/        Express, MongoDB, Cloudinary, CORS, env config
  controllers/   Route handlers
  middleware/    Auth, upload, rate limit, error handling
  models/        Mongoose schemas
  routes/        API routes
  services/      PDF workflow, audit, account lifecycle helpers
  test/          Backend unit tests

frontend/
  src/
    api/         API wrappers
    components/  Shared UI and PDF cards
    contexts/    Theme provider
    pages/       Main screens and panels
```

## Environment Variables

Example backend environment variables:

```env
JWT_SECRET=replace_with_a_long_random_secret
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.example.mongodb.net/questionpapers?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

Create `frontend/.env.local` for local frontend development:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

Do not commit real `.env` files.

## Local Development

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm start
```

Run the frontend in another terminal:

```bash
cd frontend
npm start
```

Open `http://localhost:3000`.

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
CI=true npm test -- --watchAll=false
```

Production frontend build:

```bash
cd frontend
npm run build
```

## Deployment

Recommended setup:

- MongoDB Atlas for the database
- Cloudinary for PDF files
- Render for the backend
- Vercel for the frontend

### Render Backend

Create a Render Web Service from this repository:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Set Render environment variables:

```env
NODE_ENV=production
JWT_SECRET=replace_with_a_long_random_secret
MONGO_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Vercel Frontend

Create a Vercel project from this repository:

```txt
Root Directory: frontend
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
```

Set Vercel environment variables:

```env
REACT_APP_API_BASE_URL=https://your-render-backend.onrender.com
```



## Admin Setup

1. Sign up normally through the app.
2. Open the MongoDB Atlas `users` collection.
3. Set your account role:

```js
role: "admin"
```

4. Log out and log back in.

## Resume Summary

Built and deployed a full-stack question paper archive using React, Node.js, Express, MongoDB, Cloudinary, JWT authentication, admin moderation, PDF upload workflows, comments, saved collections, account management, audit logs, and role-based access control.
