import { neon } from "@neondatabase/serverless";

import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

const missingDbConfigQuery = async () => {
  throw new Error(
    "DATABASE_URL is not configured. Add it to backend/.env to enable database operations."
  );
};

// Creates a SQL connection using our DB URL when available.
export const sql = databaseUrl ? neon(databaseUrl) : missingDbConfigQuery;

export async function initDB() {
  if (!databaseUrl) {
    console.warn(
      "DATABASE_URL is not set. Server will start, but transaction endpoints will fail until DB is configured."
    );
    return;
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title  VARCHAR(255) NOT NULL,
      amount  DECIMAL(10,2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    )`;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
  }
}
