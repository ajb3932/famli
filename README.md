<div align="center">
<a href="https://github.com/ajb3932/famli"><img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-logo.png" title="Famli Logo" style="max-width:100%;" width="200" /></a>
</div>

# 🏠 Famli - Household Contact Management

Famli is a modern, containerized Progressive Web Application designed for household-centric contact management. Unlike traditional contact systems that focus on individuals, Famli organizes contacts by household units, making it ideal for managing family addresses, Christmas card lists, and event invitations.

The premice of this app was because I have family all over the UK and it was a pain to remember their addresses, hence creating Famli.

N.b: This was mostly vibe coded with Calude-Code but it has been checked by a human.

## ✨ Features

- **🏡 Household-Centric Organization** - Manage contacts by families and households rather than individuals
- **👥 People Directory** - Everyone A–Z, sorted by first or last name, with one-tap email and call
- **🎂 Upcoming Birthdays** - See whose birthday is coming up in the next 30 days
- **📋 Copy & Map Addresses** - Copy a ready-to-write address label or open it in maps
- **🎨 Color Themes** - Pick a colour for each household
- **🌍 Locale Support** - Country-specific address formats (US, UK, Canada, Australia), saved per account
- **🔐 Role-Based Access Control** - Admin, Editor, and Viewer roles
- **✨ Glass UI** - Frosted-glass design with smooth animations, light/dark/auto themes, and reduced-motion support
- **📱 Progressive Web App** - Installable on phone and desktop, with automatic update prompts
- **🔒 Secure by Default** - HttpOnly session cookies, CSRF protection, strict CSP, rate-limited sign-in
- **📝 Activity Log** - See every change and sign-in (including failed ones)

## 📷 Screenshots

<div align="center">

### First Run Setup
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-first_run.jpg" title="First Run Setup" style="max-width:100%;" width="800" />

### Households
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-household_view.jpg" title="Household View" style="max-width:100%;" width="800" />

### Edit Household
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-create_household.jpg" title="Edit Household" style="max-width:100%;" width="800" />

### People
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-contact_view.jpg" title="People View" style="max-width:100%;" width="800" />

### Users
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-users_view.jpg" title="Users View" style="max-width:100%;" width="800" />

</div>

## 🐳 Docker

**Docker Compose:**

Copy and paste this into your `docker-compose.yml` file, make your own edits, and run it with `docker compose up -d`

```yaml
services:
  famli:
    image: ajb3932/famli:latest
    container_name: famli
    user: "1000:1000"
    ports:
      - "9992:9992"
    volumes:
      - ./famli-data:/app/data
    environment:
      - PORT=9992
      # - TRUST_PROXY=1   # uncomment when behind a reverse proxy
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
```

**Docker CLI:**

```bash
docker run -d \
  -p 3000:3000 \
  -v ./famli-data:/app/data \
  --user 1000:1000 \
  --read-only --tmpfs /tmp --cap-drop ALL \
  --name famli \
  ajb3932/famli:latest
```

**⚠️ Important:** Make sure the data directory is writable by the container user:
```bash
mkdir -p ./famli-data
sudo chown -R 1000:1000 ./famli-data
```

## 🌍 Environment Variables

No secrets to configure — sessions are random tokens stored (hashed) in the database.

| Variable Name   | Description                                                                                       | Default              |
|-----------------|---------------------------------------------------------------------------------------------------|----------------------|
| `PORT`          | Port the application listens on                                                                   | `3000`               |
| `DB_PATH`       | Path to the SQLite database file                                                                  | `/app/data/famli.db` |
| `TRUST_PROXY`   | Set when behind a reverse proxy: `1` (one hop), `true`, or a list like `loopback,uniquelocal`     | _(off)_              |
| `COOKIE_SECURE` | `auto` marks the session cookie Secure on HTTPS requests; `true` forces it; `false` disables it   | `auto`               |

**Behind a reverse proxy with HTTPS** (nginx, Traefik, Caddy, Cloudflare Tunnel…) set `TRUST_PROXY=1` so rate limiting sees real client IPs and the session cookie is marked `Secure`.

## ⬆️ Upgrading from 1.x

1. **Back up your database first** (see below).
2. Pull the new image and restart. The database is upgraded automatically on start-up — households, members, users and the activity log are kept.
3. Everyone will need to **sign in again once** (the old token sessions are replaced).
4. You can remove `JWT_SECRET`, `JWT_REFRESH_SECRET` and `CORS_ORIGIN` from your config — they're no longer used.

Older 1.x versions didn't enforce SQLite foreign keys, so members left behind by deleted households are cleaned up during the upgrade.

## 🚀 First Run

When the app first runs, it detects that no users exist and shows a setup wizard. Create an administrator account with:
- Username
- Email
- Password (minimum 8 characters)

Once setup is complete you're signed in and can start adding households!

## 💻 Usage

- **Households** - All households as cards with member avatars and upcoming birthdays. Search by name, town, postcode, or member name.
- **People** - Everyone A–Z. Toggle sorting by first or last name; tap a person to open their household.
- **Users (Admin)** - Add family members as viewers, editors or admins.
- **Activity (Admin)** - Who changed what, and when — plus sign-ins and failed sign-in attempts.
- **Account menu** - Theme (light/dark/auto), address format, change password, sign out.

**User Roles:**

| Role     | Permissions                                                         |
|----------|---------------------------------------------------------------------|
| `Admin`  | Full access - manage users, households, members, and see activity  |
| `Editor` | Create and edit households and members                             |
| `Viewer` | Read-only access to household information                          |

**Install as an app:** open Famli in your browser and choose *Install* (desktop Chrome/Edge) or *Add to Home Screen* (iOS Safari / Android Chrome). Installing needs HTTPS (or `localhost`).

## 🔧 Troubleshooting

**Permission errors on start-up** - the container runs as UID 1000 and needs to write to `/app/data`:
```bash
sudo chown -R 1000:1000 ./famli-data
ls -la ./famli-data
```

**"Too many sign-in attempts"** - sign-in is limited to 10 failed attempts per 15 minutes per IP. Behind a reverse proxy, set `TRUST_PROXY=1` so each visitor is counted separately.

**Changes won't save behind a reverse proxy ("Cross-site request blocked")** - make sure your proxy passes the original `Host` header (nginx: `proxy_set_header Host $host;`).

## 🙋 I want to run this myself

🐳 **Docker**
```bash
git clone https://github.com/ajb3932/famli.git
cd famli
mkdir -p famli-data
docker build -t my-famli .
docker run -d -p 3000:3000 -v ./famli-data:/app/data --user $(id -u):$(id -g) my-famli
```

🐳 **Docker Compose**
```bash
git clone https://github.com/ajb3932/famli.git
cd famli
mkdir -p famli-data
# Edit docker-compose.yml first (e.g. switch "image:" to "build: .")
docker compose up -d --build
```

💾 **Node.js 22+ (Development)**
```bash
git clone https://github.com/ajb3932/famli.git
cd famli

# Backend (http://localhost:3000)
cd backend
npm install
cp .env.example .env
npm run dev
npm test          # run the API test suite

# Frontend (in another terminal, http://localhost:5173)
cd frontend
npm install
npm run dev
```

## 📦 Technology Stack

**Backend:**
- Node.js 24 + Express 5
- SQLite via better-sqlite3 (WAL mode, versioned migrations)
- Server-side sessions in HttpOnly cookies, bcrypt password hashing
- Zod input validation, Helmet (CSP), rate limiting
- Node's built-in test runner + Supertest

**Frontend:**
- React 19 + React Router, built with Vite
- Tailwind CSS v4 (glass surfaces, custom animations)
- Lucide icons, Inter variable font (self-hosted)
- vite-plugin-pwa / Workbox service worker

**Deployment:**
- Multi-stage Docker build on Alpine
- Runs as non-root with a read-only filesystem
- Health check and graceful shutdown

## 🗄️ Database Backup

The SQLite database is stored in `/app/data/famli.db` (Docker) or `backend/data/famli.db` (manual). Famli uses SQLite's WAL mode, so use SQLite's backup command rather than copying the file while it's running:

**Backup:**
```bash
# Docker (uses the sqlite3 CLI on the host against the mounted volume)
sqlite3 ./famli-data/famli.db ".backup './famli-backup-$(date +%Y%m%d).db'"

# Or stop the container first and copy the files
docker stop famli && cp ./famli-data/famli.db* ./backups/ && docker start famli
```

**Restore:**
```bash
docker stop famli
cp ./famli-backup.db ./famli-data/famli.db
rm -f ./famli-data/famli.db-wal ./famli-data/famli.db-shm
docker start famli
```

## 🔒 Security

What Famli does for you:
- 🍪 Sessions are random tokens in **HttpOnly, SameSite=Strict** cookies — nothing an injected script could steal. Only a SHA-256 hash is stored server-side.
- 🚪 Signing out, deleting a user, changing a role or resetting a password takes effect **immediately** on every device.
- 🛡️ **CSRF protection** (Fetch Metadata + Origin checks, JSON-only writes) and a **strict Content-Security-Policy**.
- 🔑 bcrypt (cost 12) with transparent upgrade of older hashes; sign-in is rate limited and doesn't reveal which usernames exist.
- ✅ Every input is validated and length-limited server-side; there's always at least one admin.
- 📝 Changes, sign-ins and failed sign-ins are written to the activity log.
- 🙈 API responses are never cached by the browser or service worker; the database file is created owner-only (`0600`).

What you should do:
- ✅ Use HTTPS in production (reverse proxy recommended) and set `TRUST_PROXY`
- ✅ Regularly back up your database
- ✅ Keep the image up to date
- ✅ Review the Activity page now and then

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

ISC

## ⭐ Star History

<div align="center">
<a href="https://www.star-history.com/#ajb3932/famli&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ajb3932/famli&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ajb3932/famli&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ajb3932/famli&type=Date" />
 </picture>
</a>
</div>

## ☕ Support

<div align="center">
<a href='https://ko-fi.com/F1F11GNNZU' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi4.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>
</div>
