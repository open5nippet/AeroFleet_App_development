import app from "./app";

const rawPort = process.env["PORT"];

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
const requiredEnvVars = ["DATABASE_URL", "MAPBOX_KEY"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(
    `Warning: The following environment variables are recommended but not set: ${missingVars.join(", ")}`
  );
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
