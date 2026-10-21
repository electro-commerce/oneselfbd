import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { warrantyDuration } from "../../../utilities/warrantyDuration";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Order } from "../../orderManagement/order/order.model";
import { OrderStatusHistory } from "../../orderManagement/orderStatusHistory/orderStatusHistory.model";
import { TWarrantyInfoInput } from "./warranty.interface";
import { Warranty } from "./warranty.model";
import { findOrderWithWarrantyPipeline } from "./warranty.utils";

type WarrantyOrderItem = {
  _id: mongoose.Types.ObjectId;
  quantity: number;
  isWarrantyClaim?: boolean;
  prevWarrantyInformation?: {
    startDate: string;
    endsDate: string;
    duration: { quantity: string; unit: string };
  };
  product: {
    _id: mongoose.Types.ObjectId;
    title: string;
    warranty: boolean;
    warrantyInfo?: { duration: { quantity: string; unit: string } };
  };
  warranty?: {
    _id?: mongoose.Types.ObjectId;
    warrantyCodes?: { code: string }[];
  };
};
type WarrantyOrder = {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  status: string;
  statusHistory: mongoose.Types.ObjectId;
  products: WarrantyOrderItem[];
};

const saveWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[],
  user?: TJwtPayload
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const [order] = await Order.aggregate<WarrantyOrder>(
      findOrderWithWarrantyPipeline(order_id)
    ).session(session);
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, "No order found");

    const eligibleItems = order.products.filter(
      (item) => item.product.warranty || item.isWarrantyClaim
    );
    if (!eligibleItems.length)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This order has no warranty products"
      );
    if (warrantyInfo.length !== eligibleItems.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Provide warranty codes for every warranty product in this order"
      );
    }
    const inputs = new Map(
      warrantyInfo.map((item) => [item.itemId.toString(), item])
    );
    if (inputs.size !== warrantyInfo.length)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Duplicate order items are not allowed"
      );
    const codes = warrantyInfo.flatMap((item) =>
      item.codes.map(({ code }) => code.trim())
    );
    if (codes.some((code) => !code) || new Set(codes).size !== codes.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Warranty codes must be non-empty and unique across this order"
      );
    }
    const existingIds = eligibleItems.flatMap((item) =>
      item.warranty?._id ? [item.warranty._id] : []
    );
    const duplicate = await Warranty.findOne({
      _id: { $nin: existingIds },
      "warrantyCodes.code": { $in: codes },
    }).session(session);
    if (duplicate)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "A warranty code is already assigned to another order"
      );

    for (const item of eligibleItems) {
      const input = inputs.get(item._id.toString());
      if (!input || input.codes.length !== item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Please add ${item.quantity} warranty codes for '${item.product.title}'`
        );
      }
      const warrantyCodes = input.codes.map(({ code }) => ({
        code: code.trim(),
      }));
      if (item.warranty?._id) {
        await Warranty.updateOne(
          { _id: item.warranty._id },
          { $set: { warrantyCodes } },
          { session, runValidators: true }
        );
        continue;
      }
      const duration = item.isWarrantyClaim
        ? item.prevWarrantyInformation?.duration
        : item.product.warrantyInfo?.duration;
      if (!duration)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Set warranty duration for '${item.product.title}' first`
        );
      const dates = item.isWarrantyClaim
        ? {
            startDate: item.prevWarrantyInformation?.startDate,
            endDate: item.prevWarrantyInformation?.endsDate,
          }
        : warrantyDuration(duration);
      if (!dates.startDate || !dates.endDate)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid warranty duration or dates"
        );
      const [warranty] = await Warranty.create(
        [
          {
            order_id: order._id,
            orderId: order.orderId,
            productId: item.product._id,
            duration,
            startDate: dates.startDate,
            endsDate: dates.endDate,
            warrantyCodes,
          },
        ],
        { session }
      );
      await Order.updateOne(
        { _id: order._id, "orderedProducts._id": item._id },
        {
          $set: { "orderedProducts.$.warranty": warranty._id },
          $unset: { "orderedProducts.$.prevWarrantyInformation": 1 },
        },
        { session }
      );
    }

    // Code edits after processing must preserve the order's delivery status.
    if (user && ["processing", "warranty processing"].includes(order.status)) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { status: "warranty added" } },
        { session }
      );
      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: { history: { status: "warranty added", updatedBy: user.id } },
        },
        { session }
      );
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const WarrantyService = {
  createWarrantyIntoDB: saveWarrantyIntoDB,
  updateWarrantyIntoDB: saveWarrantyIntoDB,
};
