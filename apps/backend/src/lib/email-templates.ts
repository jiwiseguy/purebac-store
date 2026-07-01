import { HttpTypes } from "@medusajs/types"

/**
 * Shipping confirmation email (PureBac). Self-contained — returns { subject, html }.
 */
export function shippingConfirmationEmail(
  order: HttpTypes.StoreOrder,
  tracking: { number?: string | null; url?: string | null; carrier?: string | null }
): { subject: string; html: string } {
  const subject = `Order #${order.display_id} shipped — PureBac`

  const a: any = order.shipping_address ?? {}
  const shipTo = [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.address_1,
    a.address_2,
    [a.city, a.province, a.postal_code].filter(Boolean).join(", "),
    (a.country_code ?? "").toUpperCase(),
  ]
    .filter(Boolean)
    .join("<br/>")

  const trackingBlock = tracking.number
    ? `
      <div style="margin:24px 0;padding:20px;background:#f5f9ff;border:1px solid #dce8f8;border-radius:8px">
        <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#1e6fbe;font-weight:600">Tracking</div>
        ${tracking.carrier ? `<div style="margin-top:6px;font-size:13px;color:#5a6b85">Carrier: ${tracking.carrier}</div>` : ""}
        <div style="margin-top:8px;font-family:monospace;font-size:16px;color:#0d1f3c">${tracking.number}</div>
        ${tracking.url ? `<a href="${tracking.url}" style="display:inline-block;margin-top:14px;padding:10px 18px;background:#1e6fbe;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">Track your package →</a>` : ""}
      </div>`
    : `<p style="color:#5a6b85">Your order is on its way.</p>`

  const html = `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0d1f3c">
    <div style="font-size:20px;font-weight:700;color:#0d1f3c;padding:8px 0">
      <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#1e6fbe;vertical-align:middle;margin-right:8px"></span>PureBac
    </div>
    <h1 style="font-size:24px;font-weight:600;margin:16px 0 8px">Order #${order.display_id} is on its way</h1>
    <p style="font-size:14px;color:#5a6b85;line-height:1.6;margin:0">
      Good news — your order has shipped from our fulfillment center.
    </p>
    ${trackingBlock}
    <div style="margin-top:8px">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#1e6fbe;font-weight:600;margin-bottom:6px">Shipping to</div>
      <p style="font-size:13px;color:#41506a;line-height:1.6;margin:0">${shipTo || "—"}</p>
    </div>
    <p style="margin-top:28px;font-size:11px;color:#6a8aaa;line-height:1.6">
      For laboratory and research use only. Questions? Reply to this email or contact purebackwater1@gmail.com.
    </p>
  </div>`

  return { subject, html }
}
