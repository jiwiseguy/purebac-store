import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
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

export class ZellePaymentProviderService extends AbstractPaymentProvider {
  static identifier = "zelle"

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return { id: `zelle_${randomUUID()}`, data: { zelle_status: "awaiting_payment" } }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return { data: input.data ?? {}, status: "authorized" }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        zelle_status: "captured",
        captured_at: new Date().toISOString(),
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: { ...(input.data ?? {}), zelle_status: "canceled" } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const d = (input.data ?? {}) as Record<string, unknown>
    if (d.zelle_status === "captured") return { status: "captured" }
    if (d.zelle_status === "canceled") return { status: "canceled" }
    return { status: "authorized" }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: { ...(input.data ?? {}), zelle_status: "refunded" } }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}

// Named export required by Medusa's moduleProviderLoader
export const services = [ZellePaymentProviderService]
