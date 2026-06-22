import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  deleteProductsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import { PRODUCT_METADATA_MODULE } from "../modules/product-metadata"
import ProductMetadataModuleService from "../modules/product-metadata/service"

const PUREBAC_HANDLES = ["bac-water-30ml", "bac-water-30ml-10pack"]

export default async function seed_products({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve("fulfillment" as any)
  const metaService: ProductMetadataModuleService =
    container.resolve(PRODUCT_METADATA_MODULE)

  // ─── Sales channel ────────────────────────────────────────────────────────────
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  if (!salesChannels.length) throw new Error("No sales channel found.")
  const defaultSalesChannel = salesChannels[0]
  logger.info(`Using sales channel: ${defaultSalesChannel.name}`)

  // ─── US region (create if missing) ───────────────────────────────────────────
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  let usRegion: any = regions.find((r: any) => r.currency_code === "usd")
  if (!usRegion) {
    logger.info("Creating United States region...")
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_zelle_zelle"],
          },
        ],
      },
    })
    usRegion = result[0]
  }
  logger.info(`Using US region: ${usRegion.id}`)

  // ─── Tax region ───────────────────────────────────────────────────────────────
  try {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "us", provider_id: "tp_system" }],
    })
  } catch {
    logger.info("US tax region already exists, skipping.")
  }

  // ─── Stock location ───────────────────────────────────────────────────────────
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  let stockLocation: any
  if (existingLocations.length) {
    stockLocation = existingLocations[0]
  } else {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          { name: "US Fulfillment Center", address: { city: "Austin", country_code: "US", address_1: "" } },
        ],
      },
    })
    stockLocation = result[0]
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  }

  // ─── Fulfillment set & US shipping option ─────────────────────────────────────
  let { data: fulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
  })

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  let shippingProfile: any = shippingProfileResult[0]
  if (!shippingProfile) {
    logger.info("Creating default shipping profile...")
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  if (!fulfillmentSets.length) {
    logger.info("Creating US fulfillment set...")
    const created = await fulfillmentModuleService.createFulfillmentSets({
      name: "US Shipping",
      type: "shipping",
      service_zones: [
        { name: "United States", geo_zones: [{ country_code: "us", type: "country" as const }] },
      ],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: created.id },
    })
    // Re-query so we reliably get the persisted service-zone ids.
    ;({ data: fulfillmentSets } = await query.graph({
      entity: "fulfillment_set",
      fields: ["id", "name", "service_zones.id", "service_zones.name"],
    }))
  }

  const allZones = (fulfillmentSets as any[]).flatMap((fs) => fs.service_zones ?? [])
  const usZone = allZones.find((z: any) => z.name === "United States") ?? allZones[0]

  const { data: existingShippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id"],
  })
  if (usZone && !existingShippingOptions.length) {
    logger.info("Creating US shipping option...")
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: usZone.id,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Standard", description: "3–5 business days, discreet packaging.", code: "standard" },
          prices: [
            { currency_code: "usd", amount: 6.95 },
            { region_id: usRegion.id, amount: 6.95 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
  }

  // Ensure the sales channel can fulfil from the stock location (safe to retry).
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [defaultSalesChannel.id] },
    })
  } catch (e) {
    logger.info(`SC<->location link skipped: ${(e as Error).message}`)
  }

  // ─── Remove demo/starter products ─────────────────────────────────────────────
  const { data: allExisting } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const demoIds = (allExisting as any[])
    .filter((p) => !PUREBAC_HANDLES.includes(p.handle))
    .map((p) => p.id)
  if (demoIds.length) {
    logger.info(`Deleting ${demoIds.length} non-PureBac (demo) products...`)
    await deleteProductsWorkflow(container).run({ input: { ids: demoIds } })
  }

  // ─── Category ─────────────────────────────────────────────────────────────────
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })
  let category = (existingCategories as any[]).find((c) => c.name === "Reconstitution Water")
  if (!category) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name: "Reconstitution Water", is_active: true }] },
    })
    category = result[0]
  }

  // ─── Products ─────────────────────────────────────────────────────────────────
  const { data: existingPb } = await query.graph({ entity: "product", fields: ["id", "handle"] })
  const existingHandles = new Set((existingPb as any[]).map((p) => p.handle))

  const PRODUCT_IMAGE = "https://purebac-storefront.vercel.app/products/bio-water.png"

  const products = [
    {
      title: "30 mL Reconstitution Water Vial",
      handle: "bac-water-30ml",
      category_ids: [category.id],
      thumbnail: PRODUCT_IMAGE,
      images: [{ url: PRODUCT_IMAGE }],
      description:
        "Pharmaceutical-grade reconstitution water with 0.9% benzyl alcohol — used to reconstitute peptides and proteins in research and laboratory settings. Multiple-use 30 mL vial, stable for up to 28 days after opening. USP-compliant and third-party lab tested for purity and consistency.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Size", values: ["30 mL"] }],
      variants: [
        { title: "30 mL", sku: "PUREBAC-30ML", options: { Size: "30 mL" }, manage_inventory: true, prices: [{ amount: 18, currency_code: "usd" }] },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
    {
      title: "10-Pack Bundle — 30 mL Vials",
      handle: "bac-water-30ml-10pack",
      category_ids: [category.id],
      thumbnail: PRODUCT_IMAGE,
      images: [{ url: PRODUCT_IMAGE }],
      description:
        "Ten 30 mL sterile vials in bulk — the best value for high-volume or repeat use, and for resellers. Save $31 versus single vials. Priority shipping included. Every vial individually sealed and third-party lab tested.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Size", values: ["10 × 30 mL"] }],
      variants: [
        { title: "10 × 30 mL", sku: "PUREBAC-30ML-10PK", options: { Size: "10 × 30 mL" }, manage_inventory: true, prices: [{ amount: 149, currency_code: "usd" }] },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    },
  ]

  const toCreate = products.filter((p) => !existingHandles.has(p.handle))
  if (toCreate.length) {
    logger.info(`Creating ${toCreate.length} PureBac products...`)
    await createProductsWorkflow(container).run({ input: { products: toCreate } })
  } else {
    logger.info("PureBac products already exist.")
  }

  // ─── Inventory levels ─────────────────────────────────────────────────────────
  const { data: pbProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.title"],
  })
  const created = (pbProducts as any[]).filter((p) => PUREBAC_HANDLES.includes(p.handle))
  const variantIds = new Set(created.flatMap((p: any) => (p.variants ?? []).map((v: any) => v.id)))

  const { data: invLinks } = await query.graph({
    entity: "product_variant_inventory_item",
    fields: ["variant_id", "inventory_item_id"],
  })
  const itemIds = (invLinks as any[]).filter((l) => variantIds.has(l.variant_id)).map((l) => l.inventory_item_id)

  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id"],
  })
  const leveled = new Set((existingLevels as any[]).map((l) => l.inventory_item_id))
  const needLevels = itemIds.filter((id) => !leveled.has(id))
  if (needLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: needLevels.map((id: string) => ({
          location_id: stockLocation.id,
          stocked_quantity: 1000,
          inventory_item_id: id,
        })),
      },
    })
  }

  // ─── Product specs & COA lots ─────────────────────────────────────────────────
  const sharedSpec = {
    preservative: "0.9% Benzyl Alcohol (USP)",
    ph_range: "5.0 – 7.0 (USP)",
    appearance: "Clear, colorless, particle-free",
    sterility: "USP <71> compliant — passes sterility",
    endotoxin: "Within USP limits",
    total_organic_carbon: "< 500 ppb",
    total_dissolved_solids: "Within USP purified water limits",
    water_content: "USP Sterile Water for Injection grade",
    storage_temp: "20–25°C (room temperature)",
    shelf_life: "24 months sealed; 28 days after first puncture",
    testing_lab: "Vanguard Laboratory (independent, third-party)",
  }
  const fillByHandle: Record<string, string> = {
    "bac-water-30ml": "30 mL per vial",
    "bac-water-30ml-10pack": "10 × 30 mL vials",
  }

  const existingSpecs = await metaService.listProductSpecs()
  const specProductIds = new Set((existingSpecs as any[]).map((s: any) => s.product_id))

  for (const p of created) {
    if (!specProductIds.has(p.id)) {
      await metaService.createProductSpecs({
        product_id: p.id,
        ...sharedSpec,
        fill_volume: fillByHandle[p.handle],
      })
    }
    for (const v of p.variants ?? []) {
      const existingLot = await metaService.listProductLots({ variant_id: v.id })
      if (!existingLot.length) {
        await metaService.createProductLots({
          variant_id: v.id,
          lot_number: `PB-${p.handle.toUpperCase().replace(/-/g, "")}-${new Date().getFullYear()}`,
          manufacture_date: new Date("2026-01-15"),
          expiry_date: new Date("2028-01-15"),
          is_active: true,
        })
      }
    }
  }

  logger.info("PureBac seed complete.")
}
