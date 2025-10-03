# Famli - Deployment Guide

## Quick Start

The application is now running! Access it at: **http://localhost:3000**

### Current Status
✅ Backend API running on port 3000
✅ Frontend built and integrated
✅ SQLite database initialized
✅ First-run setup ready

## First Steps

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Complete the setup wizard** to create your admin account
3. **Start adding households** and managing your contacts

## Docker Commands

### View logs
```bash
docker logs famli
```

### Stop the application
```bash
docker compose down
```

### Start the application
```bash
docker compose up -d
```

### Rebuild after code changes
```bash
docker compose up -d --build
```

### Backup database
```bash
docker cp famli:/app/data/famli.db ./backup-$(date +%Y%m%d).db
```

### Restore database
```bash
docker cp ./backup.db famli:/app/data/famli.db
docker restart famli
```

## Security Configuration

**IMPORTANT**: Before deploying to production, update your JWT secrets:

Create a `.env` file in the project root:

```env
JWT_SECRET=your-very-long-random-secret-key-here
JWT_REFRESH_SECRET=your-very-long-random-refresh-secret-here
CORS_ORIGIN=https://yourdomain.com
```

Then update `docker-compose.yml` to use these:

```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
  - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  - CORS_ORIGIN=${CORS_ORIGIN}
```

## User Roles

- **Admin**: Full access - user management, all household operations
- **Editor**: Create, edit, delete households and members
- **Viewer**: Read-only access to households

## API Endpoints

The API is available at `http://localhost:3000/api/`

Key endpoints:
- `GET /api/health` - Health check
- `GET /api/auth/first-run` - Check if setup needed
- `POST /api/auth/setup` - Complete first-run setup
- `POST /api/auth/login` - User login
- `GET /api/households` - List households
- `GET /api/users` - List users (admin only)

See [README.md](README.md) for complete API documentation.

## Troubleshooting

### Container won't start
```bash
docker logs famli
```

### Database issues
```bash
# Remove database and start fresh
docker compose down -v
docker compose up -d
```

### Port already in use
Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

## Deployment to Unraid

1. **Docker** → **Add Container**
2. **Repository**: `famli-famli` (or build and push to Docker Hub)
3. **Port**: `3000` → `3000`
4. **Volume**: `/mnt/user/appdata/famli` → `/app/data`
5. **Environment Variables**:
   - `JWT_SECRET`: Generate a random string (32+ characters)
   - `JWT_REFRESH_SECRET`: Generate another random string
   - `NODE_ENV`: `production`
6. **Apply** and start

## Data Location

Database is stored in Docker volume `famli_famli-data`

To inspect:
```bash
docker volume inspect famli_famli-data
```

## Next Steps

1. ✅ Application is running
2. 📝 Complete first-run setup
3. 👥 Add users with appropriate roles
4. 🏠 Start adding households
5. 🔐 Update JWT secrets for production
6. 🔒 Configure HTTPS via reverse proxy (recommended)

## Support

For issues or questions, check:
- [README.md](README.md) - Full documentation
- Container logs: `docker logs famli`
- Health check: `curl http://localhost:3000/api/health`
