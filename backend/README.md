# NoteNest Backend

Backend scaffold for the NoteNest collaborative knowledge base.

---

## Current State

- Express server
- Health endpoint
- No database
- No authentication

---

## Planned Features

- Notes API
- Search & indexing
- Role-based access
- Versioning

---

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and configure your MongoDB connection and JWT secret.

3. Run database migrations:
```bash
npm run migrate
```

## Run Locally

```bash
npm run dev
```

Health check: http://localhost:5001/health

## Database Migrations

This project uses `migrate-mongo` for database schema versioning.

### Available Commands

- `npm run migrate` - Apply all pending migrations
- `npm run migrate:down` - Rollback the last migration
- `npm run migrate:status` - Check migration status
- `npm run migrate:create <name>` - Create a new migration file

### Creating New Migrations

When you need to make schema changes:

1. Create a new migration:
```bash
npm run migrate:create add-user-avatar-field
```

2. Edit the generated file in `migrations/` directory with your schema changes.

3. Test the migration locally:
```bash
npm run migrate
```

4. Commit the migration file to version control.

### Migration File Structure

Each migration file exports an `up` and `down` function:

```javascript
module.exports = {
  async up(db, client) {
    // Apply changes
    await db.collection('users').updateMany({}, { $set: { avatar: null } });
  },

  async down(db, client) {
    // Rollback changes
    await db.collection('users').updateMany({}, { $unset: { avatar: 1 } });
  }
};
```

---
# NOTICE

After cloning, always run
```bash
npm install
npm run migrate
```
inside backend/ before starting the server.
