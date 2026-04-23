import "dotenv/config";
import app from "./app";

const rawPort = process.env["PORT"];
const host = "0.0.0.0";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Validate additional required environment variables
const requiredEnvVars = ["DATABASE_URL", "MAPBOX_SECRET_KEY"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `Critical environment variables are missing: ${missingVars.join(", ")}`
  );
}

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
