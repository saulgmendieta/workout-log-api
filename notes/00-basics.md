# 00 · Basics: setup, tooling & project anatomy

> **How to use this manual:** each section ends with a **Test yourself** block. Try to answer from memory *before* expanding the answer. If you can't, re-read the section, not the whole course.

## Setup (one time, Windows)

1. **Node.js 24 LTS** from nodejs.org → check with `node -v` and `npm -v`.
2. **Cursor extensions:** ESLint, Prettier, Vitest (runs tests from the editor).
3. **API client:** Postman or the REST Client extension, to call endpoints by hand.
4. **Env file:** `cp .env.example .env`. `.env` holds real values and is **never committed**; `.env.example` shows which keys exist and **is committed**.
5. **Markdown preview:** `Ctrl+K`, then `V`.

## Git routine

```
git add .
git commit -m "what I did"
git push
```

- First time on a new PC: `git config --global user.name "..."` and `git config --global user.email "..."`.
- `.gitignore` excludes `node_modules/`, `dist/`, `.env`, `coverage/`. Commit `package-lock.json`.
- Before every commit: `npm test` and `npx tsc --noEmit` (type check only).

---

## 0. Project anatomy

```
workout-log-api/
├── src/                ← your code
├── tests/              ← Vitest + Supertest tests
├── package.json        ← scripts + dependencies (like Cargo.toml)
├── package-lock.json   ← exact installed versions. npm manages it. Commit it, never edit it
├── tsconfig.json       ← TypeScript compiler settings
├── .env / .env.example ← config values / the list of keys
├── node_modules/       ← installed packages. Never commit, safe to delete (npm install restores it)
└── dist/               ← compiled JavaScript from `npm run build`. Never commit
```

**Rule:** you work in `src/`, `tests/` and `package.json`. npm and tsc handle everything else.

| Command | What it does |
|---|---|
| `npm install` | Install everything in package.json (after cloning) |
| `npm install zod` | Add a runtime dependency |
| `npm install -D vitest` | Add a dev-only dependency (tests, types, tooling) |
| `npm run dev` | Start with auto-reload |
| `npm test` | Run the tests once |
| `npx tsc --noEmit` | Type-check without producing files. Fast; use it constantly |
| `npm run build` / `npm start` | Compile to `dist/`, then run the compiled code (production style) |

**dependencies vs devDependencies:** if the running server needs it (`express`, `zod`), it's a dependency. If only you need it while developing (`typescript`, `vitest`, `@types/*`), it's a devDependency.

**Version ranges:** `^5.2.1` = any `5.x.x` from 5.2.1 up (minor and patch updates, never a new major). `~5.2.1` = patch updates only. The lock file pins the exact version actually installed.

<details><summary>Test yourself</summary>

- Which files do you never commit? → `node_modules/`, `dist/`, `.env`.
- Why commit `package-lock.json`? → So everyone (and the server) installs exactly the same versions.
- Is `typescript` a dependency or a devDependency? Why? → Dev. The server runs the compiled JS in `dist/`, it doesn't need the compiler.
- Fastest way to know whether the code type-checks? → `npx tsc --noEmit`
</details>

---

## 1. Scripts in this project

| Script | Runs | Why |
|---|---|---|
| `dev` | `tsx watch --env-file=.env src/server.ts` | Runs TS directly, restarts on save, loads `.env`. Replaces the course's `nodemon` + `dotenv` |
| `build` | `tsc` | TS → JS in `dist/` |
| `start` | `node --env-file=.env dist/server.js` | Production start. Node reads `.env` itself, no `dotenv` package |
| `test` | `vitest run` | All tests once (CI style) |

<details><summary>Test yourself</summary>

- What two packages from the course do `tsx watch` and `--env-file` replace? → `nodemon` and `dotenv`.
</details>

---

## 2. tsconfig: the flags that matter

| Flag | What it does |
|---|---|
| `"module": "NodeNext"` | Follow Node's real ESM rules. **Relative imports need the `.js` extension**, even in `.ts` files: `import { app } from './app.js'` |
| `"strict": true` | All strict checks. `null`/`undefined` must be handled |
| `"noUncheckedIndexedAccess": true` | `arr[0]` and `obj[key]` are typed `T \| undefined`. Forces you to handle "not found" |
| `"verbatimModuleSyntax": true` | Type-only imports must say so: `import type { Request } from 'express'` |
| `"outDir": "dist"`, `"rootDir": "src"` | Where compiled files go / where sources are |

`"type": "module"` in package.json makes every `.js` file an ES module (`import`/`export`), not CommonJS (`require`/`module.exports`).

<details><summary>Test yourself</summary>

- Why does `import { app } from './app'` fail? → NodeNext requires the extension: `./app.js`.
- With `noUncheckedIndexedAccess`, what's the type of `exercises[0]`? → `Exercise | undefined`.
- When do you write `import type`? → When the import is only used as a type (removed at compile time).
</details>

---

[Index](README.md) · [01 · How Node Works](01-how-node-works.md) →
