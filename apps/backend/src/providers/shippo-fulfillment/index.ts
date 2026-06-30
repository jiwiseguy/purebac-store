import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"

type ShippoFromAddress = {
  name?: string
  company?: string
  street1?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
}

type ShippoParcel = {
  length: string
  width: string
  height: string
  distance_unit: string
  weight: string
  mass_unit: string
}

type ShippoOptions = {
  api_token: string
  from_address: ShippoFromAddress
  default_parcel?: ShippoParcel
}

const SHIPPO_BASE = "https://api.goshippo.com"

const DEFAULT_PARCEL: ShippoParcel = {
  length: "6",
  width: "4",
  height: "4",
  distance_unit: "in",
  weight: "8",
  mass_unit: "oz",
}

export class ShippoFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "shippo"

  protected options_: ShippoOptions

  constructor(_deps: unknown, options: ShippoOptions) {
    super()
    this.options_ = options
  }

  private async api<T = any>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${SHIPPO_BASE}${path}`, {
      method,
      headers: {
        Authorization: `ShippoToken ${this.options_.api_token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shippo ${method} ${path} failed: ${res.status} ${text}`
      )
    }
    return json as T
  }

  // Shipping options this provider exposes when an admin creates a shipping option.
  async getFulfillmentOptions(): Promise<any[]> {
    return [
      { id: "shippo-standard", name: "Standard (Shippo label)" },
      { id: "shippo-expedited", name: "Expedited (Shippo label)" },
    ]
  }

  async validateFulfillmentData(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: Record<string, unknown>
  ): Promise<any> {
    return data ?? {}
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  // Rates are flat (defined in Medusa); Shippo only buys the label on fulfillment.
  async canCalculate(_data: any): Promise<boolean> {
    return false
  }

  async createFulfillment(
    data: Record<string, unknown>,
    _items: any[],
    order: any,
    _fulfillment: any
  ): Promise<any> {
    const to = order?.shipping_address
    if (!to) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot buy a Shippo label: order has no shipping address."
      )
    }

    const from = this.options_.from_address ?? {}
    const parcel = this.options_.default_parcel ?? DEFAULT_PARCEL

    const shipment = await this.api<any>("/shipments", "POST", {
      address_from: {
        name: from.name,
        company: from.company,
        street1: from.street1,
        city: from.city,
        state: from.state,
        zip: from.zip,
        country: from.country || "US",
        phone: from.phone,
        email: from.email,
      },
      address_to: {
        name: `${to.first_name ?? ""} ${to.last_name ?? ""}`.trim() || "Customer",
        company: to.company ?? "",
        street1: to.address_1,
        street2: to.address_2 ?? "",
        city: to.city,
        state: to.province,
        zip: to.postal_code,
        country: (to.country_code || "us").toUpperCase(),
        phone: to.phone ?? "",
        email: order?.email ?? "",
      },
      parcels: [parcel],
      async: false,
    })

    const rates: any[] = (shipment.rates ?? []).filter((r: any) => r?.amount)
    if (!rates.length) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Shippo returned no rates for this shipment."
      )
    }

    // "Expedited" option -> fastest; otherwise -> cheapest.
    const optionId = String((data as any)?.id ?? "")
    const chosen = optionId.includes("expedited")
      ? [...rates].sort(
          (a, b) => (a.estimated_days ?? 99) - (b.estimated_days ?? 99)
        )[0]
      : [...rates].sort(
          (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
        )[0]

    const tx = await this.api<any>("/transactions", "POST", {
      rate: chosen.object_id,
      label_file_type: "PDF",
      async: false,
    })

    if (tx.status !== "SUCCESS") {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shippo label purchase failed: ${JSON.stringify(tx.messages ?? tx.status)}`
      )
    }

    return {
      data: {
        ...(data ?? {}),
        shippo_transaction_id: tx.object_id,
        shippo_shipment_id: shipment.object_id,
        shippo_rate_id: chosen.object_id,
        carrier: chosen.provider,
        service: chosen.servicelevel?.name,
      },
      labels: [
        {
          tracking_number: tx.tracking_number,
          tracking_url: tx.tracking_url_provider,
          label_url: tx.label_url,
        },
      ],
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    const txId = (data as any)?.shippo_transaction_id
    if (txId) {
      try {
        await this.api("/refunds", "POST", { transaction: txId, async: false })
      } catch {
        // Refunds only succeed for unused labels; ignore otherwise.
      }
    }
    return { data: { ...(data ?? {}), canceled: true } }
  }

  async createReturnFulfillment(_fulfillment: any): Promise<any> {
    return { data: {}, labels: [] }
  }

  async getFulfillmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getShipmentDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async retrieveDocuments(
    _fulfillmentData: Record<string, unknown>,
    _documentType: string
  ): Promise<void> {
    return
  }
}

export const services = [ShippoFulfillmentProviderService]
