# 02 · Express (course section 6)

> **How to use this manual:** each section ends with a **Test yourself** block. Try to answer from memory *before* expanding the answer. If you can't, re-read the section, not the whole course.

> **Course vs my project:** the course uses Express 4, JavaScript, a JSON file as the "database" and a hand-written `checkBody` middleware. I use Express 5, TypeScript, an in-memory repository and zod.

## 1. REST in one table

Resources are **nouns** in the URL; the **HTTP method** is the verb. Version the API in the path.

| Method | Path | Meaning | Success code |
|---|---|---|---|
| GET | `/api/v1/exercises` | list | 200 |
| GET | `/api/v1/exercises/:id` | read one | 200 |
| POST | `/api/v1/exercises` | create | **201** Created |
| PATCH | `/api/v1/exercises/:id` | update some fields | 200 |
| PUT | `/api/v1/exercises/:id` | replace the whole object | 200 |
| DELETE | `/api/v1/exercises/:id` | delete | **204** No Content (empty body) |

Errors: **400** invalid input · **401** not logged in · **403** logged in but not allowed · **404** not found · **500** server bug.

REST is **stateless**: each request carries everything the server needs (e.g. the auth token). The server keeps no "session state" between requests.

**JSend** response shape used in this project:

```json
{ "status": "success", "results": 2, "data": { "exercises": [ ... ] } }
{ "status": "fail",    "data": { "name": "Required" } }        // client's fault (4xx)
{ "status": "error",   "message": "Something went wrong" }     // server's fault (5xx)
```

<details><summary>Test yourself</summary>

- Status code for a successful DELETE, and what's in the body? → 204, empty body.
- `/api/v1/getExercises` — what's wrong? → Verb in the URL. Use `GET /api/v1/exercises`.
- 401 vs 403? → 401 = who are you? 403 = I know who you are, and you can't do this.
</details>

---

## 2. The request-response cycle

**Everything in Express is middleware.** A request enters, passes through the middleware stack **in the order you registered it**, and the cycle ends when one of them sends a response.

```
request → express.json() → morgan → router → param mw → validate → controller → res.json() ✓
```

Each middleware must do exactly one of:
- **call `next()`** to pass the request on, or
- **send a response** (`res.json`, `res.status(...).json`, `res.sendStatus`) and stop.

Doing neither → the request hangs forever. Doing both → `Cannot set headers after they are sent`.

```ts
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add data for later middleware
  next();
});
```

**Order matters:** `express.json()` must be registered **before** the routes. Otherwise `req.body` is `undefined` in the controllers (Express 5 no longer defaults it to `{}`).

<details><summary>Test yourself</summary>

- A middleware forgets to call `next()` and sends nothing. What does the client see? → The request hangs until it times out.
- You register `express.json()` after the routers. What happens on POST? → `req.body` is `undefined`.
</details>

---

## 3. The kinds of middleware

| Written as | Runs for | Example |
|---|---|---|
| `app.use(mw)` | every request | `express.json()`, `morgan` |
| `app.use('/api/v1/exercises', router)` | requests starting with that path | mounting a router |
| `router.use(mw)` | every request **inside that router** | auth check for one resource |
| `router.param('id', mw)` | routes in that router that have `:id` | 404 for unknown ids |
| `router.post('/', mwA, mwB, handler)` | that route only, left to right (**chaining**) | `validate(schema)` then the controller |
| `(err, req, res, next) => …` (**4 args**) | only when an error was passed on | global error handler (section 9) |

**Param middleware** gets the value as a 4th argument:

```ts
router.param('id', async (req, res, next, id: string) => {
  const exercise = await exerciseRepo.findById(id);
  if (!exercise) return res.status(404).json({ status: 'fail', message: 'Exercise not found' });
  next();
});
```

Now `GET/PATCH/DELETE /:id` never reach the controller with an unknown id, and the check isn't repeated in 3 controllers.

**Only in development:**

```ts
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
```

<details><summary>Test yourself</summary>

- Difference between `app.use(mw)`, `router.use(mw)` and `router.param('id', mw)`? → Every request / every request in that router / only routes of that router with `:id`.
- How does Express recognize an error-handling middleware? → It has 4 parameters `(err, req, res, next)`.
- Why `return res.status(404)...` and not just `res.status(404)...`? → Without `return`, the code continues and calls `next()` → "headers already sent".
</details>

---

## 4. Routers and file structure

One router per resource, mounted in `app.ts`:

```ts
// src/app.ts
import express from 'express';
import { exerciseRouter } from './routes/exercise.routes.js';
import { userRouter } from './routes/user.routes.js';

export const app = express();
app.use(express.json());
app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/users', userRouter);
```

```ts
// src/routes/exercise.routes.ts
export const exerciseRouter = Router();
exerciseRouter.route('/')
  .get(listExercises)
  .post(validate(createExerciseSchema), createExercise);
exerciseRouter.route('/:id')
  .get(getExercise)
  .patch(validate(updateExerciseSchema), updateExercise)
  .delete(deleteExercise);
```

Inside the router, paths are **relative** to where it's mounted (`'/'` = `/api/v1/exercises`).

| Layer | Knows about | Doesn't know about |
|---|---|---|
| `app.ts` | which routers exist and their base path | handlers |
| routes | URL + method → which middleware and controller | how data is stored |
| controllers | `req`/`res`, status codes, response shape | where data is stored |
| repositories | where and how data is stored | HTTP |

<details><summary>Test yourself</summary>

- Why can the controllers stay unchanged when MongoDB replaces the in-memory array? → They only call the repository's async functions; only the repository changes.
- Inside `exerciseRouter`, what full URL does `.route('/:id')` match? → `/api/v1/exercises/:id`.
</details>

---

## 5. Validation with zod

Validate at the edge, so the controller can trust `req.body`.

```ts
export const createExerciseSchema = z.object({
  name: z.string().min(2),
  muscleGroup: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core']),
  equipment: z.string(),
  difficulty: z.number().int().min(1).max(5),
});
export const updateExerciseSchema = createExerciseSchema.partial(); // PATCH: every field optional
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>; // the TS type, for free

export const validate = (schema: z.ZodType) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ status: 'fail', data: result.error.issues });
  req.body = result.data; // cleaned data: unknown fields removed
  next();
};
```

- `safeParse` returns `{ success, data | error }` instead of throwing.
- `z.infer` means the schema is the single source of truth for both the runtime check and the TS type.
- A plain `z.object` **drops unknown keys**, so a client can't sneak in e.g. `"role": "admin"`.

<details><summary>Test yourself</summary>

- How do you get a PATCH schema from the create schema? → `.partial()`.
- Why is `z.infer` better than writing an `interface` by hand? → One source of truth; they can't drift apart.
- What happens to an unknown field like `isAdmin` in the body? → Removed by `z.object` during parsing.
</details>

---

## 6. `app.ts` vs `server.ts`, and testing

```ts
// src/server.ts — only this file listens
import { app } from './app.js';
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
```

```ts
// tests/exercises.test.ts
import request from 'supertest';
import { app } from '../src/app.js';

it('returns 404 for an unknown id', async () => {
  const res = await request(app).get('/api/v1/exercises/999');
  expect(res.status).toBe(404);
});

it('rejects an invalid body with 400', async () => {
  const res = await request(app).post('/api/v1/exercises').send({ name: 'x' });
  expect(res.status).toBe(400);
});
```

Supertest starts the app on a random port for each test, so no server needs to be running, and tests never collide on port 3000.

<details><summary>Test yourself</summary>

- Why split `app.ts` from `server.ts`? → Tests import `app` without opening a real port; `server.ts` is the only side effect.
- Which 5 cases does a minimum CRUD test file cover? → list, get one, create (201), unknown id (404), invalid body (400).
</details>

---

## 7. Express 5 vs the course's Express 4

| Express 4 (course) | Express 5 (my project) |
|---|---|
| Async errors need a `catchAsync` wrapper or `try/catch` + `next(err)` | A rejected promise in a handler goes to the error middleware automatically |
| `req.query` can be modified | `req.query` is a **read-only getter** → parse it into a new object (matters in section 8) |
| `req.body` defaults to `{}` | `req.body` is `undefined` if no body parser ran |
| `app.get('*', …)` | Wildcards need a name: `app.get('/*splat', …)` |
| `res.send(404)` | `res.sendStatus(404)` |

<details><summary>Test yourself</summary>

- Why doesn't this project need `catchAsync`? → Express 5 catches rejected promises from async handlers and calls `next(err)` for you.
- What breaks if you copy the course's filtering code (`req.query.x = …` / deleting keys) into Express 5? → `req.query` is read-only; copy it into a new object first.
</details>

---

## My predictions vs what the agent did

*(Fill in: the 5 predictions I wrote before running the agent, and what was different.)*

1.
2.
3.
4.
5.

---

## Open questions → to answer in the Mongoose section

- How do I turn `?difficulty[gte]=3&sort=-difficulty` into a query without modifying `req.query`?
- Where should an "exercise not found" check live once there's a database: param middleware, controller or repository?
-

---

← [01 · How Node Works](01-how-node-works.md) · [Index](README.md)
