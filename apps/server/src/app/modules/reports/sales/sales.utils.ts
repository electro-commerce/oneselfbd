import moment from "moment-timezone";
import { TSalesDateFilters } from "./sales.interface";

export const REPORT_TIME_ZONE = "Asia/Dhaka";
export const SALES_STATUSES = ["completed", "partial completed"];
export const orderValue = {
  $add: [{ $ifNull: ["$advance", 0] }, { $ifNull: ["$total", 0] }],
};
export const recordedPayment = { $max: [0, { $ifNull: ["$advance", 0] }] };
export const recordedRefund = {
  $cond: [{ $eq: ["$refundInfo.refunded", true] }, recordedPayment, 0],
};
export const refundLookup = [
  {
    $lookup: {
      from: "orderstatushistories",
      localField: "statusHistory",
      foreignField: "_id",
      as: "refundInfo",
    },
  },
  { $unwind: { path: "$refundInfo", preserveNullAndEmptyArrays: true } },
];

export const buildDateMatch = (filters: TSalesDateFilters) => {
  const createdAt: { $gte?: Date; $lte?: Date } = {};
  if (filters.from)
    createdAt.$gte = moment
      .tz(filters.from, "YYYY-MM-DD", true, REPORT_TIME_ZONE)
      .startOf("day")
      .toDate();
  if (filters.to)
    createdAt.$lte = moment
      .tz(filters.to, "YYYY-MM-DD", true, REPORT_TIME_ZONE)
      .endOf("day")
      .toDate();
  return Object.keys(createdAt).length ? { createdAt } : {};
};
