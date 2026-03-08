# Contributing to SaaS Killer

Thank you for your interest in contributing to SaaS Killer! This project exists to help individuals and small teams own their scheduling infrastructure.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up your PostgreSQL database and create a `.env` file (see `.env.example`)
5. Push the database schema: `npm run db:push`
6. Start the development server: `npm run dev`

## How to Contribute

### Reporting Bugs

Open an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node.js version, browser)

### Suggesting Features

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Code

1. Create a feature branch from `main`: `git checkout -b feature/your-feature`
2. Make your changes
3. Test your changes locally
4. Commit with clear, descriptive messages
5. Push to your fork and open a Pull Request

### Code Style

- TypeScript throughout (frontend and backend)
- Use existing patterns in the codebase as a reference
- Shadcn UI components for the frontend
- Drizzle ORM for database operations
- Zod for validation

### What We Value

- **Simplicity**: SaaS Killer is meant to be easy to self-host and integrate. Avoid unnecessary complexity.
- **No vendor lock-in**: Features should work with standard protocols (like ICS feeds) rather than requiring specific provider APIs.
- **Timezone correctness**: Scheduling is inherently timezone-sensitive. Test across multiple timezones.
- **Multi-tenant safety**: All queries must be scoped to the correct tenant.

## Project Structure

```
client/src/        Frontend (React + Vite)
  pages/           Page components
  components/      Shared UI components
server/            Backend (Express + TypeScript)
  routes.ts        API route handlers
  storage.ts       Database access layer
  ics-calendar.ts  ICS feed integration
shared/            Shared types and schemas
  schema.ts        Drizzle ORM schema + Zod validators
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
