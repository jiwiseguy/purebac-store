import { Module } from "@medusajs/framework/utils"
import ProductMetadataModuleService from "./service"

export const PRODUCT_METADATA_MODULE = "productMetadata"

export default Module(PRODUCT_METADATA_MODULE, {
  service: ProductMetadataModuleService,
})
