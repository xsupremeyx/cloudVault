# CloudVault — Project Context

Odin Project: File Uploader. Stripped-down Google Drive clone.

---

## Stack
- **Runtime:** Node.js (ESM — `"type": "module"` in package.json)
- **Framework:** Express
- **ORM:** Prisma + `@prisma/adapter-pg` + `pg`
- **Templating:** EJS + partials (header / navbar / footer)
- **Styling:** Plain CSS, CSS variables, dark mode, Fira Code
- **Auth:** Passport.js LocalStrategy + bcryptjs + connect-flash
- **Sessions:** `prisma-session-store` (persists to DB)
- **File upload:** multer (local → then Supabase Storage)
- **Cloud storage:** Supabase Storage (swap in after core features work)
- **Validation:** express-validator
- **Extra credit:** Shared folder links with UUID token + expiry

---

## Folder Structure
```
app.js
routes/
  authRouter.js
  folders/
    foldersRouter.js
  files/
    filesRouter.js
  shareRouter.js
controllers/
  authController.js
  foldersController.js
  filesController.js
  shareController.js
middleware/
  auth.js          ← ensureLoggedIn guard
  validate.js      ← all express-validator arrays
lib/
  prisma.js        ← Prisma singleton (ESM)
  supabase.js      ← Supabase client singleton
prisma/
  schema.prisma
generated/
  prisma/          ← generated client (gitignored)
views/
  dashboard.ejs    ← root folder view (all top-level folders)
  folder.ejs       ← folder contents view
  file.ejs         ← file detail view
  sign-up.ejs
  log-in.ejs
  share.ejs        ← public shared folder view (no auth)
  partials/
    header.ejs
    navbar.ejs
    footer.ejs
    error.ejs
public/
  styles.css
uploads/           ← local temp storage (gitignored, pre-Supabase)
.env
.env.example
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  folders   Folder[]
  files     File[]
}

model Folder {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  parent    Folder?  @relation("FolderChildren", fields: [parentId], references: [id], onDelete: Cascade)
  parentId  Int?
  children  Folder[] @relation("FolderChildren")
  files     File[]
  share     Share?
}

model File {
  id         Int      @id @default(autoincrement())
  name       String
  size       Int
  mimeType   String
  url        String   // Supabase public URL (empty string until Phase 6)
  uploadedAt DateTime @default(now())
  folder     Folder   @relation(fields: [folderId], references: [id], onDelete: Cascade)
  folderId   Int
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     Int
}

model Share {
  id        Int      @id @default(autoincrement())
  token     String   @unique @default(uuid())
  expiresAt DateTime
  folder    Folder   @relation(fields: [folderId], references: [id], onDelete: Cascade)
  folderId  Int      @unique
}
```

> Session table is auto-created by `prisma-session-store` — no model needed.

---

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sign-up` | guest | Sign-up form |
| POST | `/sign-up` | guest | Create user |
| GET | `/log-in` | guest | Log-in form |
| POST | `/log-in` | guest | Passport authenticate |
| GET | `/log-out` | user | Destroy session |
| GET | `/` | user | Dashboard — top-level folders |
| POST | `/folders` | user | Create folder (parentId optional) |
| GET | `/folders/:id` | user | View folder contents |
| POST | `/folders/:id/edit` | user | Rename folder |
| POST | `/folders/:id/delete` | user | Delete folder (cascades files) |
| POST | `/folders/:id/share` | user | Create/update share link with expiry |
| POST | `/folders/:id/files` | user | Upload file into folder (multer) |
| GET | `/files/:id` | user | File detail (name, size, date, download btn) |
| GET | `/files/:id/download` | user | Stream/redirect to file URL |
| POST | `/files/:id/delete` | user | Delete file (Supabase + DB row) |
| GET | `/share/:token` | public | View shared folder (check expiry) |

---

## Key Packages

```bash
npm install express ejs express-validator \
  passport passport-local bcryptjs connect-flash \
  express-session @prisma/client @prisma/adapter-pg pg \
  prisma-session-store multer \
  @supabase/supabase-js dotenv

npm install --save-dev prisma
```

---

## Environment Variables

```
DATABASE_URL=postgresql://...
NODE_ENV=development
SESSION_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## lib/prisma.js (ESM singleton — locked pattern)

```js
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

---

## app.js Auth + Session Setup (Established Pattern)

```js
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js";

app.use(session({
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,   // prune expired sessions every 2min
    dbRecordIdIsSessionId: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.session());
app.use(flash());
```

> Note: `prisma-session-store` package name on npm is `@quixo3/prisma-session-store`. Uses the Prisma client directly — no separate `Session` model needed; it manages its own table.

---

## Build Phases (in order)

1. **Setup** — init project, install deps, `app.js` skeleton, Prisma schema, `npx prisma db push`
2. **Auth** — sign-up, log-in, log-out, session store, `ensureLoggedIn` middleware
3. **Folders CRUD** — dashboard, create, view, rename, delete (no files yet)
4. **File upload (local)** — multer to `uploads/`, save metadata to DB, skip Supabase URL for now
5. **File detail + download** — detail view, download route (stream from local `uploads/`)
6. **Supabase Storage** — swap multer disk storage for Supabase upload, store public URL, update download to redirect
7. **Validation** — file type whitelist, size limit (in multer config + express-validator)
8. **Share links** — POST creates `Share` row with UUID token + expiry, GET `/share/:token` checks expiry and renders read-only folder view

---

## Ownership Rules
- All folder/file queries must include `WHERE userId = req.user.id` — users only see their own data
- `ensureLoggedIn` on all routes except `/sign-up`, `/log-in`, `/share/:token`
- Ownership check before every mutating action (edit/delete) — never trust URL param alone

---

## CSS Architecture (same order as previous projects)
1. `@import` Fira Code
2. `:root` variables
3. Reset
4. Base
5. Navbar
6. Dashboard / folder grid
7. File cards
8. Forms + validation errors
9. File detail
10. Share view
11. Footer
12. `@media` breakpoints (860px / 640px / 480px)

---

## Multer Config Reference

```js
// Phase 4 — local disk
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Phase 7 — add limits + fileFilter
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/gif","application/pdf","text/plain"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("File type not allowed"));
  },
});
```

---

## Supabase Storage Pattern (Phase 6)

```js
// lib/supabase.js
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Upload
const { data, error } = await supabase.storage
  .from("cloudvault")
  .upload(`${userId}/${Date.now()}-${filename}`, fileBuffer, { contentType: mimeType });

// Public URL
const { data: { publicUrl } } = supabase.storage.from("cloudvault").getPublicUrl(data.path);

// Delete
await supabase.storage.from("cloudvault").remove([storedPath]);
```

> Save `data.path` in DB alongside `url` so you can delete the file later.

---

## Share Link Pattern (Phase 8)

- `POST /folders/:id/share` — takes `days` from body, computes `expiresAt = now + days`, upserts `Share` record, returns token URL
- `GET /share/:token` — finds `Share` by token, checks `expiresAt > now`, renders `share.ejs` with folder + files (read-only, no auth required)
- Token is a UUID generated by Prisma `@default(uuid())` — no manual UUID package needed

---

## Deployment Checklist
- [ ] `"type": "module"` in package.json
- [ ] `"start": "node app.js"` in package.json scripts
- [ ] `generated/` in `.gitignore`, `uploads/` in `.gitignore`
- [ ] All env vars set in Render: `DATABASE_URL`, `NODE_ENV=production`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [ ] `npx prisma db push` run against production DB before first deploy
- [ ] Supabase bucket set to public (for direct URL access)
- [ ] `process.env.PORT || 3000` in app.js