import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Set before running once locally, then remove the plaintext password from this file.
const USERNAME = "teacher";
const PASSWORD = "";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set (add it to .env.local)");
  process.exit(1);
}

if (!USERNAME || !PASSWORD) {
  console.error("Set USERNAME and PASSWORD in this script before running.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(PASSWORD, 12);
const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`
    insert into teachers (username, password_hash)
    values (${USERNAME}, ${passwordHash})
  `;
  console.log("done");
} catch (error) {
  console.error(error.message);
  process.exit(1);
} finally {
  await sql.end();
}
