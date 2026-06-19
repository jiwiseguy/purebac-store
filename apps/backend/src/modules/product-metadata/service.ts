import { MedusaService } from "@medusajs/framework/utils"
import ProductLot from "./models/product-lot"
import ProductSpec from "./models/product-spec"

class ProductMetadataModuleService extends MedusaService({
  ProductSpec,
  ProductLot,
}) {}

export default ProductMetadataModuleService
