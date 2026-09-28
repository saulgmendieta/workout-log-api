# workout-log-api

A REST API for logging workouts, written in TypeScript with Express. I'm building it step by step while learning Node.js backend development: each course section adds a feature that uses what that section teaches.

It's a learning project, so the code shows my progress over time rather than a finished product. My study notes are in [`notes/`](notes/README.md).

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 24 LTS, ES modules |
| Language | TypeScript (strict) |
| Framework | Express 5 |
| Validation | zod |
| Tests | Vitest + Supertest |
| Database | In-memory for now → MongoDB + Mongoose in the Mongoose section |

## Endpoints (current)

All responses use the JSend shape: `{ "status": "success" | "fail" | "error", "data": ... }`.

| Method | Path | What it does | Success |
|---|---|---|---|
| GET | `/api/v1/exercises` | List all exercises | 200 |
| GET | `/api/v1/exercises/:id` | Get one exercise | 200 (404 if unknown) |
| POST | `/api/v1/exercises` | Create an exercise | 201 (400 if the body is invalid) |
| PATCH | `/api/v1/exercises/:id` | Update some fields | 200 |
| DELETE | `/api/v1/exercises/:id` | Delete an exercise | 204 |
| * | `/api/v1/users` | Stub router, filled in the Auth section | — |

An exercise looks like this:

```json
{ "id": "3f2b8c1e-7a4d-4e9b-9c2a-5d1e6f7a8b90", "name": "Bench press", "muscleGroup": "chest", "equipment": "barbell", "difficulty": 3 }
```

## Run it

Requires [Node.js](https://nodejs.org) 24 or newer.

```
git clone https://github.com/saulgmendieta/workout-log-api.git
cd workout-log-api
npm install
cp .env.example .env
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (`tsx watch`) |
| `npm test` | Run the tests once |
| `npm run test:watch` | Re-run the tests on every change |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |

## Project structure

```
src/app.ts            builds the Express app (middleware + routers); exported for tests
src/server.ts         only starts listening on PORT
src/routes/           one router per resource, mounted under /api/v1
src/controllers/      request handlers: read the request, call the repository, send the response
src/repositories/     data access; the only place that knows where data is stored
src/middleware/       validation, param checks and other reusable middleware
tests/                Vitest + Supertest API tests
notes/                my Node.js manual, one file per course section
```

## Design

- **`app.ts` and `server.ts` are separate**, so tests import the app without opening a port.
- **Controllers never touch storage directly.** They call a repository with an async interface. Swapping the in-memory store for MongoDB changes the repository, not the controllers.
- **Validation happens at the edge.** zod checks the body before the controller runs, so controllers can trust their input.
- **No `catchAsync` wrapper.** Express 5 forwards errors from async handlers to the error middleware automatically.

## Known limitations

These are intentional for now. Each one is fixed in a later section:

- Data lives in memory and is lost on restart → *MongoDB & Mongoose*
- No filtering, sorting or pagination → *Mongoose* (API features)
- Errors aren't handled in one central place → *Error handling*
- Anyone can create or delete exercises → *Authentication & security*

## Roadmap

| Course section | Feature it adds |
|---|---|
| ✅ Express | Exercises CRUD, routers, validation, param middleware, tests |
| ⬜ MongoDB & Mongoose | Persistence, filtering/sorting/pagination, stats per muscle group |
| ⬜ Error handling | Global error middleware, `AppError`, operational vs programming errors |
| ⬜ Authentication & security | Users, JWT, roles (athlete / coach / admin), password reset, rate limiting |
| ⬜ Data modelling | Routines and workout sessions, populate, nested routes, indexes |
| ⬜ Uploads & email | Exercise images and avatars (Multer + Sharp), emails |
| ⬜ Deployment | Docker, CORS, compression, graceful shutdown, deploy to Render |

## Course

Based on the concepts of *Node.js, Express, MongoDB & More: The Complete Bootcamp* (Jonas Schmedtmann, Udemy). The course builds a tours API; this project applies the same ideas to a different domain.
