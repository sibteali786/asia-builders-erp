import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToTransactionCategories1772220613689 implements MigrationInterface {
  name = 'AddSoftDeleteToTransactionCategories1772220613689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" DROP COLUMN "updated_at"`,
    );
  }
}
