// A small in-process job queue for slow work (sending email) so a request never waits for another company's server.
//  - Only a few jobs run at once, so a burst of sign-ups cannot open hundreds of connections to the email service.
//  - A failed job is tried again with exponential backoff and a little randomness (1s, 2s, 4s ... up to a cap).
//    Only failures that can pass (network trouble, 429 and 5xx answers) are retried. A 400 or 401 will never succeed.
//  - The waiting line has a limit. When it is full new jobs are refused and logged, so memory cannot run away.
// Jobs live in memory: a restart loses jobs that are waiting. drain() lets the server finish them before it stops.

export const isRetryable = error => {
  const status = Number(error?.status);
  if (status) return status === 408 || status === 425 || status === 429 || status >= 500;
  return true; // no status: a network error or a timeout
};

export function createQueue(options = {}) {
  const {
    concurrency = 3,
    maxWaiting = 500,
    attempts = 4,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
    random = Math.random,
    log = message => console.warn(message)
  } = options;
  const waiting = [];
  let running = 0;
  let idleWaiters = [];
  const stats = { done: 0, failed: 0, retried: 0, dropped: 0 };

  const delayFor = (attempt, error) => {
    const asked = Number(error?.retryAfterMs) || 0;
    const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    return Math.max(asked, Math.round(backoff / 2 + random() * (backoff / 2))); // "equal jitter"
  };

  async function runJob(job) {
    for (let attempt = 1; ; attempt++) {
      try {
        const value = await job.work();
        stats.done += 1;
        return value;
      } catch (error) {
        if (attempt >= attempts || !isRetryable(error)) {
          stats.failed += 1;
          log(`[queue] ${job.name} gave up after ${attempt} attempt${attempt === 1 ? "" : "s"}: ${String(error?.message || error).slice(0, 200)}`);
          return undefined;
        }
        stats.retried += 1;
        await sleep(delayFor(attempt, error));
      }
    }
  }

  function pump() {
    while (running < concurrency && waiting.length) {
      const job = waiting.shift();
      running += 1;
      runJob(job).finally(() => {
        running -= 1;
        pump();
        if (!running && !waiting.length) {
          const done = idleWaiters;
          idleWaiters = [];
          done.forEach(resolve => resolve());
        }
      });
    }
  }

  return {
    // Adds a job and returns straight away. Returns false when the line is full.
    add(name, work) {
      if (waiting.length >= maxWaiting) {
        stats.dropped += 1;
        log(`[queue] full, dropped job ${name}`);
        return false;
      }
      waiting.push({ name, work });
      pump();
      return true;
    },
    // Resolves when everything has finished, or after timeoutMs.
    drain(timeoutMs = 8000) {
      if (!running && !waiting.length) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(resolve, timeoutMs);
        idleWaiters.push(() => { clearTimeout(timer); resolve(); });
      });
    },
    stats,
    size: () => waiting.length + running
  };
}
