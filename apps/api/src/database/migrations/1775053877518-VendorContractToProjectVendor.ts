import { MigrationInterface, QueryRunner } from 'typeorm';

export class VendorContractToProjectVendor1775053877518 implements MigrationInterface {
  name = 'VendorContractToProjectVendor1775053877518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN "contract_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_vendors" ADD "contract_amount" numeric(15,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_vendors" DROP COLUMN "contract_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD "contract_amount" numeric(15,2)`,
    );
  }
}
