import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';

type IdRow = { id: number };

async function seed() {
  console.log('🌱 Connecting to database...');
  await dataSource.initialize();

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  async function queryRows<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return (await qr.query(sql, params)) as unknown as T[];
  }

  async function queryReturningId(
    sql: string,
    params: unknown[] = [],
  ): Promise<number> {
    const rows = await queryRows<IdRow>(sql, params);
    const [firstRow] = rows;
    if (!firstRow) {
      throw new Error('Expected INSERT ... RETURNING id to return one row');
    }
    return firstRow.id;
  }

  try {
    // ── Clear tables in reverse FK order ──────────────────────────────────
    console.log('🗑️  Clearing existing seed data...');
    await qr.query(
      `TRUNCATE TABLE investment_value_updates RESTART IDENTITY CASCADE`,
    );
    await qr.query(`TRUNCATE TABLE investments RESTART IDENTITY CASCADE`);
    await qr.query(`TRUNCATE TABLE transactions RESTART IDENTITY CASCADE`);
    await qr.query(`TRUNCATE TABLE project_vendors RESTART IDENTITY CASCADE`);
    await qr.query(`TRUNCATE TABLE projects RESTART IDENTITY CASCADE`);
    await qr.query(`TRUNCATE TABLE vendors RESTART IDENTITY CASCADE`);
    await qr.query(
      `TRUNCATE TABLE transaction_categories RESTART IDENTITY CASCADE`,
    );
    await qr.query(`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);

    // ── 1. Users ──────────────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const passwordHash = await bcrypt.hash('Admin@1234', 10);

    const ownerId = await queryReturningId(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'admin@asiabuilders.com',
        passwordHash,
        'Ahmad',
        'Khan',
        '0300-1234567',
        'OWNER',
        true,
      ],
    );
    await qr.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'accounts@asiabuilders.com',
        passwordHash,
        'Fatima',
        'Zahra',
        '0321-9876543',
        'ACCOUNTANT',
        true,
      ],
    );

    // ── 2. Transaction Categories ─────────────────────────────────────────
    console.log('🏷️  Seeding transaction categories...');
    const categoryRows: Array<[string, string]> = [
      ['Land Purchase', 'EXPENSE'],
      ['Construction Materials', 'EXPENSE'],
      ['Labor & Wages', 'EXPENSE'],
      ['Equipment Rental', 'EXPENSE'],
      ['Architecture & Design', 'EXPENSE'],
      ['Legal & Registration', 'EXPENSE'],
      ['Utility Services', 'EXPENSE'],
      ['Property Sale Revenue', 'INCOME'],
      ['Advance Payment', 'INCOME'],
      ['Rental Income', 'INCOME'],
    ];

    const categoryIds: Record<string, number> = {};
    for (const [name, type] of categoryRows) {
      const categoryId = await queryReturningId(
        `INSERT INTO transaction_categories (name, category_type, is_system_defined, is_active)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, type, true, true],
      );
      categoryIds[name] = categoryId;
    }

    // ── 3. Vendors ────────────────────────────────────────────────────────
    console.log('🏗️  Seeding vendors...');

    const ahmadConstId = await queryReturningId(
      `INSERT INTO vendors (name, vendor_type, contact_person, phone, bank_name, bank_account_title, bank_account_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'Ahmad Construction Co.',
        'CONTRACTOR',
        'Ahmad Raza',
        '0300-1111111',
        'HBL',
        'Ahmad Construction Co.',
        'PK36HABB0000000013579135',
      ],
    );
    const pakSteelId = await queryReturningId(
      `INSERT INTO vendors (name, vendor_type, phone) VALUES ($1, $2, $3) RETURNING id`,
      ['Pakistan Steel Suppliers', 'SUPPLIER', '0333-2222222'],
    );
    const eliteArchId = await queryReturningId(
      `INSERT INTO vendors (name, vendor_type, contact_person, phone) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Elite Architects', 'SERVICE', 'Ar. Kamran Shah', '0321-3333333'],
    );
    await qr.query(
      `INSERT INTO vendors (name, vendor_type, phone) VALUES ($1, $2, $3)`,
      ['National Utilities Ltd', 'SERVICE', '0311-4444444'],
    );
    const malikMarbleId = await queryReturningId(
      `INSERT INTO vendors (name, vendor_type, contact_person, phone, bank_name, bank_account_title)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        'Malik Marble Works',
        'SUPPLIER',
        'Malik Imran',
        '0345-5555555',
        'MCB',
        'Malik Marble Works',
      ],
    );

    // ── 4. Projects ───────────────────────────────────────────────────────
    console.log('🏢 Seeding projects...');

    const dhaId = await queryReturningId(
      `INSERT INTO projects (name, location, start_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        'DHA Phase 8 Residential Complex',
        'DHA Phase 8, Lahore',
        '2023-03-01',
        'ACTIVE',
        ownerId,
      ],
    );
    const gulbergId = await queryReturningId(
      `INSERT INTO projects (name, location, start_date, completion_date, sale_price, sale_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        'Gulberg Commercial Tower',
        'Gulberg III, Lahore',
        '2021-06-01',
        '2023-12-31',
        85000000,
        '2024-01-15',
        'SOLD',
        ownerId,
      ],
    );
    const bahriaId = await queryReturningId(
      `INSERT INTO projects (name, location, start_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        'Bahria Town Villa Development',
        'Bahria Town, Rawalpindi',
        '2024-06-01',
        'ON_HOLD',
        ownerId,
      ],
    );

    // ── 5. ProjectVendors ─────────────────────────────────────────────────
    console.log('🔗 Seeding project vendors...');
    await qr.query(
      `INSERT INTO project_vendors (project_id, vendor_id, relationship_type, contract_amount, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [dhaId, ahmadConstId, 'AGREEMENT', 12000000, true],
    );
    await qr.query(
      `INSERT INTO project_vendors (project_id, vendor_id, relationship_type, is_active)
       VALUES ($1, $2, $3, $4)`,
      [dhaId, pakSteelId, 'AD_HOC', true],
    );
    await qr.query(
      `INSERT INTO project_vendors (project_id, vendor_id, relationship_type, contract_amount, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [gulbergId, eliteArchId, 'AGREEMENT', 4500000, true],
    );
    await qr.query(
      `INSERT INTO project_vendors (project_id, vendor_id, relationship_type, contract_amount, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [bahriaId, malikMarbleId, 'PREFERRED', 2000000, true],
    );

    // ── 6. Transactions ───────────────────────────────────────────────────
    console.log('💰 Seeding transactions...');

    type TxRow = [
      string, // transaction_type
      string, // status
      string, // transaction_date
      string, // description
      number, // amount
      string | null, // payment_method
      number, // project_id
      number | null, // vendor_id
      number | null, // category_id
      number, // created_by
    ];

    const transactions: TxRow[] = [
      // ── DHA Phase 8 ──
      [
        'EXPENSE',
        'PAID',
        '2023-03-10',
        'Land Acquisition — DHA Phase 8',
        25000000,
        'BANK_TRANSFER',
        dhaId,
        null,
        categoryIds['Land Purchase'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2023-07-15',
        'Foundation & Structural Work',
        3500000,
        'CHEQUE',
        dhaId,
        ahmadConstId,
        categoryIds['Construction Materials'],
        ownerId,
      ],
      [
        'EXPENSE',
        'DUE',
        '2024-02-01',
        'Steel & Rebar Supply',
        1800000,
        null,
        dhaId,
        pakSteelId,
        categoryIds['Construction Materials'],
        ownerId,
      ],
      [
        'EXPENSE',
        'DUE',
        '2024-06-01',
        'Phase 2 Construction — Labor',
        5000000,
        null,
        dhaId,
        ahmadConstId,
        categoryIds['Labor & Wages'],
        ownerId,
      ],
      [
        'INCOME',
        'PAID',
        '2023-04-01',
        'Client Advance Payment',
        15000000,
        'BANK_TRANSFER',
        dhaId,
        null,
        categoryIds['Advance Payment'],
        ownerId,
      ],
      [
        'INCOME',
        'DUE',
        '2024-07-01',
        'Second Progress Payment',
        8000000,
        null,
        dhaId,
        null,
        categoryIds['Advance Payment'],
        ownerId,
      ],

      // ── Gulberg Commercial Tower ──
      [
        'EXPENSE',
        'PAID',
        '2021-06-10',
        'Land Acquisition — Gulberg',
        18000000,
        'BANK_TRANSFER',
        gulbergId,
        null,
        categoryIds['Land Purchase'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2021-09-01',
        'Architectural Design Fee',
        4500000,
        'CHEQUE',
        gulbergId,
        eliteArchId,
        categoryIds['Architecture & Design'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2022-03-01',
        'Bulk Construction Materials',
        12000000,
        'BANK_TRANSFER',
        gulbergId,
        pakSteelId,
        categoryIds['Construction Materials'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2023-08-01',
        'Labor Wages — Final Phase',
        6500000,
        'CASH',
        gulbergId,
        ahmadConstId,
        categoryIds['Labor & Wages'],
        ownerId,
      ],
      [
        'INCOME',
        'PAID',
        '2024-01-15',
        'Final Sale Revenue',
        85000000,
        'BANK_TRANSFER',
        gulbergId,
        null,
        categoryIds['Property Sale Revenue'],
        ownerId,
      ],
      [
        'INCOME',
        'PAID',
        '2023-12-01',
        'Pre-Handover Rental Income',
        2400000,
        'BANK_TRANSFER',
        gulbergId,
        null,
        categoryIds['Rental Income'],
        ownerId,
      ],

      // ── Bahria Town Villa Development ──
      [
        'EXPENSE',
        'PAID',
        '2024-06-15',
        'Land Purchase — Bahria Town',
        8000000,
        'BANK_TRANSFER',
        bahriaId,
        null,
        categoryIds['Land Purchase'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2024-07-01',
        'Site Survey & Soil Testing',
        250000,
        'CASH',
        bahriaId,
        null,
        categoryIds['Architecture & Design'],
        ownerId,
      ],
      [
        'EXPENSE',
        'DUE',
        '2024-08-15',
        'Marble Flooring Installation',
        2000000,
        null,
        bahriaId,
        malikMarbleId,
        categoryIds['Construction Materials'],
        ownerId,
      ],
      [
        'EXPENSE',
        'PAID',
        '2024-07-20',
        'Design Consultancy Fee',
        1200000,
        'CHEQUE',
        bahriaId,
        eliteArchId,
        categoryIds['Architecture & Design'],
        ownerId,
      ],
      [
        'INCOME',
        'PAID',
        '2024-08-01',
        'Buyer Initial Advance',
        5000000,
        'BANK_TRANSFER',
        bahriaId,
        null,
        categoryIds['Advance Payment'],
        ownerId,
      ],
      [
        'INCOME',
        'DUE',
        '2024-09-01',
        'Second Installment',
        4000000,
        null,
        bahriaId,
        null,
        categoryIds['Advance Payment'],
        ownerId,
      ],
    ];

    for (const [
      type,
      status,
      date,
      desc,
      amount,
      method,
      projectId,
      vendorId,
      catId,
      createdBy,
    ] of transactions) {
      await qr.query(
        `INSERT INTO transactions
           (transaction_type, status, transaction_date, description, amount, currency, payment_method,
            project_id, vendor_id, category_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          type,
          status,
          date,
          desc,
          amount,
          'PKR',
          method,
          projectId,
          vendorId,
          catId,
          createdBy,
        ],
      );
    }

    // ── 7. Investments ────────────────────────────────────────────────────
    console.log('📈 Seeding investments...');

    const dhaPlotId = await queryReturningId(
      `INSERT INTO investments
         (investment_name, category, amount_invested, currency, source_type, source_project_id,
          investment_date, expected_return_percentage, expected_return_period_years,
          current_value, status, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        'DHA Plot 55 Sector C',
        'REAL_ESTATE',
        5000000,
        'PKR',
        'PROJECT_PROFIT',
        gulbergId,
        '2024-02-01',
        25,
        3,
        6200000,
        'ACTIVE',
        'Residential plot purchased using profits from Gulberg Commercial Tower. Prime location with rapid appreciation potential.',
        ownerId,
      ],
    );

    const psxPortfolioId = await queryReturningId(
      `INSERT INTO investments
         (investment_name, category, amount_invested, currency, source_type,
          investment_date, expected_return_percentage,
          current_value, status, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        'PSX Equity Portfolio',
        'STOCKS',
        2000000,
        'PKR',
        'EXTERNAL',
        '2023-09-01',
        15,
        2400000,
        'ACTIVE',
        'Diversified equity portfolio on Pakistan Stock Exchange. Mix of cement, banking, and energy sector stocks.',
        ownerId,
      ],
    );

    await qr.query(
      `INSERT INTO investments
         (investment_name, category, amount_invested, currency, source_type,
          investment_date, expected_return_period_years,
          status, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'Faisal Town Apartment Block',
        'NEW_PROJECT',
        10000000,
        'PKR',
        'EXTERNAL',
        '2025-01-15',
        4,
        'ACTIVE',
        'New residential apartment development in Faisal Town Phase 2. Expected to complete by 2029.',
        ownerId,
      ],
    );

    // ── 8. InvestmentValueUpdates ─────────────────────────────────────────
    console.log('📊 Seeding investment value updates...');

    const valueUpdates: Array<[number, string, number, string]> = [
      [
        dhaPlotId,
        '2024-06-01',
        5500000,
        'Q1 2024 market assessment — steady appreciation',
      ],
      [
        dhaPlotId,
        '2025-01-15',
        6200000,
        'Mid-year valuation — area development boost from new metro line',
      ],
      [psxPortfolioId, '2024-01-01', 2100000, 'Year-end portfolio review'],
      [
        psxPortfolioId,
        '2024-07-01',
        2400000,
        'Q2 2024 market recovery — cement and banking stocks up',
      ],
    ];

    for (const [
      investmentId,
      updateDate,
      updatedValue,
      notes,
    ] of valueUpdates) {
      await qr.query(
        `INSERT INTO investment_value_updates (investment_id, updated_value, currency, update_date, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [investmentId, updatedValue, 'PKR', updateDate, notes, ownerId],
      );
    }

    await qr.commitTransaction();
    console.log('');
    console.log('✅ Seed complete!');
    console.log('');
    console.log('  Login credentials:');
    console.log('  Owner      → admin@asiabuilders.com    / Admin@1234');
    console.log('  Accountant → accounts@asiabuilders.com / Admin@1234');
    console.log('');
    console.log('  Seeded:');
    console.log('    2 users, 10 transaction categories, 5 vendors');
    console.log('    3 projects, 4 project-vendor links');
    console.log('    18 transactions (mix of PAID/DUE, INCOME/EXPENSE)');
    console.log('    3 investments, 4 valuation updates');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
