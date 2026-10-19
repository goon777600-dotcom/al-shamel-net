import 'dotenv/config';
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function alter() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }

  try {
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active';
    `);
    console.log('SUCCESS: users table updated with status column!');
  } catch (err: any) {
    if (err.message?.includes('Duplicate column') || err.message?.includes('already exists')) {
      console.log('Column status already exists.');
    } else {
      console.error('Error altering table:', err.message);
    }
  }

  process.exit(0);
}

alter();
