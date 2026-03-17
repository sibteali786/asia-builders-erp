import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773758732915 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_vendors" ("id" BIGSERIAL NOT NULL, "relationship_type" character varying(50) NOT NULL DEFAULT 'GENERAL', "is_active" boolean NOT NULL DEFAULT true, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "project_id" bigint, "vendor_id" bigint, CONSTRAINT "PK_d64ff0e6a3085e044842f5ddeb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "avatar_url" character varying(255), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone" character varying(20), "role" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "investment_value_updates" ("id" BIGSERIAL NOT NULL, "updated_value" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'PKR', "update_date" date NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "investment_id" bigint, "created_by" bigint, CONSTRAINT "PK_78570f50d2598c97f344c68f46c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "investments" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "investment_name" character varying(255) NOT NULL, "category" character varying(100) NOT NULL, "amount_invested" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'PKR', "source_type" character varying(50) NOT NULL, "source_details" text, "investment_date" date NOT NULL, "expected_return_percentage" numeric(5,2), "expected_return_period_years" integer, "current_value" numeric(15,2), "maturity_date" date, "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "description" text, "notes" text, "source_project_id" bigint, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_a1263853f1a4fb8b849c1c9aff4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(255) NOT NULL, "location" character varying(500) NOT NULL, "start_date" date NOT NULL, "completion_date" date, "sale_price" numeric(15,2), "sale_date" date, "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "notes" text, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transaction_categories" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "category_type" character varying(20) NOT NULL, "is_system_defined" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_by" bigint, CONSTRAINT "UQ_3f17bf489cd3ae4641ab3e27a9f" UNIQUE ("name"), CONSTRAINT "PK_bbd38b9174546b0ed4fe04689c7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "transaction_type" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PAID', "transaction_date" date NOT NULL, "description" character varying(500) NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'PKR', "payment_method" character varying(50), "cheque_number" character varying(100), "physical_file_reference" character varying(100), "notes" text, "project_id" bigint, "vendor_id" bigint, "category_id" bigint, "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vendors" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(255) NOT NULL, "vendor_type" character varying(50) NOT NULL, "contract_amount" numeric(15,2), "contact_person" character varying(255), "phone" character varying(20) NOT NULL, "cnic" character varying(15), "address" text, "bank_name" character varying(255), "bank_account_title" character varying(255), "bank_account_number" character varying(50), "bank_iban" character varying(50), "notes" text, CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "file_name" character varying(500) NOT NULL, "file_path" character varying(1000) NOT NULL, "file_size" bigint NOT NULL, "file_type" character varying(100) NOT NULL, "mime_type" character varying(100) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" bigint NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "uploaded_by" bigint, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_vendors" ADD CONSTRAINT "FK_50dc8a7f522360635a7e0431abc" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_vendors" ADD CONSTRAINT "FK_cbdf96951f79f2406d2d8973503" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_value_updates" ADD CONSTRAINT "FK_1fefc1087f3ffab34049fd59cfa" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_value_updates" ADD CONSTRAINT "FK_84747f2a3fc615e5820f468ded8" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_44c495162aeed14e9741283491c" FOREIGN KEY ("source_project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_a4735bb266f8d162c8ef71a51cd" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_d3c0e7b824a3c7a1128ad5d1cc0" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_458ce18ebdb792c80257bc96678" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" ADD CONSTRAINT "FK_6c28b5f10e3003683bd37eed0dc" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_9a04e1feb675f37ea6a344f809e" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_5fb1addc4312f215acef39a3620" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" FOREIGN KEY ("category_id") REFERENCES "transaction_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_77e84561125adeccf287547f66e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_d257215801b8676e1859a51884b" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_d257215801b8676e1859a51884b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_77e84561125adeccf287547f66e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_5fb1addc4312f215acef39a3620"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_9a04e1feb675f37ea6a344f809e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_categories" DROP CONSTRAINT "FK_6c28b5f10e3003683bd37eed0dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_458ce18ebdb792c80257bc96678"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_d3c0e7b824a3c7a1128ad5d1cc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_a4735bb266f8d162c8ef71a51cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_44c495162aeed14e9741283491c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_value_updates" DROP CONSTRAINT "FK_84747f2a3fc615e5820f468ded8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_value_updates" DROP CONSTRAINT "FK_1fefc1087f3ffab34049fd59cfa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_vendors" DROP CONSTRAINT "FK_cbdf96951f79f2406d2d8973503"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_vendors" DROP CONSTRAINT "FK_50dc8a7f522360635a7e0431abc"`,
    );
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "vendors"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "transaction_categories"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "investments"`);
    await queryRunner.query(`DROP TABLE "investment_value_updates"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "project_vendors"`);
  }
}
