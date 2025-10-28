# Database Setup

This application uses **SQLite** for local development with **Prisma ORM**.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Create and setup database:**
   ```bash
   npm run db:push
   ```

4. **Seed with initial data:**
   ```bash
   npm run db:seed
   ```

## Available Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database and run migrations

## Default Users

After seeding, you can login with:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

**Test User:**
- Email: `test@example.com`
- Password: `test123`

## Database File

The SQLite database is stored as `prisma/dev.db` in the project. This file is git-ignored and will be created automatically when you run the setup commands.

## Prisma Studio

To view and edit your data with a GUI:
```bash
npm run db:studio
```

This will open Prisma Studio at `http://localhost:5555`

## Environment Variables

The database is configured via the `DATABASE_URL` environment variable:
```
DATABASE_URL="file:./prisma/dev.db"
```

## Troubleshooting

If you see a warning about "output path" when running Prisma generate, it's already been fixed in the schema with:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

## Production

For production, you would typically use PostgreSQL. Update the `DATABASE_URL` and change the provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.