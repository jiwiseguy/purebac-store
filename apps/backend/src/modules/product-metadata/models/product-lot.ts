import { model } from "@medusajs/framework/utils"

const ProductLot = model.define("product_lot", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  lot_number: model.text(),
  manufacture_date: model.dateTime().nullable(),
  expiry_date: model.dateTime().nullable(),
  coa_url: model.text().nullable(),
  is_active: model.boolean().default(true),
})

export default ProductLot
