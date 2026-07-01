/**
 * Minimal Shippo API client (no SDK dependency).
 * Buys the cheapest USPS label for a destination address.
 *
 * Config via env:
 *   SHIPPO_API_KEY        - Shippo token (shippo_test_… or shippo_live_…)
 *   SHIP_FROM_NAME/COMPANY/STREET1/STREET2/CITY/STATE/ZIP/COUNTRY/PHONE/EMAIL
 *   PARCEL_LENGTH/WIDTH/HEIGHT (inches), PARCEL_WEIGHT_OZ (ounces)
 */

const SHIPPO_BASE = "https://api.goshippo.com"

export type ShippoAddress = {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export type BoughtLabel = {
  tracking_number: string
  tracking_url: string | null
  label_url: string
  carrier: string
  service: string
  amount: string
  currency: string
}

function token(): string {
  const t = process.env.SHIPPO_API_KEY
  if (!t) throw new Error("SHIPPO_API_KEY is not set")
  return t
}

export function isTestMode(): boolean {
  return (process.env.SHIPPO_API_KEY ?? "").startsWith("shippo_test")
}

async function shippoPost(path: string, body: unknown): Promise<any> {
  const res = await fetch(SHIPPO_BASE + path, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `Shippo ${path} failed (${res.status}): ${JSON.stringify(json).slice(0, 300)}`
    )
  }
  return json
}

export function fromAddress(): ShippoAddress {
  const e = process.env
  const addr: ShippoAddress = {
    name: e.SHIP_FROM_NAME ?? "",
    company: e.SHIP_FROM_COMPANY,
    street1: e.SHIP_FROM_STREET1 ?? "",
    street2: e.SHIP_FROM_STREET2,
    city: e.SHIP_FROM_CITY ?? "",
    state: e.SHIP_FROM_STATE ?? "",
    zip: e.SHIP_FROM_ZIP ?? "",
    country: e.SHIP_FROM_COUNTRY ?? "US",
    // USPS requires both a sender phone and email — keep them non-empty.
    phone: e.SHIP_FROM_PHONE,
    email: e.SHIP_FROM_EMAIL ?? e.ADMIN_EMAIL ?? "orders@purebac.com",
  }
  if (!addr.name || !addr.street1 || !addr.city || !addr.state || !addr.zip) {
    throw new Error(
      "Ship-from address is not configured. Set SHIP_FROM_NAME/STREET1/CITY/STATE/ZIP."
    )
  }
  if (!addr.phone) {
    throw new Error(
      "Ship-from phone is required by USPS. Set SHIP_FROM_PHONE."
    )
  }
  return addr
}

export function defaultParcel() {
  const e = process.env
  return {
    length: e.PARCEL_LENGTH ?? "6",
    width: e.PARCEL_WIDTH ?? "4",
    height: e.PARCEL_HEIGHT ?? "2",
    distance_unit: "in",
    weight: e.PARCEL_WEIGHT_OZ ?? "8",
    mass_unit: "oz",
  }
}

/**
 * Creates a shipment, picks the cheapest USPS rate, and buys the label.
 * Set SHIPPO_SERVICELEVEL (e.g. "usps_priority") to force a service instead.
 */
export async function buyCheapestUspsLabel(
  addressTo: ShippoAddress,
  parcel: Record<string, string> = defaultParcel()
): Promise<BoughtLabel> {
  const shipment = await shippoPost("/shipments/", {
    address_from: fromAddress(),
    address_to: addressTo,
    parcels: [parcel],
    async: false,
  })

  let rates: any[] = (shipment.rates ?? []).filter(
    (r: any) => r.provider === "USPS"
  )

  const forced = process.env.SHIPPO_SERVICELEVEL
  if (forced) {
    const match = rates.filter((r) => r.servicelevel?.token === forced)
    if (match.length) rates = match
  }

  if (!rates.length) {
    throw new Error(
      "No USPS rates were returned for this address — check the destination address."
    )
  }

  rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
  const chosen = rates[0]

  const txn = await shippoPost("/transactions/", {
    rate: chosen.object_id,
    label_file_type: "PDF",
    async: false,
  })

  if (txn.status !== "SUCCESS" || !txn.label_url) {
    throw new Error(
      `Label purchase failed: ${JSON.stringify(txn.messages ?? txn.status).slice(0, 300)}`
    )
  }

  return {
    tracking_number: txn.tracking_number,
    tracking_url:
      txn.tracking_url_provider ??
      (txn.tracking_number
        ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${txn.tracking_number}`
        : null),
    label_url: txn.label_url,
    carrier: "USPS",
    service: chosen.servicelevel?.name ?? "USPS",
    amount: chosen.amount,
    currency: chosen.currency ?? "USD",
  }
}
