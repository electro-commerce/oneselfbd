import mongoose, { Schema, model } from "mongoose";
import { TWarranty } from "./warranty.interface";

const WarrantySchema = new Schema<TWarranty>(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    duration: {
      quantity: {
        type: String,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
    startDate: {
      type: String,
      required: true,
    },
    endsDate: {
      type: String,
      required: true,
    },
    warrantyCodes: [
      {
        code: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

WarrantySchema.index({ "warrantyCodes.code": 1 });
WarrantySchema.index({ order_id: 1 });
WarrantySchema.index({ orderId: 1 });
WarrantySchema.index({ productId: 1 });
WarrantySchema.index({ endsDate: 1 });
WarrantySchema.index({ createdAt: -1 });

export const Warranty = model<TWarranty>("Warranty", WarrantySchema);
