import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);
  const [rows] = await conn.query('SELECT * FROM app_settings');
  console.log('APP_SETTINGS:', rows);
  await conn.end();
}

main().catch(console.error);
