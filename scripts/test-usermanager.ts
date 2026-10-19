import { getActiveRouterConfig, testUserManagerConnection } from '../server/userManager';

async function main() {
  console.log('Testing getActiveRouterConfig...');
  const config = await getActiveRouterConfig();
  console.log('Active Router Config:', config);

  console.log('Testing testUserManagerConnection with host:', config.host);
  const result = await testUserManagerConnection();
  console.log('Test Connection Result:', result);
}

main().catch(console.error);
