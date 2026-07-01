import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const EMAIL = "admin@purebac.com"
const NEW_PASSWORD = "PureBac2026!"

export default async function resetAdminPassword({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const authModuleService = container.resolve(Modules.AUTH)

  // Try to update an existing emailpass identity.
  const result = await authModuleService.updateProvider("emailpass", {
    entity_id: EMAIL,
    password: NEW_PASSWORD,
  })

  if (!result.success) {
    throw new Error(`Failed to reset password: ${JSON.stringify(result.error)}`)
  }

  logger.info(`Password reset successfully for ${EMAIL} -> ${NEW_PASSWORD}`)
}
