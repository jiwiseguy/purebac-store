import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  deleteShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Activates Shippo label-buying: links the Shippo fulfillment provider to the
 * stock location and re-points the flat-rate Standard/Expedited options onto
 * Shippo (same prices) so a label is purchased when an order is fulfilled.
 * Idempotent — safe to re-run. Requires SHIPPO_API_TOKEN to be set so the
 * provider is registered.
 */
export default async function setup_shippo_shipping({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Resolve the registered Shippo provider id (e.g. "shippo_shippo").
  const { data: providers } = await query.graph({
    entity: "fulfillment_provider",
    fields: ["id", "is_enabled"],
  })
  const shippo = (providers as any[]).find((p) => p.id.includes("shippo"))
  if (!shippo) {
    throw new Error(
      "Shippo provider not registered. Set SHIPPO_API_TOKEN and redeploy first."
    )
  }
  logger.info(`Shippo provider id: ${shippo.id}`)

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocation = locations[0]

  const { data: fsets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "service_zones.id", "service_zones.name"],
  })
  const zones = (fsets as any[]).flatMap((f) => f.service_zones ?? [])
  const usZone = zones.find((z: any) => z.name === "United States") ?? zones[0]

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = profiles[0]

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const usRegion = (regions as any[]).find((r) => r.currency_code === "usd")

  // Link Shippo provider to the stock location (safe to retry).
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: shippo.id },
    })
    logger.info("Linked Shippo provider to stock location.")
  } catch (e) {
    logger.info(`Provider link already exists: ${(e as Error).message}`)
  }

  // Existing options
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id"],
  })
  const hasShippoOptions = (options as any[]).some(
    (o) => o.provider_id === shippo.id
  )

  if (!hasShippoOptions) {
    logger.info("Creating Shippo-backed shipping options...")
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: shippo.id,
          service_zone_id: usZone.id,
          shipping_profile_id: shippingProfile.id,
          data: { id: "shippo-standard" },
          type: { label: "Standard", description: "3–5 business days.", code: "standard" },
          prices: [
            { currency_code: "usd", amount: 6.95 },
            ...(usRegion ? [{ region_id: usRegion.id, amount: 6.95 }] : []),
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
        {
          name: "Expedited Shipping",
          price_type: "flat",
          provider_id: shippo.id,
          service_zone_id: usZone.id,
          shipping_profile_id: shippingProfile.id,
          data: { id: "shippo-expedited" },
          type: { label: "Expedited", description: "1–2 business days.", code: "expedited" },
          prices: [
            { currency_code: "usd", amount: 14.95 },
            ...(usRegion ? [{ region_id: usRegion.id, amount: 14.95 }] : []),
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })

    // Remove the old manual-provider options so checkout shows one of each.
    const manualOptionIds = (options as any[])
      .filter((o) => o.provider_id !== shippo.id)
      .map((o) => o.id)
    if (manualOptionIds.length) {
      await deleteShippingOptionsWorkflow(container).run({
        input: { ids: manualOptionIds },
      })
      logger.info(`Removed ${manualOptionIds.length} manual shipping option(s).`)
    }
  } else {
    logger.info("Shippo shipping options already exist, skipping.")
  }

  logger.info("Shippo shipping setup complete.")
}
