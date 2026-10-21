import baseApi from "@/redux/baseApi/baseApi";
import { TSuccessResponse } from "@/types/response";
import {
  TDashboardSummary,
  TOrderReportFilter,
  TOrderReportItem,
  TOrderStatusCount,
  TOrdersSummary,
  TRecentOrder,
  TTopCustomer,
} from "./dashboardInterface";

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<
      TSuccessResponse<TDashboardSummary>,
      void
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
      query: () => ({
        url: "/dashboard/stats",
      }),
    }),
    getOrderStatusCount: builder.query<
      TSuccessResponse<TOrderStatusCount[]>,
      void
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
      query: () => ({
        url: "/dashboard/order-status",
      }),
    }),
    getShippingStatusCount: builder.query<
      TSuccessResponse<TOrderStatusCount[]>,
      void
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
      query: () => ({
        url: "/dashboard/shipping-status",
      }),
    }),
    getOrdersSummary: builder.query<TSuccessResponse<TOrdersSummary>, void>({
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
      query: () => ({
        url: "/dashboard/orders-summary",
      }),
    }),
    getOrderReport: builder.query<
      TSuccessResponse<TOrderReportItem[]>,
      TOrderReportFilter
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
      query: (filter) => ({
        url: `/dashboard/order-report?filter=${filter}`,
      }),
    }),
    getTopCustomers: builder.query<TSuccessResponse<TTopCustomer[]>, void>({
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
      query: () => ({
        url: "/dashboard/top-customers",
      }),
    }),
    getRecentOrders: builder.query<TSuccessResponse<TRecentOrder[]>, void>({
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
      query: () => ({
        url: "/dashboard/recent-orders",
      }),
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetOrderStatusCountQuery,
  useGetShippingStatusCountQuery,
  useGetOrdersSummaryQuery,
  useGetOrderReportQuery,
  useGetTopCustomersQuery,
  useGetRecentOrdersQuery,
} = dashboardApi;
