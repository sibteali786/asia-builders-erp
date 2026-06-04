import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import dataSource from './data-source';

// Tables in reverse FK order so CASCADE constraints are respected
const TABLES_IN_ORDER = [
  'investment_value_updates',
  'investments',
  'transaction_settlements',
  'transactions',
  'documents',
  'project_vendors',
  'projects',
  'vendors',
  'vendor_types',
  'transaction_categories',
  'users',
];

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function prune() {
  const skipConfirm =
    process.argv.includes('--yes') || process.argv.includes('-y');

  if (!skipConfirm) {
    console.log('');
    console.log(
      '⚠️  WARNING: This will permanently delete ALL data from the database.',
    );
    console.log(
      '   The schema (tables, indexes, migrations) will be preserved.',
    );
    console.log('   This action cannot be undone.');
    console.log('');

    const confirmed = await confirm('   Type "yes" to continue: ');
    if (!confirmed) {
      console.log('');
      console.log('❌ Prune cancelled.');
      process.exit(0);
    }
  }

  console.log('');
  console.log('🔌 Connecting to database...');
  await dataSource.initialize();

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('🗑️  Truncating all tables...');

    for (const table of TABLES_IN_ORDER) {
      await qr.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`   ✓ ${table}`);
    }

    // Create the default owner account so the app is immediately usable
    const passwordHash = await bcrypt.hash('Password@1234', 10);
    await qr.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['asiabuilderzpk@gmail.com', passwordHash, 'Rauf', 'Khan', 'OWNER', true],
    );

    const accountantHash = await bcrypt.hash('Builders@123', 10);
    const accountants = [
      ['adab.hussain0@gmail.com', 'Adab', 'Hussain'],
      ['azharaziz13@gmail.com', 'Azhar', 'Aziz'],
      ['muddasarhussain10@gmail.com', 'Mudassar', 'Hussain'],
    ];
    for (const [email, firstName, lastName] of accountants) {
      await qr.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [email, accountantHash, firstName, lastName, 'ACCOUNTANT', true],
      );
    }

    await qr.query(`
      INSERT INTO vendor_types (slug, label, is_contractor, is_system_defined, is_active)
      VALUES
        ('CONTRACTOR', 'Contractor', true,  true, true),
        ('SUPPLIER',   'Supplier',   false, true, true),
        ('SERVICE',    'Service',    false, true, true)
      ON CONFLICT (slug) DO UPDATE SET
        is_contractor     = EXCLUDED.is_contractor,
        is_system_defined = EXCLUDED.is_system_defined,
        is_active         = true
    `);

    await qr.commitTransaction();

    console.log('');
    console.log('✅ Database pruned successfully.');
    console.log('');
    console.log('   Default owner account created:');
    console.log('   Email    → asiabuilderzpk@gmail.com');
    console.log('   Password → Password@1234');
    console.log('   Role     → OWNER');
    console.log('');
    console.log(
      '   Vendor Types → CONTRACTOR (contractor), SUPPLIER, SERVICE restored',
    );
    console.log('');
    console.log('   Accountant accounts created (password: Builders@123):');
    console.log('   → adab.hussain0@gmail.com');
    console.log('   → azharaziz13@gmail.com');
    console.log('   → muddasarhussain10@gmail.com');
    console.log('');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

prune().catch((err) => {
  console.error('❌ Prune failed:', err);
  process.exit(1);
});
