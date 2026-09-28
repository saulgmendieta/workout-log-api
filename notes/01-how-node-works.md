# 01 · How Node Works (course section 4)

> **How to use this manual:** each section ends with a **Test yourself** block. Try to answer from memory *before* expanding the answer. If you can't, re-read the section, not the whole course.

## 1. Node = V8 + libuv

| Part | Written in | Job |
|---|---|---|
| **V8** | C++ | Runs your JavaScript (compiles it to machine code) |
| **libuv** | C | Event loop + thread pool + async I/O with the operating system |
| Others | C/C++ | `http-parser`/`llhttp`, `c-ares` (DNS), OpenSSL (crypto), zlib (compression) |

Node gives you JavaScript functions that call into this C/C++ code.

<details><summary>Test yourself</summary>

- Which part runs your JS, and which part makes async I/O possible? → V8 runs JS; libuv handles the event loop and async I/O.
</details>

---

## 2. One thread, one event loop

Node runs **your JavaScript on a single thread.** At startup: initialize → run top-level code → `require`/`import` modules → register callbacks → **start the event loop**.

The event loop runs callbacks in **phases**, one lap ("tick") at a time:

| Phase | Callbacks from |
|---|---|
| 1. Timers | `setTimeout`, `setInterval` that expired |
| 2. Pending callbacks | some system errors deferred from the last lap |
| 3. **Poll** | I/O: finished file reads, incoming network data. Waits here if nothing else is scheduled |
| 4. Check | `setImmediate` |
| 5. Close | `socket.on('close')` and similar |

**Between every single callback**, Node empties two queues first: `process.nextTick` callbacks, then **promise microtasks** (`.then`, `await` continuations).

The loop exits when no timers or I/O are pending. A server never exits because it keeps listening.

<details><summary>Test yourself</summary>

- Order of output: `setTimeout(() => log('timeout'), 0); setImmediate(() => log('immediate')); Promise.resolve().then(() => log('promise')); log('sync')` → `sync`, `promise`, then `timeout`/`immediate` (their order at top level isn't guaranteed; inside an I/O callback, `immediate` always runs first).
- When do promise `.then` callbacks run? → Right after the current callback finishes, before the loop moves on.
</details>

---

## 3. The thread pool

Some work can't be done asynchronously by the OS, so libuv runs it on a **thread pool** (default **4 threads**, change with `UV_THREADPOOL_SIZE`):

- file system (`fs.readFile`, etc.)
- crypto: `pbkdf2`, `scrypt`, `randomBytes`… (**bcrypt password hashing lands here, section 10**)
- `zlib` compression
- `dns.lookup`

**Network I/O does NOT use the pool.** Sockets use the OS's own async mechanisms (IOCP on Windows, epoll on Linux). That's why one Node process handles thousands of connections.

<details><summary>Test yourself</summary>

- 5 password hashes start at the same moment with a default pool. What happens? → 4 run in parallel, the 5th waits for a free thread.
- Does handling 1,000 HTTP requests need 1,000 pool threads? → No. Network I/O is handled by the OS, not the pool.
</details>

---

## 4. Don't block the event loop

While your JS runs, **nothing else runs**: no other request is served. So in request handlers, avoid:

| Blocking | Use instead |
|---|---|
| `fs.readFileSync` inside a handler | `await fs.promises.readFile` (sync is fine at startup only) |
| `crypto.pbkdf2Sync`, `bcrypt.hashSync` | the async versions |
| `JSON.parse` / `JSON.stringify` of huge objects | stream, paginate, or send less |
| Very long loops / heavy computation | worker threads or a job queue |
| Catastrophic regex on user input | simple, bounded patterns |

<details><summary>Test yourself</summary>

- Why is `readFileSync` OK at startup but not in a route handler? → At startup no requests are waiting. In a handler it freezes every other request until the read ends.
</details>

---

## 5. Events: the EventEmitter pattern

Many Node objects are **emitters**: they `emit` named events, and you register **listeners** with `on`.

```ts
import { EventEmitter } from 'node:events';

const sales = new EventEmitter();
sales.on('newSale', (qty: number) => console.log(`Sold ${qty}`)); // listener
sales.emit('newSale', 9);                                         // fires every listener, in order
```

`http.createServer()` returns an emitter: `server.on('request', ...)`, `server.on('close', ...)`. Express is built on top of this.

<details><summary>Test yourself</summary>

- Are listeners called synchronously or asynchronously when you `emit`? → Synchronously, in registration order.
</details>

---

## 6. Streams: process data piece by piece

Instead of loading a whole file into memory, a stream sends it in **chunks**.

| Type | Example |
|---|---|
| Readable | `fs.createReadStream`, the incoming `req` |
| Writable | `fs.createWriteStream`, the outgoing `res` |
| Duplex | a TCP socket |
| Transform | `zlib.createGzip()` |

```ts
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';

await pipeline(createReadStream('big.csv'), res); // chunks go to the client as they're read
```

- **Backpressure:** if the writable (a slow client) can't keep up, the readable pauses. `pipe`/`pipeline` do this for you.
- Prefer **`pipeline`** over `.pipe()`: it forwards errors and cleans up all streams if one fails.

<details><summary>Test yourself</summary>

- Why stream a 2 GB file instead of `readFile`? → `readFile` loads all 2 GB into memory; a stream keeps only one chunk at a time.
- What is backpressure? → Pausing the source when the destination can't consume data fast enough.
- `pipe` or `pipeline`? → `pipeline`: proper error handling and cleanup.
</details>

---

## 7. Modules

> **Course vs my project:** the course uses **CommonJS** (`require`, `module.exports`). I use **ES modules** (`import`, `export`), the modern standard.

| | CommonJS | ES modules |
|---|---|---|
| Import | `const x = require('./x')` | `import { x } from './x.js'` |
| Export | `module.exports = x` | `export const x = …` / `export default x` |
| Loading | synchronous, at runtime | parsed before running; top-level `await` allowed |
| Current folder | `__dirname` | `import.meta.dirname` |

Modules are **cached**: the code of a module runs once, the first time it's imported. Later imports get the same object. (That's why a module-level array works as a simple in-memory store.)

<details><summary>Test yourself</summary>

- Two files import the same module. How many times does its top-level code run? → Once. The second import gets the cached result.
- What replaces `__dirname` in ESM? → `import.meta.dirname`.
</details>

---

← [00 · Basics](00-basics.md) · [Index](README.md) · [02 · Express](02-express.md) →
