import 'dotenv/config';
import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }

  console.log('Connected to database, creating tables...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NULL,
      type ENUM('new_user', 'purchase', 'topup_request', 'system') NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      data TEXT NULL,
      isRead BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS top_up_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      method VARCHAR(80) NOT NULL,
      referenceNumber VARCHAR(120) NULL,
      senderName VARCHAR(150) NULL,
      notes TEXT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      adminNotes TEXT NULL,
      reviewedAt TIMESTAMP NULL,
      reviewedByAdminId INT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('SUCCESS: Notifications & TopUp tables created!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
