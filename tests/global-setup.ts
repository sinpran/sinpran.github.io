import { spawn, type ChildProcess } from "node:child_process";
import { execFileSync } from "node:child_process";

export const PORT = 4322;
export const BASE_URL = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

async function waitForServer(url: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`preview server never came up at ${url}`);
}

export async function setup() {
  // The static-HTML tests read dist/ directly and the browser tests hit the
  // preview server, so both need a fresh build.
  execFileSync("npx", ["astro", "build"], { stdio: "inherit" });

  server = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
    stdio: "ignore",
    detached: true,
  });

  await waitForServer(`${BASE_URL}/`);
}

export async function teardown() {
  // Negative pid kills the whole process group; astro preview spawns children.
  if (server?.pid) {
    try {
      process.kill(-server.pid);
    } catch {
      // already gone
    }
  }
}
