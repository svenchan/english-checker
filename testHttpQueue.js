// testHttpQueue.js
// Node 18+ already includes fetch(), no need for node-fetch

const ENDPOINT = "http://localhost:3000/api/check"; // Adjust if needed
const CLASS_CODE = "TEACHER"; // ✅ Your valid class code
const NUM_REQUESTS = 10; // How many students to simulate

async function simulateStudent(id) {
  const start = Date.now();
  console.log(`👩‍🎓 Student ${id} sending request...`);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `This is a test sentence from student ${id}.`,
      classCode: CLASS_CODE,
    }),
  });

  const data = await res.json();
  const duration = Date.now() - start;

  console.log(
    `✅ Student ${id} got response after ${duration}ms:`,
    data.error ? `Error: ${data.error}` : "Success"
  );
}

async function run() {
  console.log(`🚀 Sending ${NUM_REQUESTS} concurrent test requests...\n`);
  const promises = Array.from({ length: NUM_REQUESTS }, (_, i) =>
    simulateStudent(i + 1)
  );
  await Promise.all(promises);
  console.log("\n✅ All done.");
}

run();
