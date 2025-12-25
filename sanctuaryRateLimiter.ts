export const MIN_INTERVAL_MS = 2000; // STRICT 2-SECOND RULE
const MAX_RETRIES = 5;

let lastCallAt = 0;
let processing = false;

interface QueueItem<T> {
  job: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  retries: number;
}

const queue: Array<QueueItem<any>> = [];

/**
 * Serial Queue Processor
 * Ensures calls happen strictly one after another with padding.
 */
function processQueue() {
  if (processing) return;
  if (queue.length === 0) return;

  processing = true;

  const now = Date.now();
  // Ensure strict spacing from the LAST call's start time
  const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - now);

  setTimeout(async () => {
    // Re-check queue in case of race conditions
    if (queue.length === 0) {
        processing = false;
        return;
    }

    const item = queue.shift();
    if (!item) {
        processing = false;
        return;
    }

    try {
      lastCallAt = Date.now(); // Mark execution start
      const result = await item.job();
      item.resolve(result);
    } catch (err: any) {
      const msg = (err?.message || JSON.stringify(err)).toLowerCase();
      
      const isTransient = msg.includes('429') || 
                          msg.includes('resource_exhausted') || 
                          msg.includes('quota') || 
                          msg.includes('503') ||
                          msg.includes('overloaded');

      if (isTransient && item.retries < MAX_RETRIES) {
          item.retries++;
          
          // Exponential Backoff: 2s, 4s, 8s, 16s...
          const backoff = 2000 * Math.pow(2, item.retries);
          
          console.warn(`[Sanctuary] Rate Limit Hit. Pausing queue for ${backoff}ms. Retry ${item.retries}/${MAX_RETRIES}.`);
          
          // Put back at HEAD of queue
          queue.unshift(item);
          
          // Force the next queue cycle to wait this full duration
          lastCallAt = Date.now() + backoff;
      } else {
          // Terminal failure: Do not log "attempts" unless we actually retried.
          if (item.retries > 0) {
            console.error(`[Sanctuary] Job failed after ${item.retries} attempts.`);
          }
          item.reject(err);
      }
    } finally {
      processing = false;
      // Always process next, but the logic above sets 'lastCallAt' into the future
      // if a backoff is needed, effectively sleeping the queue.
      if (queue.length > 0) processQueue();
    }
  }, wait);
}

export function withSanctuaryRateLimit<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ job, resolve, reject, retries: 0 });
    processQueue();
  });
}