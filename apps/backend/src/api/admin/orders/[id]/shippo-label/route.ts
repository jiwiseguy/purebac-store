import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { INotificationModuleService, HttpTypes } from "@medusajs/types"
import {
  buyCheapestUspsLabel,
  isTestMode,
  ShippoAddress,
} from "../../../../../lib/shippo"
import { shippingConfirmationEmail } from "../../../../../lib/email-templates"

async function getOrder(req: MedusaRequest, id: string): Promise<any | null> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "metadata",
      "items.*",
      "items.variant.*",
      "shipping_address.*",
    ],
  })
  return data[0] ?? null
}

// Returns the already-purchased label for this order, if any.
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const order = await getOrder(req, req.params.id)
  if (!order) {
    res.status(404).json({ message: "Order not found" })
    return
  }
  const m = (order.metadata ?? {}) as Record<string, any>
  res.json({
    label: m.shippo_label_url
      ? {
          label_url: m.shippo_label_url,
          tracking_number: m.shippo_tracking_number ?? null,
          tracking_url: m.shippo_tracking_url ?? null,
          service: m.shippo_service ?? null,
          amount: m.shippo_amount ?? null,
          test_mode: m.shippo_test_mode ?? false,
        }
      : null,
  })
}

// Buys the cheapest USPS label, saves it on the order, and emails tracking.
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const id = req.params.id
  const order = await getOrder(req, id)
  if (!order) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  const a = order.shipping_address
  if (!a || !a.address_1 || !a.city || !a.province || !a.postal_code) {
    res
      .status(400)
      .json({ message: "Order is missing a complete shipping address." })
    return
  }

  const addressTo: ShippoAddress = {
    name:
      [a.first_name, a.last_name].filter(Boolean).join(" ") ||
      order.email ||
      "Customer",
    company: a.company ?? undefined,
    street1: a.address_1,
    street2: a.address_2 ?? undefined,
    city: a.city,
    state: a.province,
    zip: a.postal_code,
    country: (a.country_code ?? "US").toUpperCase(),
    phone: a.phone ?? undefined,
    email: order.email ?? undefined,
  }

  let label
  try {
    label = await buyCheapestUspsLabel(addressTo)
  } catch (e: any) {
    res.status(502).json({ message: e?.message ?? "Failed to buy label" })
    return
  }

  // Persist label info on the order (merge into existing metadata).
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const merged = {
    ...((order.metadata as Record<string, unknown>) ?? {}),
    shippo_label_url: label.label_url,
    shippo_tracking_number: label.tracking_number,
    shippo_tracking_url: label.tracking_url,
    shippo_service: label.service,
    shippo_amount: label.amount,
    shippo_test_mode: isTestMode(),
    shippo_purchased_at: new Date().toISOString(),
  }
  await knex("order").where({ id }).update({ metadata: JSON.stringify(merged) })

  // Email the tracking number. In TEST mode, send to the admin instead of the
  // real customer so the flow can be verified without notifying buyers.
  try {
    const notif = req.scope.resolve(
      Modules.NOTIFICATION
    ) as INotificationModuleService
    const recipient = isTestMode()
      ? process.env.ORDER_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? order.email
      : order.email
    if (recipient) {
      const { subject, html } = shippingConfirmationEmail(
        order as HttpTypes.StoreOrder,
        {
          number: label.tracking_number,
          url: label.tracking_url,
          carrier: label.carrier,
        }
      )
      await notif.createNotifications({
        to: recipient,
        channel: "email",
        template: "shipment-confirmation",
        data: { order_id: order.id },
        content: { subject, html } as Record<string, unknown>,
      })
    }
  } catch (e) {
    console.error("[shippo-label] tracking email failed:", e)
    // Label is already bought — don't fail the request over the email.
  }

  res.json({
    label: {
      label_url: label.label_url,
      tracking_number: label.tracking_number,
      tracking_url: label.tracking_url,
      service: label.service,
      amount: label.amount,
      test_mode: isTestMode(),
    },
  })
}
