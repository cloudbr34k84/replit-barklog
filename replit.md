# PetCare - Pet Health Management System

## Overview
A fullstack pet care management system for tracking multiple pets with health records, weight history, categorized events (vet visits, medications, vaccinations, appointments), multi-pet event attribution, and automated reminders. Built with Express + React + PostgreSQL + TipTap WYSIWYG editor + Replit Object Storage for pet avatars.

## Project Architecture
- **Backend**: Express.js (v5) with TypeScript, Drizzle ORM, PostgreSQL (Neon)
- **Frontend**: React with Vite, TanStack Query v5, Wouter routing, Recharts
- **UI**: Shadcn components, Tailwind CSS, Lucide icons
- **Rich Text**: TipTap WYSIWYG editor for event notes
- **Storage**: Replit Object Storage for pet avatar uploads via Uppy
- **Validation**: Zod schemas via drizzle-zod on all API endpoints

## Key Files
- `shared/schema.ts` - Database models (pets, weightEntries, events, petEvents, vaccinations, medications) + insert schemas
- `server/routes.ts` - API routes with Zod validation
- `server/storage.ts` - Database storage interface (IStorage)
- `server/seed.ts` - Seed data (3 pets, 18 weight entries, 6 events)
- `client/src/App.tsx` - Root layout with Shadcn sidebar
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/components/rich-text-editor.tsx` - TipTap WYSIWYG editor
- `client/src/pages/dashboard.tsx` - Stats cards + weight chart
- `client/src/pages/pets.tsx` - Pet list + add pet dialog
- `client/src/pages/pet-detail.tsx` - Pet profile, weight chart, event history
- `client/src/pages/events.tsx` - Events list with category filtering + WYSIWYG notes
- `client/src/pages/reminders.tsx` - Upcoming reminders with status badges
- `client/src/pages/settings.tsx` - Settings placeholder

## Recent Changes
- 2026-02-13: Added vaccination and medication tracking with tabbed pet profile, status badges, quick-create from vet visits, and upcoming health events summary
- 2026-02-10: Fixed Express v5 path-to-regexp incompatibility for object storage route
- 2026-02-10: Added Zod validation to all POST/PATCH API routes
- 2026-02-10: Fixed RichTextEditor toolbar buttons to use Button size="icon" without manual h/w classes
- 2026-02-10: Initial build of complete MVP with all features

## Technical Notes
- Express v5 uses path-to-regexp v8 which doesn't support `:param(*)` syntax; object storage route uses `app.use` middleware pattern instead
- Object storage route uses `req.originalUrl` to get full path for file serving
- Forms use controlled useState pattern (not react-hook-form) - validation handled server-side via Zod
- Dark mode supported via ThemeProvider with class-based toggling
