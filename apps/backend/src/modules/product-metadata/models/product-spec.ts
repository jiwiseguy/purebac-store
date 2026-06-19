import { model } from "@medusajs/framework/utils"

const ProductSpec = model.define("product_spec", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  preservative: model.text().nullable(),
  ph_range: model.text().nullable(),
  appearance: model.text().nullable(),
  sterility: model.text().nullable(),
  endotoxin: model.text().nullable(),
  total_organic_carbon: model.text().nullable(),
  total_dissolved_solids: model.text().nullable(),
  water_content: model.text().nullable(),
  fill_volume: model.text().nullable(),
  storage_temp: model.text().nullable(),
  shelf_life: model.text().nullable(),
  testing_lab: model.text().nullable(),
})

export default ProductSpec
