/* eslint-disable @typescript-eslint/no-explicit-any */
import { Courier, FormatFraudCheckData, Report } from "./fraudCheck.interface";
import { paperFlyFraudCheck } from "./paperFlyFraudCheck";
import { pathaoFraudCheck } from "./pathaoFraudCheck";
import { redXFraudCheck } from "./redXFraudCheck";
import {
  TSteadfastCredentials,
  steadfastFraudCheck,
} from "./steadfastFraudCheck";

function formatValue(value: number) {
  return value % 1 === 0 ? value : Math.round(value); // 84.33=84 84.55=85
}

const formatSteadfastFraudData = async (
  mobile: string,
  credentials?: TSteadfastCredentials
): Promise<FormatFraudCheckData> => {
  try {
    const res = await steadfastFraudCheck(mobile, credentials);

    const reports: Report[] = [];

    // Parse fraud_categories from Steadfast API (code => count)
    if (res?.fraud_categories) {
      if (
        typeof res.fraud_categories === "object" &&
        !Array.isArray(res.fraud_categories)
      ) {
        Object.entries(res.fraud_categories).forEach(([category, count]) => {
          const categoryName = category.replace(/_/g, " ");
          reports.push({
            reportFrom: "Steadfast",
            comment: `${categoryName}: reported ${count} time(s)`,
            date: "",
          });
        });
      } else if (Array.isArray(res.fraud_categories)) {
        res.fraud_categories.forEach((cat: any) => {
          if (typeof cat === "string") {
            reports.push({
              reportFrom: "Steadfast",
              comment: cat.replace(/_/g, " "),
              date: "",
            });
          } else if (cat && typeof cat === "object") {
            reports.push({
              reportFrom: "Steadfast",
              comment:
                cat.details || cat.reason || cat.code || JSON.stringify(cat),
              date: cat.created_at || "",
            });
          }
        });
      }
    }

    // Reasons array (if any present)
    if (Array.isArray(res?.reasons) && res.reasons.length > 0) {
      res.reasons.forEach((reason: any) => {
        if (reason) {
          reports.push({
            reportFrom: "Steadfast",
            comment: String(reason),
            date: "",
          });
        }
      });
    }

    // Legacy frauds array if present
    if (Array.isArray(res?.frauds) && res.frauds.length > 0) {
      res.frauds.forEach((entry: any) => {
        reports.push({
          reportFrom: "Steadfast",
          comment: entry.details || entry.comment || "",
          date: entry.created_at || "",
        });
      });
    }

    // Reports filed before categories existed carry none, so total_reports can be higher
    if ((res?.total_reports || 0) > 0 && reports.length === 0) {
      reports.push({
        reportFrom: "Steadfast",
        comment: `Total fraud reports: ${res.total_reports}`,
        date: "",
      });
    }

    if (res?.doubtful_reports) {
      reports.push({
        reportFrom: "Steadfast",
        comment: "Notice: Contains doubtful reports filed against this customer.",
        date: "",
      });
    }

    const hasExactCounts =
      res?.delivered_count !== null &&
      res?.delivered_count !== undefined &&
      res?.cancelled_count !== null &&
      res?.cancelled_count !== undefined;

    const deliveredCount = hasExactCounts ? Number(res.delivered_count) : 0;
    const cancelledCount = hasExactCounts ? Number(res.cancelled_count) : 0;
    const totalOrdersCount = hasExactCounts
      ? deliveredCount + cancelledCount
      : 0;

    // Delivery rate:
    // delivery_ratio and cancellation_ratio are whole percents of customer's finished parcels.
    // Both are null — not 0 — for a number nothing has finished for.
    let deliveryRate: number | null = null;
    if (res?.delivery_ratio !== null && res?.delivery_ratio !== undefined) {
      deliveryRate = Number(res.delivery_ratio);
    } else if (hasExactCounts && totalOrdersCount > 0) {
      deliveryRate = Math.floor((deliveredCount / totalOrdersCount) * 100);
    }

    // Display values for courier table:
    // Exact counts are shown when merchant is booking regularly.
    // If counts are null, show volume range / N/A.
    const displayOrders = hasExactCounts
      ? totalOrdersCount
      : res?.volume_range ?? (res?.volume_band && res.volume_band !== "none" ? res.volume_band : 0);
    const displayDeliveries = hasExactCounts
      ? deliveredCount
      : deliveryRate !== null
        ? "N/A"
        : 0;
    const displayCancellations = hasExactCounts
      ? cancelledCount
      : deliveryRate !== null
        ? "N/A"
        : 0;

    const couriers: Courier[] = [
      {
        name: "Steadfast",
        logo: "https://i.ibb.co.com/tM68nWR/stead-fast.png",
        orders: displayOrders,
        deliveries: displayDeliveries,
        cancellations: displayCancellations,
        deliveryRate: deliveryRate,
        volumeBand: res?.volume_band || null,
        volumeRange: res?.volume_range || null,
        deliveryRatio:
          res?.delivery_ratio !== null && res?.delivery_ratio !== undefined
            ? Number(res.delivery_ratio)
            : null,
        cancellationRatio:
          res?.cancellation_ratio !== null &&
          res?.cancellation_ratio !== undefined
            ? Number(res.cancellation_ratio)
            : null,
        doubtfulReports: Boolean(res?.doubtful_reports),
      },
    ];

    const data: FormatFraudCheckData = {
      totalOrders: totalOrdersCount,
      totalDeliveries: deliveredCount,
      totalCancellations: cancelledCount,
      deliveryRate,
      couriers,
      reports,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "Steadfast",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatPathaoFraudData = async (mobile: string) => {
  try {
    const res = await pathaoFraudCheck(mobile);

    const reports: Report[] = [];

    if (res.data?.fraud_reason || res.data?.customer?.fraud_reason) {
      reports.push({
        reportFrom: "Pathao",
        comment: res.data?.customer?.fraud_reason || res.data?.fraud_reason,
        date: "",
      });
    }

    const totalOrders = res.data?.customer?.total_delivery || 0;
    const totalDeliveries = res.data?.customer?.successful_delivery || 0;
    const totalCancellations = totalOrders - totalDeliveries;
    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "Pathao",
        logo: "https://i.ibb.co.com/b1xNZJY/pathao.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
      reports,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "Pathao",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatRedXFraudData = async (mobile: string) => {
  try {
    const res = await redXFraudCheck(mobile);

    const totalOrders = parseInt(res.data?.totalParcels, 10) || 0;
    const totalDeliveries = parseInt(res.data?.deliveredParcels, 10) || 0;
    const totalCancellations = totalOrders - totalDeliveries;
    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "RedX",
        logo: "https://i.ibb.co.com/NWL7Tr4/redx.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "RedX",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

const formatPaperFlyFraudData = async (mobile: string) => {
  try {
    const res = await paperFlyFraudCheck(mobile);

    if (!res.records?.length) {
      return {
        totalOrders: 0,
        totalDeliveries: 0,
        totalCancellations: 0,
        couriers: [
          {
            name: "PaperFly",
            logo: "https://go.paperfly.com.bd/static/assets/paperfly-logo.d67bc8c5.png",
            orders: 0,
            deliveries: 0,
            cancellations: 0,
            deliveryRate: 0,
          },
        ],
      };
    }

    const { delivered = "0", returned = "0" } = res.records[0] || {};
    const totalDeliveries = parseInt(delivered, 10) || 0;
    const totalCancellations = parseInt(returned, 10) || 0;
    const totalOrders = totalDeliveries + totalCancellations;
    const successRatio = totalOrders
      ? (totalDeliveries / totalOrders) * 100
      : 0;

    const couriers: Courier[] = [
      {
        name: "PaperFly",
        logo: "https://go.paperfly.com.bd/static/assets/paperfly-logo.d67bc8c5.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];
    const data: FormatFraudCheckData = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
    };
    return data;
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "PaperFly",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
      reports: [],
    };
  }
};

export {
  formatSteadfastFraudData,
  formatPathaoFraudData,
  formatRedXFraudData,
  formatPaperFlyFraudData,
  formatValue,
};
