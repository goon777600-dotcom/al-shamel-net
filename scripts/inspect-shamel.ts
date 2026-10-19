import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);

  const targetTables = [
    'users',
    'wallets',
    'purchases',
    'transactions',
    'packages',
    'announcements',
    'network_routers',
    'notifications',
    'top_up_requests',
    'payment_methods'
  ];

  for (const table of targetTables) {
    try {
      const [rows]: any = await conn.query(`SELECT * FROM \`${table}\``);
      console.log(`\n================== ${table.toUpperCase()} (${rows.length} rows) ==================`);
      console.log(JSON.stringify(rows, null, 2));
    } catch (e: any) {
      console.log(`Table ${table} error:`, e.message);
    }
  }

  await conn.end();
}

main().catch(console.error);
