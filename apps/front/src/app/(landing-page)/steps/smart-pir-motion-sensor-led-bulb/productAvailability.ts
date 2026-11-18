import { PRODUCT_TYPE, STOCK_STATUS } from "@/const/product.const";
import { TSingleProduct, TVariations } from "@/types/products/singleProduct";

export function inventoryAvailable(inventory?: TSingleProduct["inventory"]) {
  return (
    inventory?.stockStatus !== STOCK_STATUS.OUT_OF_STOCK &&
    (!inventory?.manageStock || inventory.stockAvailable > 0)
  );
}

export function firstAvailableVariation(product: TSingleProduct) {
  return (
    product.variations?.find((variation: TVariations) =>
      inventoryAvailable(variation.inventory)
    ) || null
  );
}

export function landingProductAvailable(product: TSingleProduct) {
  return (
    inventoryAvailable(product.inventory) &&
    (product.type !== PRODUCT_TYPE.VARIABLE ||
      !!firstAvailableVariation(product))
  );
}
