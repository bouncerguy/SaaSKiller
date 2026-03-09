# SaaS Killer — Open Source Self-Hosted Business Operating System

## Overview
SaaS Killer is a modular business platform designed to be a comprehensive business operating system. It provides functionalities starting with scheduling and expanding into various business management areas. The project's vision is to offer an open-source, self-hosted alternative to proprietary SaaS solutions, empowering businesses with full control over their data and operations. Key capabilities include booking, customer relationship management (CRM), product catalog, support ticket management, finance/invoicing, time tracking, form building, and email template management.

## User Preferences
I prefer clear, concise, and structured information. When making changes, please explain the "why" behind them, not just the "what." I value iterative development with frequent, small commits. Before implementing major architectural changes or introducing new external dependencies, please ask for my approval. Ensure the codebase remains clean, well-documented, and follows established best practices for maintainability and scalability. Do not make changes to the `shared/schema.ts` file without explicit instruction.

## System Architecture
The application follows a client-server architecture.

**Frontend:**
- Built with React 18, utilizing Wouter for routing, TanStack Query for data fetching, Shadcn UI for componentry, and Tailwind CSS for styling.
- UI/UX decisions prioritize a clean, modern aesthetic with a warm indigo primary color, neutral grays, and the Inter font. Consistent spacing, custom shadows, and full dark mode support are implemented.
- The HUD dashboard provides a unified control center with module-specific statistics.
- The sidebar navigation is structured by function (Core, Operations, Tools, System) for intuitive access.

**Backend:**
- Developed using Express.js and TypeScript, providing a robust API layer.
- Authentication is session-based, utilizing Passport.js (local strategy) with `express-session` and `connect-pg-simple` for session storage in PostgreSQL. Passwords are hashed with bcryptjs.
- The system supports multi-tenancy with tenant isolation and branding capabilities.
- A first-run setup wizard handles initial organization and admin account creation.
- Feature access is managed through a hierarchical permission system: per-user overrides, group-level permissions, and global defaults.

**Database:**
- PostgreSQL is used as the primary data store.
- Drizzle ORM provides a type-safe way to interact with the database.
- The server automatically pushes schema updates using `drizzle-kit` on startup.

**Core Features & Design Patterns:**
- **Booking Engine**: Generates available time slots based on user-defined availability rules, accounting for existing bookings.
- **Modular Design**: The system is built with a modular approach, allowing for easy expansion with new features.
- **Embed SDK**: Provides snippets for embedding booking functionalities (inline, popup, floating widget, iframe).
- **CRUD Operations**: Standardized API routes for Create, Read, Update, and Delete operations across all modules.

## External Dependencies
- **React 18**: Frontend library for building user interfaces.
- **Wouter**: Small routing library for React.
- **TanStack Query**: Data fetching and caching library for React.
- **Shadcn UI**: Collection of reusable components for the UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Express.js**: Web application framework for Node.js.
- **TypeScript**: Superset of JavaScript that adds static typing.
- **Passport.js**: Authentication middleware for Node.js.
- **express-session**: Session middleware for Express.
- **connect-pg-simple**: PostgreSQL session store for `express-session`.
- **bcryptjs**: Library for hashing passwords.
- **PostgreSQL**: Relational database system.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **Vite**: Frontend build tool.
- **Lucide React**: Icon library for React.