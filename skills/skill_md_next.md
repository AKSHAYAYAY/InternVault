---
name: nextjs-fullstack-design
description: Create distinctive, production-grade full-stack applications using Next.js (App Router) with PostgreSQL. Use this when building modern web apps with strong frontend design and solid backend architecture.
license: Complete terms in LICENSE.txt
---

This skill guides creation of **distinctive, production-grade full-stack applications** using **Next.js + PostgreSQL**, combining high-end frontend design with a robust backend.

The user provides requirements: a component, page, or full application. They may include context about purpose, audience, or constraints.

---

## Design + Architecture Thinking

Before coding, understand the context and commit to a **bold direction**:

### Purpose
- What problem does this app solve?
- Who is the user?

### Tone (Frontend Aesthetic)
Choose a strong design identity:
- Brutalist, minimal, editorial, futuristic, luxury, playful, etc.
- Avoid generic SaaS templates unless explicitly requested

### Architecture (Backend)
- Framework: **Next.js (App Router)**
- API: **Route Handlers (`/app/api/...`) or Server Actions**
- Database: **PostgreSQL**
- ORM: **Prisma (recommended)**

### Differentiation
- What makes this product memorable?
- UX, motion, layout, or simplicity?

---

## Tech Stack Defaults

- **Frontend**: Next.js (React Server Components)
- **Styling**: Tailwind CSS (heavily customized)
- **Backend**: Next.js API routes / Server Actions
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth or JWT

---

## Project Structure

```
/app
  /api
  /(auth)
  /(dashboard)
  /components
  /styles

/lib
  db.ts
  auth.ts

/prisma
  schema.prisma

/public
```

---

## Backend Guidelines

### Database (PostgreSQL + Prisma)
- Use normalized schema design
- Define relations properly (1:N, N:N)
- Include timestamps
- Use migrations

Example:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

---

### API Design
- Use RESTful or action-based endpoints
- Prefer Server Actions where suitable
- Validate input (Zod recommended)

---

## Frontend Aesthetics Guidelines

Focus on:

### Typography
- Use distinctive, non-generic fonts
- Strong hierarchy and contrast

### Color & Theme
- Define theme with CSS variables
- Bold palettes over safe defaults

### Motion
- Prioritize meaningful animations (page load, transitions)
- Use Framer Motion when needed

### Spatial Composition
- Break rigid grids
- Use asymmetry, layering, negative space

### Visual Details
- Gradients, textures, shadows, noise
- Avoid flat, default UI

---

## Implementation Principles

- Build real, working features
- Avoid placeholder-only UI
- Ensure responsiveness
- Maintain accessibility
- Connect frontend to backend properly

---

## Development Flow

1. Scaffold Next.js app
2. Set up PostgreSQL + Prisma
3. Implement authentication
4. Build core pages (dashboard, etc.)
5. Apply strong UI design direction
6. Connect APIs and database
7. Refine UX and polish

---

## Key Principle

This is not just about functionality.

It should feel:
- Intentional
- Designed
- Memorable
- Production-ready

Avoid:
- Generic layouts
- Default Tailwind styles
- Cookie-cutter dashboards

Build something that feels like a **real product**, not a template.
