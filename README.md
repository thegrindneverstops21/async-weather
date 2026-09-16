# Async Weather & News Dashboard

A Node.js + TypeScript project that fetches live weather (Open-Meteo) and news headlines (DummyJSON Posts API) using three different asynchronous styles: callbacks, promises, and async/await.

## Setup

```bash
npm install
```

## Usage

| Command | Runs |
|---|---|
| `npm run callback` | Callback-based version, showing nested "callback hell" | ![alt text](image.png) |
| `npm run promise` | Promise chaining, `Promise.all()`, and `Promise.race()` | ![alt text](image-1.png)|
| `npm run async` | Async/await with try/catch, `Promise.all()`, and `Promise.race()` | ![alt text](image-2.png) |

## Project Structure

src/
├── types.ts Shared WeatherData / NewsData interfaces
├── utils.ts Shared error formatting for consistency across versions
├── callbackVersion.ts Callback-style implementation
├── promiseVersion.ts Promise-style implementation
└── asyncAwaitVersion.ts Async/await implementation


## Learning Outcomes

- **Callbacks**: nesting a dependent call (news) inside another call's callback (weather) demonstrates why deeply nested asynchronous code becomes hard to read and maintain, commonly called "callback hell."
- **Promises**: chaining `.then()` calls flattens the nesting into a readable sequence, and `Promise.all()` shows how independent requests (weather and news don't depend on each other) can run concurrently instead of one after another.
- **Async/await**: syntactic sugar over promises that reads like synchronous code while still being non-blocking, with `try...catch` giving a familiar error-handling model.
- **Promise.all() vs Promise.race()**: `all()` waits for every promise to settle and is used here to fetch weather and news at the same time; `race()` resolves or rejects as soon as the first promise settles, useful when you only care about whichever source responds fastest.

## Sample Console Output

### Callback version

### Promise version

### Async/await version