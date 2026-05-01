import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceivedTransactionStatus1775100060000 implements MigrationInterface {
  name = 'AddReceivedTransactionStatus1775100060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "transactions"
      SET "status" = 'RECEIVED'
      WHERE "transaction_type" = 'INCOME'
        AND "status" = 'PAID'
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "transactions"
      SET "status" = 'PAID'
      WHERE "transaction_type" = 'INCOME'
        AND "status" = 'RECEIVED'
        AND "deleted_at" IS NULL
    `);
  }
}
