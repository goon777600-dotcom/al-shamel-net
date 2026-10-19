import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';

  try {
    const conn = await mysql.createConnection(url);
    console.log('CONNECTED TO DATABASE SUCCESSFULLY!');
    const [rows] = await conn.query('SHOW TABLES');
    console.log('Tables in database:', rows);
    await conn.end();
  } catch (err: any) {
    console.error('Connection failed:', err.message);
  }
}

main();
