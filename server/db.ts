import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureSecureMessagingSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE secure_message_status AS ENUM ('DRAFT', 'SENT', 'READ', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS secure_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
        created_by_user_id VARCHAR NOT NULL REFERENCES users(id),
        recipient_name TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        customer_id VARCHAR REFERENCES customers(id),
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        access_token VARCHAR NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        status secure_message_status NOT NULL DEFAULT 'DRAFT',
        expires_at TIMESTAMP,
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS secure_message_activity (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
        message_id VARCHAR NOT NULL REFERENCES secure_messages(id),
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}
