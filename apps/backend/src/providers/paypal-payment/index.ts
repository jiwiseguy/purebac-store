import { AbstractPaymentProvider, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/types"

type PaypalOptions = {
  client_id: string
  client_secret: string
  environment?: "sandbox" | "live"
}

const BASE = (env?: string) =>
  env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

export class PaypalPaymentProviderService extends AbstractPaymentProvider<PaypalOptions> {
  static identifier = "paypal"

  protected options_: PaypalOptions

  constructor(_deps: unknown, options: PaypalOptions) {
    super(_deps as any, options)
    this.options_ = options
  }

  private get base() {
    return BASE(this.options_.environment)
  }

  private async accessToken(): Promise<string> {
    const creds = Buffer.from(
      `${this.options_.client_id}:${this.options_.client_secret}`
    ).toString("base64")
    const res = await fetch(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `PayPal auth failed: ${res.status} ${await res.text()}`
      )
    }
    const json = (await res.json()) as { access_token: string }
    return json.access_token
  }

  private async api<T = any>(
    path: string,
    method: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.accessToken()
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `PayPal API ${method} ${path} failed: ${res.status} ${text}`
      )
    }
    return json as T
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const value = Number(input.amount).toFixed(2)
    const currency = (input.currency_code ?? "usd").toUpperCase()

    const order = await this.api<{ id: string; status: string }>(
      "/v2/checkout/orders",
      "POST",
      {
        intent: "CAPTURE",
        purchase_units: [
          { amount: { currency_code: currency, value } },
        ],
      }
    )

    return {
      id: order.id,
      data: { id: order.id, status: order.status },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const order = await this.api<{ status: string }>(
      `/v2/checkout/orders/${id}`,
      "GET"
    )

    // Already captured.
    if (order.status === "COMPLETED") {
      return {
        data: { ...(input.data ?? {}), status: "COMPLETED" },
        status: "captured",
      }
    }

    // Buyer approved in the PayPal popup → capture the funds now.
    if (order.status === "APPROVED") {
      const captured = await this.api<any>(
        `/v2/checkout/orders/${id}/capture`,
        "POST",
        {}
      )
      const captureId =
        captured?.purchase_units?.[0]?.payments?.captures?.[0]?.id
      return {
        data: {
          ...(input.data ?? {}),
          status: captured.status,
          capture_id: captureId,
        },
        status: "captured",
      }
    }

    return {
      data: { ...(input.data ?? {}), status: order.status },
      status: "pending",
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const already = (input.data?.status as string) === "COMPLETED"
    if (already) {
      return { data: input.data ?? {} }
    }
    const captured = await this.api<any>(
      `/v2/checkout/orders/${id}/capture`,
      "POST",
      {}
    )
    const captureId =
      captured?.purchase_units?.[0]?.payments?.captures?.[0]?.id
    return {
      data: {
        ...(input.data ?? {}),
        status: captured.status,
        capture_id: captureId,
      },
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const captureId = input.data?.capture_id as string | undefined
    if (!captureId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot refund a PayPal payment without a capture id."
      )
    }
    const value = Number(input.amount).toFixed(2)
    await this.api(`/v2/payments/captures/${captureId}/refund`, "POST", {
      amount: { value, currency_code: "USD" },
    })
    return { data: { ...(input.data ?? {}), refunded: true } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const id = (input.data?.id as string) ?? ""
    if (!id) return { status: "pending" }
    const order = await this.api<{ status: string }>(
      `/v2/checkout/orders/${id}`,
      "GET"
    )
    switch (order.status) {
      case "COMPLETED":
        return { status: "captured" }
      case "APPROVED":
        return { status: "authorized" }
      case "VOIDED":
        return { status: "canceled" }
      default:
        return { status: "pending" }
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}

export const services = [PaypalPaymentProviderService]
