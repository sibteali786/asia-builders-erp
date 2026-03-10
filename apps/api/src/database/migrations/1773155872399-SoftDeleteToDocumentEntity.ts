import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteToDocumentEntity1773155872399 implements MigrationInterface {
  name = 'SoftDeleteToDocumentEntity1773155872399';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "created_at"`);
  }
}
