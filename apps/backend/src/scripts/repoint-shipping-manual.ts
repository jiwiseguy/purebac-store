import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  deleteShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Re-points Standard/Expedited shipping options onto the built-in manual
 * fulfillment provider (undoing the earlier Shippo auto-fulfill wiring).
 * Labels are now bought via the "Create Label" button, not on fulfillment.
 * Idempotent.
 */
export default async function repoint_shipping_manual({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const MANUAL = "manual_manual"

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocation = locations[0]

  // Ensure manual provider is linked to the stock location.
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: MANUAL },
    })
    logger.info("Linked manual provider to stock location.")
  } catch (e) {
    logger.info(`Manual provider link already exists: ${(e as Error).message}`)
  }

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

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id"],
  })
  const manualExists = (options as any[]).some((o) => o.provider_id === MANUAL)

  if (!manualExists) {
    logger.info("Creating manual Standard + Expedited shipping options...")
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: MANUAL,
          service_zone_id: usZone.id,
          shipping_profile_id: shippingProfile.id,
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
          provider_id: MANUAL,
          service_zone_id: usZone.id,
          shipping_profile_id: shippingProfile.id,
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
  } else {
    logger.info("Manual shipping options already exist.")
  }

  // Remove any non-manual (shippo) options so checkout shows one of each.
  const stale = (options as any[])
    .filter((o) => o.provider_id !== MANUAL)
    .map((o) => o.id)
  if (stale.length) {
    await deleteShippingOptionsWorkflow(container).run({ input: { ids: stale } })
    logger.info(`Removed ${stale.length} non-manual shipping option(s).`)
  }

  logger.info("Shipping options re-pointed to manual.")
}
