import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionDateIndex1745500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_date"
       ON "transactions" ("transaction_date")
       WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_date"`);
  }
}
