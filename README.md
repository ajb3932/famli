# Famli - Household Contact Management System

A modern, containerized Progressive Web Application designed for household-centric contact management. Famli organizes contacts by household units, making it ideal for managing family addresses, Christmas card lists, and event invitations.

## Features

- **Household-Centric Organization**: Manage contacts by families and households rather than individuals
- **Role-Based Access Control**: Admin, Editor, and Viewer roles with appropriate permissions
- **Modern UI**: Responsive design with dark mode support
- **Progressive Web App**: Install on mobile devices for app-like experience
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Color Themes**: Customizable color themes for each household
- **Complete Member Management**: Track birthdays, emails, phones, and notes for household members
- **Audit Logging**: Track all administrative actions for security

## Technology Stack

### Backend
- Node.js with Express.js
- SQLite3 database
- JWT authentication
- bcrypt password hashing

### Frontend
- React 19
- Vite build tool
- Tailwind CSS
- Progressive Web App features

### Deployment
- Docker containerization
- Multi-stage builds for optimization
- Persistent SQLite database via volume mounting

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd famli
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application at `http://localhost:3000`

4. Complete the first-run setup to create your admin account

### Using Docker CLI

```bash
# Build the image
docker build -t famli .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v famli-data:/app/data \
  -e JWT_SECRET=your-secret-key \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  --name famli \
  famli
```

### Manual Installation

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` and set your JWT secrets

5. Start the backend server:
```bash
npm start
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. For production, build the frontend:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DB_PATH=./data/famli.db

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# CORS
CORS_ORIGIN=*
```

## User Roles

- **Admin**: Full access to all features including user management
- **Editor**: Can create, edit, and delete households and members
- **Viewer**: Read-only access to household information

## First-Run Setup

When you first access Famli, you'll be guided through a setup wizard to create the initial administrator account. This ensures secure access to your household management system.

## Database Backup

The SQLite database is stored in the `/app/data` directory (when using Docker) or `backend/data` directory (manual installation). To backup your data:

### Docker
```bash
docker cp famli:/app/data/famli.db ./backup-famli.db
```

### Manual
```bash
cp backend/data/famli.db ./backup-famli.db
```

## API Endpoints

### Authentication
- `GET /api/auth/first-run` - Check if first-run setup is needed
- `POST /api/auth/setup` - Complete first-run setup
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Households
- `GET /api/households` - List all households (with pagination and search)
- `GET /api/households/:id` - Get household details with members
- `POST /api/households` - Create household (Admin/Editor)
- `PUT /api/households/:id` - Update household (Admin/Editor)
- `DELETE /api/households/:id` - Delete household (Admin)

### Household Members
- `GET /api/households/:id/members` - List household members
- `POST /api/households/:id/members` - Add member (Admin/Editor)
- `PUT /api/households/:id/members/:memberId` - Update member (Admin/Editor)
- `DELETE /api/households/:id/members/:memberId` - Delete member (Admin/Editor)

### Users
- `GET /api/users` - List all users (Admin)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/preferences` - Update user preferences
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/audit/log` - Get audit log (Admin)

## Deployment to Unraid

1. In Unraid, go to the Docker tab
2. Click "Add Container"
3. Configure:
   - **Name**: Famli
   - **Repository**: famli (or your image name)
   - **Port**: 3000 → 3000
   - **Volume**: `/mnt/user/appdata/famli` → `/app/data`
   - **Environment Variables**:
     - JWT_SECRET: (generate a secure random string)
     - JWT_REFRESH_SECRET: (generate a secure random string)
4. Apply and start the container
5. Access at `http://[unraid-ip]:3000`

## Security Considerations

- **Change default JWT secrets** in production
- Use **HTTPS** in production environments
- Regularly **backup your database**
- Keep dependencies **up to date**
- Use strong passwords for all user accounts
- Consider placing behind a reverse proxy (nginx, Traefik, etc.)

## Development

### Project Structure
```
famli/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   └── schema.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── households.js
│   │   │   └── users.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

ISC

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
