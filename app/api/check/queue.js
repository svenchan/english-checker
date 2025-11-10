// app/api/check/queue.js
const queue = [];
let processing = false;

// Adjust this delay as needed (e.g. 300–500 ms)
const REQUEST_INTERVAL = 300;

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  const { req, resolve, reject, handler } = queue.shift();

  try {
    const result = await handler(req);
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    processing = false;
    setTimeout(processQueue, REQUEST_INTERVAL);
  }
}

/**
 * Adds a request to the queue and returns a Promise
 */
export function enqueue(req, handler) {
  return new Promise((resolve, reject) => {
    queue.push({ req, resolve, reject, handler });
    processQueue();
  });
}
