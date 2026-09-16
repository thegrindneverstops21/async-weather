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