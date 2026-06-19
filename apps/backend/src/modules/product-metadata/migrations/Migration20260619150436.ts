import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260619150436 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_lot" ("id" text not null, "variant_id" text not null, "lot_number" text not null, "manufacture_date" timestamptz null, "expiry_date" timestamptz null, "coa_url" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_lot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_lot_deleted_at" ON "product_lot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_spec" ("id" text not null, "product_id" text not null, "preservative" text null, "ph_range" text null, "appearance" text null, "sterility" text null, "endotoxin" text null, "total_organic_carbon" text null, "total_dissolved_solids" text null, "water_content" text null, "fill_volume" text null, "storage_temp" text null, "shelf_life" text null, "testing_lab" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_spec_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_spec_deleted_at" ON "product_spec" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_lot" cascade;`);

    this.addSql(`drop table if exists "product_spec" cascade;`);
  }

}
