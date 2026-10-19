import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);

  console.log('--- TABLES IN DATABASE ---');
  const [tables]: any = await conn.query('SHOW TABLES');
  console.log(tables);

  for (const tableObj of tables) {
    const tableName = Object.values(tableObj)[0] as string;
    const [countRows]: any = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    console.log(`\n=== Table: ${tableName} (Count: ${countRows[0].count}) ===`);
    const [rows]: any = await conn.query(`SELECT * FROM \`${tableName}\` LIMIT 10`);
    console.log(JSON.stringify(rows, null, 2));
  }

  await conn.end();
}

main().catch(console.error);
