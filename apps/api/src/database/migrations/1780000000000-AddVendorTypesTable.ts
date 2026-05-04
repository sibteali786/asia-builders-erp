import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorTypesTable1780000000000 implements MigrationInterface {
  name = 'AddVendorTypesTable1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vendor_types" (
        "id"                SERIAL        NOT NULL,
        "slug"              varchar(50)   NOT NULL,
        "label"             varchar(100)  NOT NULL,
        "is_contractor"     boolean       NOT NULL DEFAULT false,
        "is_system_defined" boolean       NOT NULL DEFAULT false,
        "is_active"         boolean       NOT NULL DEFAULT true,
        "created_at"        TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vendor_types_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_vendor_types"      PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "vendor_types" ("slug", "label", "is_contractor", "is_system_defined")
      VALUES
        ('CONTRACTOR', 'Contractor', true,  true),
        ('SUPPLIER',   'Supplier',   false, true),
        ('SERVICE',    'Service',    false, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_types"`);
  }
}
