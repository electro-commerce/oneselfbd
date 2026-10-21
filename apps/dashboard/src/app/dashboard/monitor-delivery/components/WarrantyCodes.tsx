"use client";

import { TOrders } from "@/types/order.interface";
import ProductCode from "../../processing-orders/components/ProductCode";

const WarrantyCodes = ({ order }: { order: TOrders }) => (
  <ProductCode order={order} disable={true} />
);

export default WarrantyCodes;
