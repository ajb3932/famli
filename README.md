<div align="center">
<a href="https://github.com/ajb3932/famli"><img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-logo.png" title="Famli Logo" style="max-width:100%;" width="200" /></a>
</div>

# 🏠 Famli - Household Contact Management

Famli is a modern, containerized Progressive Web Application designed for household-centric contact management. Unlike traditional contact systems that focus on individuals, Famli organizes contacts by household units, making it ideal for managing family addresses, Christmas card lists, and event invitations.

The premice of this app was because I have family all over the UK and it was a pain to remember their addresses, hence creating Famli.

N.b: This was mostly vibe coded with Calude-Code but it has been checked by a human.

## ✨ Features

- **🏡 Household-Centric Organization** - Manage contacts by families and households rather than individuals
- **👥 People Directory** - View all contacts alphabetically, sorted by first or last name
- **🎨 Color Themes** - Customizable color themes for each household
- **🌍 Locale Support** - Country-specific address formats (US, UK, Canada, Australia)
- **🔐 Role-Based Access Control** - Admin, Editor, and Viewer roles with appropriate permissions
- **🌙 Dark Mode** - Beautiful responsive design with dark mode support
- **📱 Progressive Web App** - Install on mobile devices for app-like experience
- **🔒 Secure Authentication** - JWT-based authentication with refresh tokens
- **📊 Complete Member Management** - Track birthdays, emails, phones, and notes for household members
- **📝 Audit Logging** - Track all administrative actions for security

## 📷 Screenshots

<div align="center">

### First Run Setup
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-first_run.jpg" title="First Run Setup" style="max-width:100%;" width="800" />

### Household List View
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-household_view.jpg" title="Household View" style="max-width:100%;" width="800" />

### Create/Edit Household
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-create_household.jpg" title="Create Household" style="max-width:100%;" width="800" />

### People/Contacts View
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-contact_view.jpg" title="Contact View" style="max-width:100%;" width="800" />

### User Management (Admin)
<img src="https://raw.githubusercontent.com/ajb3932/famli/main/frontend/public/images/famli-users_view.jpg" title="Users View" style="max-width:100%;" width="800" />

</div>

## 🐳 Docker

**Docker Compose:**

Copy and paste this text into your `docker-compose.yml` file, make your own edits, and run it with `docker compose up -d`

```yaml
services:
  famli:
    image: ajb3932/famli:latest
    container_name: famli
    user: "1000:1000"  # Set to your user ID (run: id -u)
    ports:
      - "9992:9992"
    volumes:
      - ./famli-data:/app/data  # Bind mount for database
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_PATH=/app/data/famli.db
      - JWT_SECRET=change-this-secret-in-production
      - JWT_REFRESH_SECRET=change-this-refresh-secret-in-production
      - CORS_ORIGIN=*
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:9992/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

**Docker CLI:**

```bash
docker run -d \
  -p 3000:3000 \
  -v ./famli-data:/app/data \
  -e JWT_SECRET=your-secret-key \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  --user 1000:1000 \
  --name famli \
  ajb3932/famli:latest
```

**⚠️ Important:** Make sure the data directory has correct permissions:
```bash
mkdir -p ./famli-data
sudo chown -R $(id -u):$(id -g) ./famli-data
```

## 🌍 Environment Variables

The following Environment Variables are available:

| Variable Name          | Description                              | Default Value                          |
|------------------------|------------------------------------------|----------------------------------------|
| `PORT`                 | Port the application runs on             | `3000`                                 |
| `NODE_ENV`             | Node environment                         | `production`                           |
| `DB_PATH`              | Path to SQLite database file             | `/app/data/famli.db`                   |
| `JWT_SECRET`           | Secret key for JWT tokens                | `change-this-secret-in-production`     |
| `JWT_REFRESH_SECRET`   | Secret key for JWT refresh tokens        | `change-this-refresh-secret-in-production` |
| `CORS_ORIGIN`          | CORS origin for API requests             | `*`                                    |

**🔒 Security:** Always change the JWT secrets in production! Generate secure random strings:
```bash
# Generate a secure random string
openssl rand -base64 32
```

## 🚀 First Run

When the app first runs, it will automatically detect that no users exist and present you with a setup wizard at the root URL. You'll be asked to create an administrator account with:
- Username
- Email
- Password (minimum 8 characters)

Once setup is complete, you'll be automatically logged in and can start adding households!

## 💻 Usage

**`/` (Root)**
- If no users exist: Shows the first-run setup wizard
- If not logged in: Shows the login page
- If logged in: Shows the main application dashboard

**Main Application Features:**

- **Households Tab** - View all households in a list format with member counts. Click any household to see full details and members.

- **People Tab** - Browse all contacts alphabetically. Toggle sorting by first name or last name. Click any person to navigate to their household.

- **Users Tab (Admin Only)** - Manage user accounts, assign roles, and view audit logs.

**User Roles:**

| Role     | Permissions                                                     |
|----------|-----------------------------------------------------------------|
| `Admin`  | Full access - manage users, households, members, and settings  |
| `Editor` | Create, edit, and delete households and members                |
| `Viewer` | Read-only access to household information                      |

**Locale Settings:**

Switch between country formats in the header dropdown:
- 🇺🇸 **United States** - City, State, ZIP Code
- 🇬🇧 **United Kingdom** - Town, County, Postcode
- 🇨🇦 **Canada** - City, Province, Postal Code
- 🇦🇺 **Australia** - City, State, Postcode

## 🔧 Troubleshooting

If you encounter database permission errors, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

**Quick Fix for Permission Issues:**
```bash
# Fix directory ownership
sudo chown -R $(id -u):$(id -g) ./famli-data

# Verify permissions
ls -la ./famli-data
```

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
# Edit docker-compose.yml first if needed
docker compose up -d --build
```

💾 **Node.js (Development)**
```bash
git clone https://github.com/ajb3932/famli.git
cd famli

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## 📦 Technology Stack

**Backend:**
- Node.js with Express.js
- SQLite3 database
- JWT authentication with bcrypt
- Helmet, CORS, and rate limiting

**Frontend:**
- React 19 with Vite
- Tailwind CSS
- Progressive Web App features
- Dark mode support

**Deployment:**
- Docker with multi-stage builds
- Alpine Linux base image
- Health checks and graceful shutdown

## 🗄️ Database Backup

The SQLite database is stored in `/app/data/famli.db` (Docker) or `backend/data/famli.db` (manual).

**Backup:**
```bash
# Docker
docker cp famli:/app/data/famli.db ./backup-$(date +%Y%m%d).db

# Manual
cp backend/data/famli.db ./backup-$(date +%Y%m%d).db
```

**Restore:**
```bash
# Docker
docker cp ./backup.db famli:/app/data/famli.db
docker restart famli

# Manual
cp ./backup.db backend/data/famli.db
```

## 🔒 Security Considerations

- ✅ Change default JWT secrets in production
- ✅ Use HTTPS in production (reverse proxy recommended)
- ✅ Regularly backup your database
- ✅ Keep dependencies up to date
- ✅ Use strong passwords (min 8 characters)
- ✅ Consider rate limiting at reverse proxy level
- ✅ Review audit logs for suspicious activity

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
