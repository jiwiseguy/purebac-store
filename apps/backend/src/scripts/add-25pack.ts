import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { PRODUCT_METADATA_MODULE } from "../modules/product-metadata"
import ProductMetadataModuleService from "../modules/product-metadata/service"

const HANDLE = "bac-water-30ml-25pack"

export default async function add_25pack({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const metaService: ProductMetadataModuleService =
    container.resolve(PRODUCT_METADATA_MODULE)

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  if ((existing as any[]).some((p) => p.handle === HANDLE)) {
    logger.info("25-pack already exists, skipping.")
    return
  }

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  })
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })
  const category = (categories as any[]).find(
    (c) => c.name === "Bacteriostatic Water"
  )
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })

  logger.info("Creating 25-pack product...")
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "25-Pack Bundle — 30 mL Vials",
          handle: HANDLE,
          category_ids: category ? [category.id] : [],
          thumbnail: "https://purebac-storefront.vercel.app/products/bio-water.png",
          images: [{ url: "https://purebac-storefront.vercel.app/products/bio-water.png" }],
          description:
            "Twenty-five 30 mL sterile vials — the best per-vial value for high-volume or repeat use, and for resellers. Priority shipping included. Every vial individually sealed and third-party lab tested.",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: profiles[0].id,
          options: [{ title: "Size", values: ["25 × 30 mL"] }],
          variants: [
            {
              title: "25 × 30 mL",
              sku: "PUREBAC-30ML-25PK",
              options: { Size: "25 × 30 mL" },
              manage_inventory: true,
              prices: [{ amount: 350, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: salesChannels[0].id }],
        },
      ],
    },
  })

  // Inventory level
  const { data: prod } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id"],
  })
  const created = (prod as any[]).find((p) => p.handle === HANDLE)
  const variantIds = new Set((created.variants ?? []).map((v: any) => v.id))
  const { data: invLinks } = await query.graph({
    entity: "product_variant_inventory_item",
    fields: ["variant_id", "inventory_item_id"],
  })
  const itemIds = (invLinks as any[])
    .filter((l) => variantIds.has(l.variant_id))
    .map((l) => l.inventory_item_id)
  if (itemIds.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: itemIds.map((id: string) => ({
          location_id: locations[0].id,
          stocked_quantity: 1000,
          inventory_item_id: id,
        })),
      },
    })
  }

  // Spec + COA lot
  await metaService.createProductSpecs({
    product_id: created.id,
    preservative: "0.9% Benzyl Alcohol (USP)",
    ph_range: "5.0 – 7.0 (USP)",
    appearance: "Clear, colorless, particle-free",
    sterility: "USP <71> compliant — passes sterility",
    endotoxin: "Within USP limits",
    storage_temp: "20–25°C (room temperature)",
    shelf_life: "24 months sealed",
    testing_lab: "Vanguard Laboratory (independent, third-party)",
    fill_volume: "25 × 30 mL vials",
  })
  for (const v of created.variants ?? []) {
    await metaService.createProductLots({
      variant_id: v.id,
      lot_number: `PB-${HANDLE.toUpperCase().replace(/-/g, "")}-${new Date().getFullYear()}`,
      manufacture_date: new Date("2026-01-15"),
      expiry_date: new Date("2028-01-15"),
      is_active: true,
    })
  }

  logger.info("25-pack created ($350).")
}
