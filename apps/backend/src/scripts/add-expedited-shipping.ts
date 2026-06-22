import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function add_expedited_shipping({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })
  if ((existing as any[]).some((o) => o.name === "Expedited Shipping")) {
    logger.info("Expedited Shipping already exists, skipping.")
    return
  }

  const { data: fsets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "service_zones.id", "service_zones.name"],
  })
  const zones = (fsets as any[]).flatMap((f) => f.service_zones ?? [])
  const usZone = zones.find((z: any) => z.name === "United States") ?? zones[0]
  if (!usZone) throw new Error("No service zone found.")

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

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Expedited Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: usZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Expedited",
          description: "1–2 business days.",
          code: "expedited",
        },
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

  logger.info("Expedited Shipping ($14.95) created.")
}
