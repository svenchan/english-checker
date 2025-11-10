// testQueue.js
import { enqueue } from "./app/api/check/queue.js";

// Simulate a "handler" that takes a short time (like your API call)
async function fakeHandler(req) {
  console.log(`→ Processing request ${req.id}...`);
  await new Promise((resolve) => setTimeout(resolve, 200)); // simulate Groq processing delay
  console.log(`✅ Finished request ${req.id}`);
  return { success: true, id: req.id };
}

async function runTest() {
  console.log("Starting queue test with 10 concurrent requests...\n");

  const requests = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

  // Launch them all at once (simulate 10 students clicking “Check”)
  const promises = requests.map((req) =>
    enqueue(req, fakeHandler)
      .then((res) => console.log(`Response for ${res.id}: done`))
      .catch((err) => console.error(`Error in request ${req.id}:`, err))
  );

  await Promise.all(promises);

  console.log("\n✅ All requests processed.");
}

runTest();
