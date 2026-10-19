import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);

  console.log('Ensuring all required tables exist...');

  // 1. users table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) NOT NULL UNIQUE,
      name TEXT,
      email VARCHAR(320),
      loginMethod VARCHAR(64),
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. packages table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category ENUM('card', 'subscription') NOT NULL,
      size ENUM('small', 'medium', 'large', 'huge') NOT NULL,
      color VARCHAR(20) NOT NULL,
      icon VARCHAR(50),
      routerProfileName VARCHAR(160) DEFAULT NULL,
      timeLimit VARCHAR(60) DEFAULT NULL,
      dataLimit VARCHAR(60) DEFAULT NULL,
      isActive INT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. announcements table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(60) NOT NULL,
      title VARCHAR(140) NOT NULL,
      description VARCHAR(280) NOT NULL,
      ctaText VARCHAR(50) NOT NULL DEFAULT 'استكشف الباقات',
      imageUrl VARCHAR(500),
      tone ENUM('gold', 'azure', 'emerald') NOT NULL DEFAULT 'gold',
      isActive INT NOT NULL DEFAULT 1,
      sortOrder INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. wallets table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      balance DECIMAL(15, 2) NOT NULL DEFAULT '0.00',
      totalSpent DECIMAL(15, 2) NOT NULL DEFAULT '0.00',
      totalTopUp DECIMAL(15, 2) NOT NULL DEFAULT '0.00',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. purchases table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      packageId INT NOT NULL,
      pinCode VARCHAR(50) NOT NULL,
      cardPassword VARCHAR(50) DEFAULT '',
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'completed', 'used', 'expired') NOT NULL DEFAULT 'completed',
      routerResponse TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 6. transactions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      type ENUM('purchase', 'topup', 'refund', 'admin_adjustment') NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      balanceBefore DECIMAL(15, 2) NOT NULL,
      balanceAfter DECIMAL(15, 2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. adminAuditLogs table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS adminAuditLogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      adminUserId INT NOT NULL,
      action VARCHAR(80) NOT NULL,
      targetType VARCHAR(50) NOT NULL,
      targetId INT NOT NULL,
      details TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 8. network_routers table (already exists or add missing columns)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS network_routers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL DEFAULT 'سيرفر اليوزر مانجر الرئيسي',
      host VARCHAR(255) NOT NULL DEFAULT 'https://shaml.wifimanage.co',
      apiPort INT NOT NULL DEFAULT 8728,
      username VARCHAR(100) NOT NULL DEFAULT 'admin',
      password VARCHAR(255) NOT NULL DEFAULT '',
      useTls TINYINT(1) NOT NULL DEFAULT 0,
      mode ENUM('usermanager_v6', 'usermanager_v7', 'hotspot', 'web_api') NOT NULL DEFAULT 'usermanager_v6',
      customer VARCHAR(100) NOT NULL DEFAULT 'admin',
      isDefault TINYINT(1) NOT NULL DEFAULT 1,
      status ENUM('online', 'offline', 'error', 'unknown') NOT NULL DEFAULT 'unknown',
      lastCheckedAt TIMESTAMP NULL,
      lastError TEXT,
      systemIdentity VARCHAR(120),
      routerosVersion VARCHAR(60),
      boardName VARCHAR(120),
      uptime VARCHAR(120),
      loginUrl VARCHAR(255) DEFAULT 'http://logout',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Check if router exists, if not insert default router
  const [existingRouters]: any = await conn.query('SELECT * FROM network_routers LIMIT 1');
  if (existingRouters.length === 0) {
    await conn.query(`
      INSERT INTO network_routers (name, host, apiPort, username, password, mode, customer, isDefault)
      VALUES ('خادم اليوزرمانجر الرئيسي', 'https://shaml.wifimanage.co', 8728, 'admin', '', 'usermanager_v6', 'admin', 1)
    `);
    console.log('Inserted default router');
  } else {
    console.log('Existing router found:', existingRouters[0].name, existingRouters[0].host);
  }

  // Check packages count
  const [existingPkgs]: any = await conn.query('SELECT COUNT(*) as count FROM packages');
  if (existingPkgs[0].count === 0) {
    console.log('Inserting default packages...');
    await conn.query(`
      INSERT INTO packages (name, description, price, category, size, color, icon, routerProfileName, timeLimit, dataLimit, isActive)
      VALUES 
      ('كرت 200 ريال - 3 ساعات', 'باقة اقتصادية سريعة صالحة لمدة 3 ساعات برصيد 500 ميجابايت', 200.00, 'card', 'small', 'green', 'Zap', 'profile-200', '3h', '500MB', 1),
      ('كرت 500 ريال - 24 ساعة', 'باقة يومية متكاملة صالحة 24 ساعة برصيد 1.5 جيجابايت', 500.00, 'card', 'medium', 'blue', 'Wifi', 'profile-500', '24h', '1.5GB', 1),
      ('كرت 1000 ريال - أسبوعي', 'باقة أسبوعية مميزة صالحة لمدة 7 أيام برصيد 4 جيجابايت', 1000.00, 'card', 'large', 'purple', 'Crown', 'profile-1000', '168h', '4GB', 1),
      ('اشتراك 3000 ريال - شهري', 'اشتراك شهري للأفراد والشركات سرعة عالية وتصفح غير محدود', 3000.00, 'subscription', 'huge', 'gold', 'ShieldCheck', 'profile-monthly', '720h', 'Unlimited', 1)
    `);
  }

  console.log('All tables are ready and verified!');
  await conn.end();
}

main().catch(console.error);
