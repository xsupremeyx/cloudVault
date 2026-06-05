# CloudVault

A full-stack cloud storage application built as part of [The Odin Project](https://www.theodinproject.com/) File Uploader assignment.

CloudVault lets authenticated users create folders, upload files, and share folders publicly through expiring read-only share links — all backed by Supabase Storage and a PostgreSQL database.

**Live demo:** https://cloudvault-tcp5.onrender.com/

---

## Features

**Authentication**
- Sign up, log in, log out
- Passport.js Local Strategy with bcrypt password hashing
- Session persistence via Prisma Session Store

**Folder management**
- Create, rename, and delete folders
- Unlimited nesting depth — folders can contain subfolders to any level
- Recursive deletion — removing a folder removes all descendant folders and their files from both the database and Supabase Storage
- Breadcrumb navigation at every level

**File management**
- Upload files (JPG, PNG, WEBP, PDF, TXT — max 10 MB)
- Download files
- Delete files
- Human-readable file sizes

**Public sharing**
- Generate a public share link for any folder (UUID token)
- Read-only shared view — browse subfolders, download files, no editing
- Shared links expire after 7 days and can be regenerated
- Shared breadcrumb navigation works across the full shared subtree
- Copy-to-clipboard share link button

**UI**
- Modern SaaS-style design with Inter font and Lucide icons
- Card-based layout with responsive grid
- Mobile-first responsive design
- Confirmation modal for all destructive actions (delete folder, delete file)
- Inline and summary validation error display
- Empty states for folders and files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Templating | EJS |
| Authentication | Passport.js (Local Strategy) + express-session |
| ORM | Prisma |
| Database | PostgreSQL (hosted on Supabase) |
| Storage | Supabase Storage |
| Uploads | Multer (memory storage) |
| Validation | express-validator |
| Icons | Lucide (CDN) |
| Deployment | Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express (app.js)                         │
│                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Session Middle  │  │  Passport.js │  │  res.locals   │   │
│  │ware (Prisma     │→ │  (deseriali- │→ │  currentUser  │   │
│  │ Session Store)  │  │   zeUser)    │  │  on every req │   │
│  └─────────────────┘  └──────────────┘  └───────────────┘   │
│                                                             │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐               │
│  │    /     │  │  /folders   │  │  /share   │               │
│  │ indexR.  │  │  folderR.   │  │  shareR.  │               │
│  └──────────┘  └─────────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘


Browser
  │
  ▼
Express (app.js)
  ├── Session middleware (Prisma Session Store)
  ├── Passport.js authentication
  └── Routers
        ├── /             → index, dashboard
        ├── /folders      → folder CRUD, file upload/download/delete, share creation
        └── /share        → public read-only shared folder views + file downloads

File Upload Flow
  Multer (memory) → Supabase Storage → Prisma file record → redirect

Share Flow
  POST /folders/:id/share → upsert Share record → UUID token
  GET  /share/:token      → validate token + expiry → read-only render
```

**Ownership validation** is applied consistently across all protected routes:
```js
where: { id: resourceId, userId: req.user.id }
```

**Shared tree security** — the `isDescendantFolder()` helper prevents access to folders outside the shared subtree, even with a valid token.

---

## Project Structure

```
cloudVault/
├── app.js
├── config/
│   ├── multer.js
│   ├── passport.js
│   └── share.js
├── controllers/
│   ├── authController.js
│   ├── fileController.js
│   ├── folderController.js
│   ├── indexController.js
│   └── shareController.js
├── lib/
│   ├── prisma.js
│   ├── storage.js
│   └── supabase.js
├── middleware/
│   ├── authMiddleware.js
│   ├── uploadMiddleware.js
│   └── validators/
│       ├── authValidators.js
│       └── folderValidators.js
├── prisma/
│   └── schema.prisma
├── public/
│   ├── styles.css
│   └── js/
│       └── confirm-modal.js
├── routes/
│   ├── authRouter.js
│   ├── indexRouter.js
│   ├── shareRouter.js
│   └── folders/
│       └── folderRouter.js
├── utils/
│   ├── folderTree.js
│   └── formatFileSize.js
└── views/
    ├── dashboard.ejs
    ├── error.ejs
    ├── folder.ejs
    ├── index.ejs
    ├── log-in.ejs
    ├── share.ejs
    ├── sign-up.ejs
    └── partials/
        ├── confirm-modal.ejs
        ├── error.ejs
        ├── footer.ejs
        ├── header.ejs
        └── navbar.ejs
```

---

## Database Schema

```
User
  id, username, password, createdAt
  → has many Folders
  → has many Files

Folder
  id, name, createdAt, userId, parentId (nullable)
  → belongs to User
  → belongs to parent Folder (optional)
  → has many child Folders
  → has many Files
  → has one Share (optional)

File
  id, name, size, mimeType, url, storagePath, uploadedAt, folderId, userId

Share
  id, token (UUID), expiresAt, folderId (unique)

Session
  id, sid, data, expiresAt
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=your_postgresql_connection_string

NODE_ENV=development

SESSION_SECRET=your_session_secret

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Installation & Setup

```bash
git clone https://github.com/xsupremeyx/cloudVault.git
cd cloudVault
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate deploy
```

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm start
```

The app runs on `http://localhost:3000` by default.

---

## Validation Rules

**Username:** 3–30 characters, letters/numbers/underscores only, case-insensitive uniqueness check

**Password:** minimum 8 characters, at least one letter, at least one number, no spaces

**Folder name:** 1–50 characters, trimmed, no duplicate sibling names per user

**File upload:** maximum 10 MB, allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`

---

## Deployment

The application is deployed on **Render** with the database and storage hosted on **Supabase**.

The `postinstall` script runs `prisma generate` automatically on deploy.

Production cookies are set with `secure: true` when `NODE_ENV=production`.

---

## Known Limitations / Future Work

- No signed URLs — files are stored in a public Supabase bucket
- No drag-and-drop upload interface
- No file previews (images, PDFs)
- No search or filter within folders
- No user storage quotas
- Share link expiration is fixed at 7 days (not configurable per link)
- No share link revocation without regenerating

---

## License

ISC