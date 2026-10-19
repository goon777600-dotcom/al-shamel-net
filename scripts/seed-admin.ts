import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);

  console.log('Ensuring password column in users table...');
  try {
    await conn.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email');
    console.log('Added password column to users table');
  } catch (err: any) {
    if (err.message && (err.message.includes('Duplicate column name') || err.message.includes('already exists'))) {
      console.log('Password column already exists');
    } else {
      console.log('Alter table response:', err.message);
    }
  }

  // Now create or update admin user nabel7720079495@gmail.com
  const email = 'nabel7720079495@gmail.com';
  const password = '777600kh';
  const openId = 'admin-nabel-7720079495';
  const name = 'المدير نبيل';
  const role = 'admin';

  const [existing]: any = await conn.query('SELECT * FROM users WHERE email = ? OR openId = ?', [email, openId]);

  if (existing.length > 0) {
    await conn.query(
      'UPDATE users SET email = ?, password = ?, role = ?, name = ?, openId = ?, lastSignedIn = NOW() WHERE id = ?',
      [email, password, role, name, openId, existing[0].id]
    );
    console.log('Updated existing user to Admin:', existing[0].id);
  } else {
    await conn.query(
      'INSERT INTO users (openId, name, email, password, role, loginMethod, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [openId, name, email, password, role, 'credentials']
    );
    console.log('Inserted new Admin user:', email);
  }

  // Also ensure wallet exists for this admin
  const [userRow]: any = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (userRow.length > 0) {
    const userId = userRow[0].id;
    const [existingWallet]: any = await conn.query('SELECT id FROM wallets WHERE userId = ?', [userId]);
    if (existingWallet.length === 0) {
      await conn.query(
        'INSERT INTO wallets (userId, balance, totalSpent, totalTopUp) VALUES (?, 10000.00, 0, 10000.00)',
        [userId]
      );
      console.log('Created admin wallet with initial balance');
    }
  }

  const [allUsers]: any = await conn.query('SELECT id, openId, name, email, role, password FROM users');
  console.log('Current users in DB:', allUsers);

  await conn.end();
}

main().catch(console.error);
