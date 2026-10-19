import mysql from 'mysql2/promise';

async function main() {
  const url = 'mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const conn = await mysql.createConnection(url);

  console.log('=== CASH BALANCES & ACCOUNTS ===');
  const [cashAccounts]: any = await conn.query('SELECT * FROM cash_accounts');
  console.log('Cash Accounts:', cashAccounts);

  const [cashBalances]: any = await conn.query('SELECT * FROM cash_balances');
  console.log('Main Cash Balances:', cashBalances);

  const [bankBalances]: any = await conn.query('SELECT * FROM cash_account_balances');
  console.log('Bank/Account Balances:', bankBalances);

  const [indCashBal]: any = await conn.query('SELECT * FROM individual_subscription_cash_balances');
  console.log('Individual Subscriptions Cash Box:', indCashBal);

  console.log('\n=== CONTACTS (CUSTOMERS & SUPPLIERS) ===');
  const [contacts]: any = await conn.query('SELECT id, name, type, phone, address, isActive FROM contacts');
  console.log(contacts);

  console.log('\n=== INDIVIDUAL SUBSCRIPTION ACCOUNTS STATS ===');
  const [subStats]: any = await conn.query(`
    SELECT 
      COUNT(*) as totalAccounts,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as activeAccounts,
      COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspendedAccounts,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closedAccounts,
      COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as withPhone,
      COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as withoutPhone
    FROM individual_subscription_accounts
  `);
  console.log('Subscription Accounts Stats:', subStats);

  const [chargesSum]: any = await conn.query(`
    SELECT 
      currencyCode,
      COUNT(*) as count,
      SUM(CAST(amount AS DECIMAL(15,2))) as totalCharges,
      SUM(CAST(paidAmount AS DECIMAL(15,2))) as totalPaid,
      SUM(CAST(amount AS DECIMAL(15,2)) - CAST(paidAmount AS DECIMAL(15,2))) as totalDue
    FROM individual_subscription_charges
    GROUP BY currencyCode
  `);
  console.log('Subscription Charges by Currency:', chargesSum);

  const [invoicesSum]: any = await conn.query(`
    SELECT 
      currencyCode,
      COUNT(*) as count,
      SUM(CAST(totalAmount AS DECIMAL(15,2))) as totalInvoiced,
      SUM(CAST(dueAmount AS DECIMAL(15,2))) as totalDue
    FROM invoices
    GROUP BY currencyCode
  `);
  console.log('Invoices Summary:', invoicesSum);

  console.log('\n=== SAMPLE SUBSCRIPTION ACCOUNTS (FIRST 10) ===');
  const [sampleSubs]: any = await conn.query(`
    SELECT id, name, phone, status, createdAt 
    FROM individual_subscription_accounts 
    LIMIT 10
  `);
  console.log(sampleSubs);

  await conn.end();
}

main().catch(console.error);
