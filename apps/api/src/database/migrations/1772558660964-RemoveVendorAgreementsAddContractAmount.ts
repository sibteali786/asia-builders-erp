import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVendorAgreementsAddContractAmount1772558660964 implements MigrationInterface {
  name = 'RemoveVendorAgreementsAddContractAmount1772558660964';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD "contract_amount" numeric(15,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN "contract_amount"`,
    );
  }
}
