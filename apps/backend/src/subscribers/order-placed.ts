import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Emails the store owner full order + shipping details on every new order.
 * Recipient is ORDER_NOTIFICATION_EMAIL. No-ops unless email sending (Resend)
 * is configured, so it's safe to ship before Resend is connected.
 */
export default async function orderPlacedNotification({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const to = process.env.ORDER_NOTIFICATION_EMAIL
  if (!to || !process.env.RESEND_API_KEY) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "shipping_address.phone",
      "shipping_methods.name",
      "shipping_methods.amount",
    ],
    filters: { id: event.data.id },
  })
  const order: any = orders?.[0]
  if (!order) {
    return
  }

  const cur = String(order.currency_code || "usd").toUpperCase()
  const money = (n: any) => `$${Number(n ?? 0).toFixed(2)} ${cur}`

  const items = (order.items || [])
    .map((i: any) => `<li>${i.quantity} × ${i.title} — ${money(i.unit_price)}</li>`)
    .join("")

  const a = order.shipping_address || {}
  const ship = [
    `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim(),
    `${a.address_1 ?? ""}${a.address_2 ? ", " + a.address_2 : ""}`,
    `${a.city ?? ""}, ${a.province ?? ""} ${a.postal_code ?? ""}`,
    (a.country_code ?? "").toUpperCase(),
    a.phone ?? "",
  ]
    .filter(Boolean)
    .join("<br/>")

  const method = (order.shipping_methods || [])
    .map((m: any) => `${m.name} (${money(m.amount)})`)
    .join(", ")

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0d1f3c">
      <h2>New PureBac order #${order.display_id}</h2>
      <p><strong>Customer:</strong> ${order.email ?? "—"}</p>
      <p><strong>Order total:</strong> ${money(order.total)}</p>
      <h3>Items</h3>
      <ul>${items}</ul>
      <h3>Ship to</h3>
      <p>${ship || "—"}</p>
      <p><strong>Shipping method:</strong> ${method || "—"}</p>
    </div>
  `

  await notificationModuleService.createNotifications({
    to,
    channel: "email",
    template: "order-placed",
    content: {
      subject: `New PureBac order #${order.display_id} — ${money(order.total)}`,
      html,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
