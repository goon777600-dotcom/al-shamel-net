import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';

  try {
    const conn = await mysql.createConnection(url);
    const [routers] = await conn.query('SELECT * FROM network_routers');
    console.log('ROUTERS:', JSON.stringify(routers, null, 2));

    const [profiles] = await conn.query('SELECT * FROM wifi_card_profiles');
    console.log('PROFILES:', JSON.stringify(profiles, null, 2));

    const [settings] = await conn.query('SELECT * FROM app_settings');
    console.log('APP_SETTINGS:', JSON.stringify(settings, null, 2));

    await conn.end();
  } catch (err: any) {
    console.error('Query failed:', err.message);
  }
}

main();
