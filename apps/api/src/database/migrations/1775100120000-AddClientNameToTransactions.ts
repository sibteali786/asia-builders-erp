import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientNameToTransactions1775100120000 implements MigrationInterface {
  name = 'AddClientNameToTransactions1775100120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "client_name" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN IF EXISTS "client_name"
    `);
  }
}
