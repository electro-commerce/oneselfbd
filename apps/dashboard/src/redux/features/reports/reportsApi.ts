import baseApi from "@/redux/baseApi/baseApi";
import { TSuccessResponse } from "@/types/response";
import searchParams from "@/utilities/searchParams";
import {
  TCategoryReport,
  TPaymentReport,
  TProductReport,
  TSalesReportFilters,
  TSalesReportOrder,
  TSalesSummary,
} from "./reportsInterface";

const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesSummary: builder.query<
      TSuccessResponse<TSalesSummary>,
      TSalesReportFilters
    >({
      providesTags: [
        "allOrders",
        "processingOrders",
        "courierShipmentOrders",
        "monitorDeliveryOrders",
        "completedOrders",
        "productList",
        "categories",
        "paymentMethod",
      ],
      query: (args) => ({
        url: "/reports/sales/summary",
        params: searchParams(args),
      }),
    }),
    getSalesOrders: builder.query<
      TSuccessResponse<TSalesReportOrder[]>,
      TSalesReportFilters
    >({
      providesTags: [
        "allOrders",
        "processingOrders",
        "courierShipmentOrders",
        "monitorDeliveryOrders",
        "completedOrders",
        "productList",
        "categories",
        "paymentMethod",
      ],
      query: (args) => ({
        url: "/reports/sales/orders",
        params: searchParams(args),
      }),
    }),
    getSalesByProduct: builder.query<
      TSuccessResponse<TProductReport[]>,
      TSalesReportFilters
    >({
      providesTags: [
        "allOrders",
        "processingOrders",
        "courierShipmentOrders",
        "monitorDeliveryOrders",
        "completedOrders",
        "productList",
        "categories",
        "paymentMethod",
      ],
      query: (args) => ({
        url: "/reports/sales/by-product",
        params: searchParams(args),
      }),
    }),
    getSalesByCategory: builder.query<
      TSuccessResponse<TCategoryReport[]>,
      TSalesReportFilters
    >({
      providesTags: [
        "allOrders",
        "processingOrders",
        "courierShipmentOrders",
        "monitorDeliveryOrders",
        "completedOrders",
        "productList",
        "categories",
        "paymentMethod",
      ],
      query: (args) => ({
        url: "/reports/sales/by-category",
        params: searchParams(args),
      }),
    }),
    getSalesByPayments: builder.query<
      TSuccessResponse<TPaymentReport[]>,
      TSalesReportFilters
    >({
      providesTags: [
        "allOrders",
        "processingOrders",
        "courierShipmentOrders",
        "monitorDeliveryOrders",
        "completedOrders",
        "productList",
        "categories",
        "paymentMethod",
      ],
      query: (args) => ({
        url: "/reports/sales/payments",
        params: searchParams(args),
      }),
    }),
  }),
});

export const {
  useGetSalesSummaryQuery,
  useGetSalesOrdersQuery,
  useGetSalesByProductQuery,
  useGetSalesByCategoryQuery,
  useGetSalesByPaymentsQuery,
} = reportsApi;
