const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.yqjlmimksyurbccnqpsz:Nils%3F190301_@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const dir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`Applying ${file}...`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("commit");
      console.log(`OK ${file}`);
    } catch (e) {
      await client.query("rollback");
      console.error(`FAIL ${file}:`, e.message);
      process.exitCode = 1;
      break;
    }
  }
  await client.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
