import { PipelineStage, Types } from "mongoose";
import {
  buildDateMatch,
  SALES_STATUSES,
  orderValue,
  recordedPayment,
  recordedRefund,
  refundLookup,
} from "./sales.utils";
import { Order } from "../../orderManagement/order/order.model";
import {
  TCategoryReport,
  TPaymentReport,
  TProductReport,
  TSalesByCategoryQuery,
  TSalesByProductQuery,
  TSalesDateFilters,
  TSalesOrdersQuery,
  TSalesPaymentsQuery,
  TSalesReportOrder,
  TSalesSummary,
} from "./sales.interface";

const getSalesSummaryFromDB = async (
  filters: TSalesDateFilters
): Promise<TSalesSummary> => {
  const dateMatch = buildDateMatch(filters);

  const [salesResult, refundResult] = await Promise.all([
    Order.aggregate<{
      total_orders: number;
      gross_sales: number;
      discount_total: number;
      net_sales: number;
      paid_amount: number;
      due_amount: number;
    }>([
      {
        $match: {
          ...dateMatch,
          status: { $in: SALES_STATUSES },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          gross_sales: {
            $sum: {
              $add: [
                { $ifNull: ["$advance", 0] },
                { $ifNull: ["$total", 0] },
                { $ifNull: ["$discount", 0] },
                { $ifNull: ["$couponDiscount", 0] },
              ],
            },
          },
          discount_total: {
            $sum: {
              $add: [
                { $ifNull: ["$discount", 0] },
                { $ifNull: ["$couponDiscount", 0] },
              ],
            },
          },
          net_sales: { $sum: orderValue },
          paid_amount: { $sum: recordedPayment },
          due_amount: { $sum: { $ifNull: ["$total", 0] } },
        },
      },
    ]),
    Order.aggregate<{ refund_amount: number }>([
      {
        $match: {
          ...dateMatch,
          status: { $ne: "deleted" },
          isDeleted: { $ne: true },
        },
      },
      ...refundLookup,
      { $group: { _id: null, refund_amount: { $sum: recordedRefund } } },
    ]),
  ]);

  const sales = salesResult[0];

  return {
    total_orders: sales?.total_orders ?? 0,
    gross_sales: sales?.gross_sales ?? 0,
    discount_total: sales?.discount_total ?? 0,
    net_sales: sales?.net_sales ?? 0,
    paid_amount: sales?.paid_amount ?? 0,
    due_amount: sales?.due_amount ?? 0,
    refund_amount: refundResult[0]?.refund_amount ?? 0,
  };
};

const getSalesOrdersFromDB = async (query: TSalesOrdersQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;
  const dateMatch = buildDateMatch(query);

  const match: Record<string, unknown> = {
    ...dateMatch,
    status: { $in: SALES_STATUSES },
    isDeleted: { $ne: true },
  };

  if (query.order_status) {
    match.status = query.order_status;
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "shippings",
              localField: "shipping",
              foreignField: "_id",
              as: "shippingInfo",
            },
          },
          {
            $unwind: {
              path: "$shippingInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              order_id: { $toString: "$_id" },
              created_at: "$createdAt",
              order_status: "$status",
              order_source: { $ifNull: ["$orderSource.name", null] },
              invoice_id: "$orderId",
              invoice_no: "$orderId",
              grand_total: orderValue,
              paid_total: { $ifNull: ["$advance", 0] },
              due_total: { $ifNull: ["$total", 0] },
              payment_status: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $lte: [{ $ifNull: ["$total", 0] }, 0],
                      },
                      then: "paid",
                    },
                    {
                      case: {
                        $gt: [{ $ifNull: ["$advance", 0] }, 0],
                      },
                      then: "partial",
                    },
                  ],
                  default: "unpaid",
                },
              },
              customer_name: { $ifNull: ["$shippingInfo.fullName", null] },
              customer_phone: {
                $ifNull: ["$shippingInfo.phoneNumber", null],
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await Order.aggregate<{
    data: TSalesReportOrder[];
    totalCount: { count: number }[];
  }>(pipeline);

  const data = result[0]?.data ?? [];
  const total = result[0]?.totalCount[0]?.count ?? 0;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getSalesByProductFromDB = async (
  filters: TSalesByProductQuery
): Promise<TProductReport[]> => {
  const dateMatch = buildDateMatch(filters);
  const match: Record<string, unknown> = {
    ...dateMatch,
    status: { $in: SALES_STATUSES },
    isDeleted: { $ne: true },
  };

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $unwind: "$orderedProducts" },
    {
      $match: {
        "orderedProducts.isWarrantyClaim": { $ne: true },
      },
    },
  ];

  if (filters.product_id && Types.ObjectId.isValid(filters.product_id)) {
    pipeline.push({
      $match: {
        "orderedProducts.product": new Types.ObjectId(filters.product_id),
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$orderedProducts.product",
        quantity_sold: { $sum: "$orderedProducts.quantity" },
        total_sales: { $sum: "$orderedProducts.total" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $set: {
        reportCategory: {
          $ifNull: [{ $arrayElemAt: ["$product.category", 0] }, null],
        },
      },
    }
  );

  if (filters.category_id && Types.ObjectId.isValid(filters.category_id)) {
    pipeline.push({
      $match: {
        reportCategory: new Types.ObjectId(filters.category_id),
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "inventories",
        localField: "product.inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: {
        path: "$inventory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        product_id: { $toString: "$_id" },
        product_name: { $ifNull: ["$product.title", "Deleted product"] },
        sku: { $ifNull: ["$inventory.sku", null] },
        quantity_sold: 1,
        total_sales: 1,
      },
    },
    { $sort: { total_sales: -1 } }
  );

  return Order.aggregate<TProductReport>(pipeline);
};

const getSalesByCategoryFromDB = async (
  filters: TSalesByCategoryQuery
): Promise<TCategoryReport[]> => {
  const dateMatch = buildDateMatch(filters);
  const match: Record<string, unknown> = {
    ...dateMatch,
    status: { $in: SALES_STATUSES },
    isDeleted: { $ne: true },
  };

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $unwind: "$orderedProducts" },
    {
      $match: {
        "orderedProducts.isWarrantyClaim": { $ne: true },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "orderedProducts.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $set: {
        reportCategory: {
          $ifNull: [{ $arrayElemAt: ["$product.category", 0] }, null],
        },
      },
    },
  ];

  if (filters.category_id && Types.ObjectId.isValid(filters.category_id)) {
    pipeline.push({
      $match: {
        reportCategory: new Types.ObjectId(filters.category_id),
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$reportCategory",
        quantity_sold: { $sum: "$orderedProducts.quantity" },
        total_sales: { $sum: "$orderedProducts.total" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        category_id: { $ifNull: [{ $toString: "$_id" }, "uncategorized"] },
        category_name: {
          $ifNull: ["$category.name", "Uncategorized / deleted category"],
        },
        quantity_sold: 1,
        total_sales: 1,
      },
    },
    { $sort: { total_sales: -1 } }
  );

  return Order.aggregate<TCategoryReport>(pipeline);
};

const getSalesByPaymentsFromDB = async (
  filters: TSalesPaymentsQuery
): Promise<TPaymentReport[]> => {
  const dateMatch = buildDateMatch(filters);
  const match: Record<string, unknown> = {
    ...dateMatch,
    status: { $nin: ["deleted"] },
    isDeleted: { $ne: true },
  };

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: "orderpayments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentInfo",
      },
    },
    { $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "paymentmethods",
        localField: "paymentInfo.paymentMethod",
        foreignField: "_id",
        as: "method",
      },
    },
    { $unwind: { path: "$method", preserveNullAndEmptyArrays: true } },
    ...refundLookup,
  ];

  if (filters.method_id && Types.ObjectId.isValid(filters.method_id)) {
    pipeline.push({
      $match: {
        "paymentInfo.paymentMethod": new Types.ObjectId(filters.method_id),
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: { $ifNull: ["$paymentInfo.paymentMethod", null] },
        method_name: {
          $first: {
            $ifNull: ["$method.name", "Unknown / deleted payment method"],
          },
        },
        total_received: { $sum: recordedPayment },
        total_refunded: { $sum: recordedRefund },
      },
    },
    {
      $project: {
        _id: 0,
        method_id: { $ifNull: [{ $toString: "$_id" }, "unknown"] },
        method_name: 1,
        total_received: 1,
        total_refunded: 1,
      },
    },
    { $sort: { total_received: -1 } }
  );

  return Order.aggregate<TPaymentReport>(pipeline);
};

export const SalesServices = {
  getSalesSummaryFromDB,
  getSalesOrdersFromDB,
  getSalesByProductFromDB,
  getSalesByCategoryFromDB,
  getSalesByPaymentsFromDB,
};
