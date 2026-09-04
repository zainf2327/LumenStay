# AGENTS.md — LumenStay

This file defines the conventions, folder structure, and rules to follow when working on this codebase — whether you're a human contributor or an AI coding agent (Claude Code, Copilot, etc.). Consistency here matters more than personal preference; when in doubt, follow what's already in the codebase over what's written here.

---

## 1. Project Structure

```
LumenStay/
├── client/                 React (Vite) + TypeScript frontend
│   └── src/
│       ├── components/     Shared/reusable UI components
│       ├── features/       Feature-based modules (search, cart, booking, lookup)
│       ├── pages/          Route-level components (Search, Results, Cart, Confirmation, ManageBooking)
│       ├── hooks/          Custom React hooks
│       ├── services/       Axios instance, API call wrappers
│       ├── store/          State management (cart/session state)
│       ├── types/          Shared TypeScript types/interfaces
│       └── utils/          Helper functions (currency formatting, date math)
│
├── server/                 Express + TypeScript backend
│   └── src/
│       ├── db/              schema.sql, index.ts (connection + pragmas), seed.ts
│       ├── routes/v1/       Express route definitions, mounted at /api/v1
│       ├── controllers/     Request handlers (parse req/res, call a service — no business logic)
│       ├── services/        Business logic: availability, pricing, booking transactions
│       ├── middlewares/     error, notFound, validate, asyncHandler
│       ├── validators/      zod schemas per resource
│       ├── types/           ApiResponse<T>, ApiError, domain types
│       └── utils/           response.util.ts (sendSuccess/sendError), logger
│
└── docs/                    Project plan, architecture diagrams, API endpoint reference
```

Do not introduce new top-level folders without updating this file.

---

## 2. Naming Conventions

### Backend (`server/src/`)

| Layer | Convention | Example |
|---|---|---|
| Routes | `camelCase.routes.ts` | `booking.routes.ts`, `availability.routes.ts` |
| Controllers | `camelCase.controller.ts` | `booking.controller.ts`, `property.controller.ts` |
| Services | `camelCase.service.ts` | `booking.service.ts`, `pricing.service.ts` |
| Middleware | `camelCase.middleware.ts` | `error.middleware.ts`, `validate.middleware.ts` |
| Validators | `camelCase.validators.ts` | `booking.validators.ts` |
| Utils | `camelCase.ts` | `response.util.ts`, `logger.ts` |
| Types/interfaces | `PascalCase` inside `types/*.ts` | `interface Reservation { ... }`, `interface ApiResponse<T> { ... }` |

There is no `models/` layer here (this is relational SQLite, not Mongoose) — table shape lives in `db/schema.sql`, and any reusable query logic lives in the relevant `*.service.ts`, not a separate repository layer, unless a table's queries grow large enough to justify splitting into `db/<table>.queries.ts`.

### Frontend (`client/src/`)

| Layer | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `RoomCard.tsx`, `CartSummary.tsx` |
| Hooks | `useCamelCase.ts` | `useAvailability.ts`, `useCart.ts` |
| Pages | `PascalCase.tsx` | `pages/Search.tsx`, `pages/Confirmation.tsx` |
| Services (API calls) | `camelCase.service.ts` | `booking.service.ts`, `property.service.ts` |
| Types | `PascalCase` inside `types/*.ts` | `interface RoomType { ... }` |

### General rules

- Variables and functions: `camelCase`
- Classes, interfaces, types, React components: `PascalCase`
- Constants (env-derived, config): `UPPER_SNAKE_CASE`
- SQLite table names: lowercase, snake_case, plural — `room_types`, `reservation_rooms` (matches `db/schema.sql`, don't alias)
- File names always match the primary export's purpose — no `index.ts` barrel files unless a folder genuinely needs one for re-exports (the one exception: `routes/v1/index.ts`, which mounts the sub-routers)

---

## 3. API Route Conventions

- All routes prefixed with `/api/v1/`
- REST-style, resource-based: `/api/v1/bookings`, `/api/v1/properties`, `/api/v1/availability`
- Use plural nouns for resources: `/bookings` not `/booking`
- Nest only one level deep max: `/api/v1/bookings/:id/cancel` is fine, avoid deeper nesting
- HTTP verbs map to actions: `GET` (read), `POST` (create / actions like cancel), `PATCH` (partial update) — no `PUT`/`DELETE` needed in this POC's scope
- **Every response, success or failure, uses the same envelope** — no route returns a bare object or array:
  ```ts
  // success
  { "success": true, "message": "Availability fetched", "data": { ... } }
  // failure
  { "success": false, "message": "Room type not available for the selected dates", "errors": [ ... ] }
  ```
  Built once via `sendSuccess(res, data, message, statusCode = 200)` / `sendError(res, message, statusCode, errors?)` in `utils/response.util.ts` — controllers call these, never `res.json(...)` directly.
- Auth/role-protected routes are out of scope for the current POC (no accounts yet) — when added, they follow the same `auth.middleware.ts` → `role.middleware.ts` pattern this convention reserves for later, not a one-off.

---

## 4. Code Style

- **TypeScript strict mode** is on — no `any` unless absolutely unavoidable, and if used, comment why
- Prefer `async/await` over `.then()` chains
- Controllers never touch SQL or contain business logic — they parse `req`, call a `service`, and return via `sendSuccess`/`sendError`. All non-trivial logic (availability calculation, pricing, the booking transaction, cancellation rules) lives in `services/`
- Every async controller is wrapped in `asyncHandler` so thrown/rejected errors reach `error.middleware.ts` — never a bare `try/catch` per route
- Errors are thrown as `new ApiError(statusCode, message, errors?)` from services/controllers, not returned as values
- Every route accepting a body/query is validated by a `validate(<schema>)` middleware call against a zod schema in `validators/`, before it reaches the controller
- The booking-creation transaction is the one place correctness matters most: it must re-check availability and assign a room **inside a single DB transaction**, not as two separate queries — this is non-negotiable, not a style preference
- Environment/config values are only read via `process.env` inside a `config` module, never scattered across the codebase
- Keep functions short and single-purpose; if a controller exceeds ~40 lines, that's a sign logic leaked out of `services/` — move it back

### Formatting

- Enforced via **ESLint + Prettier**
- Run `npm run lint` before committing
- No manual formatting overrides — let Prettier decide

---

## 5. Git Conventions

- Branch naming: `feature/<short-description>`, `fix/<short-description>` — e.g. `feature/availability-engine`, `fix/cancellation-cutoff-bug`
- Commit messages: short, present-tense, descriptive — e.g. `Add transactional booking service`, not `stuff` or `updates`
- Commit early and often per logical unit of work, not one giant commit per day
- Never commit `.env` or the `.db`/`.db-wal` SQLite files — verify `.gitignore` covers these before every push

---

## 6. Database Conventions

- Schema lives in `db/schema.sql`, applied on startup via `db/index.ts` — there is no ORM/migration tool for this POC; changes to the schema are edits to that file, applied intentionally, not ad hoc `ALTER TABLE` calls scattered in code
- Every table gets an explicit primary key (`id`, TEXT/UUID) — no reliance on SQLite's implicit rowid
- Foreign keys are declared and enforced (`PRAGMA foreign_keys = ON`, set once in `db/index.ts`)
- Availability and booking queries are written against date-range overlap logic (`existing.check_in < requested.check_out AND existing.check_out > requested.check_in`), never exact-date matching
- `db/seed.ts` is idempotent-ish for POC purposes (fine to require a fresh `.db` file per run) but must always seed the real six properties and their actual room counts — no placeholder/Lorem data

---

## 7. What NOT to do

- Don't introduce new npm packages without a clear reason tied to the current scope
- Don't restructure folders without updating this file
- Don't fake payments, auth, loyalty, OTA sync, or the staff ops app in this codebase "just to look complete" — those are explicitly phase 2+ (see `docs/project-plan.docx`); a half-built stub is worse than an honest README note that it's out of scope
- Don't split the booking availability-check and the room-assignment write into two separate, non-transactional queries — that reintroduces the exact overbooking bug this POC exists to demonstrate a fix for
- Don't hardcode API keys, URLs, or secrets anywhere in source — always via `.env`

---

_Last updated: POC kickoff. Update this file as conventions evolve — it should always reflect actual project practice, not aspirational rules._