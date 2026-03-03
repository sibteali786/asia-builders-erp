import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToTransactions1772558028062 implements MigrationInterface {
  name = 'AddStatusToTransactions1772558028062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "status" character varying(20) NOT NULL DEFAULT 'PAID'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "status"`);
  }
}
