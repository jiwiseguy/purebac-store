import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { NotificationTypes } from "@medusajs/types"
import { Resend } from "resend"

type ResendOptions = {
  api_key: string
  from: string
}

export class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private resend: Resend
  private from: string

  constructor(_deps: unknown, options: ResendOptions) {
    super()
    this.resend = new Resend(options.api_key)
    this.from = options.from
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No notification provided")
    }

    const subject = (notification.content as { subject?: string } | null | undefined)?.subject
      ?? "Your PureBac Order"
    const html = (notification.content as { html?: string } | null | undefined)?.html ?? ""

    console.log(`[resend-provider] Sending email to=${notification.to} from=${this.from} subject="${subject}"`)

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: notification.to,
      subject,
      html,
    })

    if (error) {
      console.error("[resend-provider] Resend API error:", JSON.stringify(error))
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend error: ${error.message}`
      )
    }

    console.log("[resend-provider] Email sent successfully, id:", data?.id)
    return { id: data?.id }
  }
}

export const services = [ResendNotificationService]
