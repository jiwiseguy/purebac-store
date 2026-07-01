import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/types"
import { useEffect, useState } from "react"
import { Container, Heading, Text, Button, toast, Badge } from "@medusajs/ui"

type AdminOrder = { id: string }

type Label = {
  label_url: string
  tracking_number: string | null
  tracking_url: string | null
  service: string | null
  amount: string | null
  test_mode?: boolean
}

const OrderShippoLabelWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [label, setLabel] = useState<Label | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)

  async function load() {
    try {
      const r = await fetch(`/admin/orders/${data.id}/shippo-label`, {
        credentials: "include",
      })
      const j = await r.json()
      setLabel(j.label ?? null)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [data.id])

  async function buy() {
    setBuying(true)
    try {
      const r = await fetch(`/admin/orders/${data.id}/shippo-label`, {
        method: "POST",
        credentials: "include",
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message ?? "Failed to create label")
      setLabel(j.label)
      toast.success(
        `Label created — ${j.label.service ?? "USPS"}${
          j.label.amount ? ` ($${j.label.amount})` : ""
        }`
      )
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create label")
    } finally {
      setBuying(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Shipping Label</Heading>
        {label?.test_mode && <Badge color="orange">Test mode</Badge>}
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <Text size="small" className="text-ui-fg-muted">
            Loading…
          </Text>
        ) : label ? (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-2">
              <Badge color="green">Created</Badge>
              {label.service && (
                <Text size="small" className="text-ui-fg-subtle">
                  {label.service}
                  {label.amount ? ` · $${label.amount}` : ""}
                </Text>
              )}
            </div>
            <Text size="small">
              Tracking:{" "}
              <span className="font-mono text-ui-fg-base">
                {label.tracking_number ?? "—"}
              </span>
            </Text>
            <div className="flex gap-x-2">
              <a href={label.label_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="small">
                  Print Label (PDF)
                </Button>
              </a>
              <Button
                variant="secondary"
                size="small"
                isLoading={buying}
                onClick={buy}
              >
                Create Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-3">
            <Text size="small" className="text-ui-fg-subtle">
              Buy the cheapest USPS label for this order&apos;s shipping address.
              Tracking is saved to the order and the customer is emailed
              automatically.
            </Text>
            <Button
              variant="primary"
              size="small"
              isLoading={buying}
              onClick={buy}
              className="w-fit"
            >
              Create Label
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderShippoLabelWidget
