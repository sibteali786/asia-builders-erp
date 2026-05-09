import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettlementTables1785000000000 implements MigrationInterface {
  name = 'AddSettlementTables1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "txn_ref" varchar(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS "settled_amount" decimal(15,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "settled_at" timestamp NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transaction_settlements" (
        "id"              bigserial PRIMARY KEY,
        "payment_tx_id"   bigint NOT NULL REFERENCES "transactions"("id"),
        "due_tx_id"       bigint NOT NULL REFERENCES "transactions"("id"),
        "amount_applied"  decimal(15,2) NOT NULL,
        "created_at"      timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_settlement_payment_due" UNIQUE ("payment_tx_id", "due_tx_id")
      )
    `);

    await queryRunner.query(`
      WITH numbered AS (
        SELECT
          id,
          transaction_type,
          ROW_NUMBER() OVER (PARTITION BY transaction_type ORDER BY created_at, id) AS rn
        FROM transactions
        WHERE deleted_at IS NULL
          AND txn_ref IS NULL
      )
      UPDATE transactions t
      SET txn_ref = CASE
        WHEN n.transaction_type = 'EXPENSE' THEN 'EXP-GEN-' || LPAD(n.rn::text, 4, '0')
        ELSE 'INC-' || LPAD(n.rn::text, 4, '0')
      END
      FROM numbered n
      WHERE t.id = n.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "transaction_settlements"`);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN IF EXISTS "txn_ref",
      DROP COLUMN IF EXISTS "settled_amount",
      DROP COLUMN IF EXISTS "settled_at"
    `);
  }
}
