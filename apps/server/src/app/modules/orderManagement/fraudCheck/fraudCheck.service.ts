import config from "../../../config/config";
import { Courier as CourierModel } from "../../courier/courier.model";
import {
  Courier,
  Errors,
  FormatFraudCheckData,
  Report,
} from "./fraudCheck.interface";
import {
  formatPaperFlyFraudData,
  formatPathaoFraudData,
  formatRedXFraudData,
  formatSteadfastFraudData,
  formatValue,
} from "./fraudCheck.utils";
import { getCourierCredentialValue } from "./steadfastFraudCheck";

const fraudCheckDB = async (mobile: string) => {
  // Define empty result for missing credentials
  const emptyResult = {
    totalOrders: 0,
    totalDeliveries: 0,
    totalCancellations: 0,
    deliveryRate: null as number | null,
    couriers: [],
    reports: [],
  };

  // Check for credentials
  // Steadfast: credentials MUST come from the database, NOT from local env
  const steadfastCourier = await CourierModel.findOne({
    slug: { $in: ["steadfast", "steedfast"] },
  });
  const steadfastApiKey = getCourierCredentialValue(
    steadfastCourier?.credentials,
    "Api-Key"
  );
  const steadfastSecretKey = getCourierCredentialValue(
    steadfastCourier?.credentials,
    "Secret-Key"
  );
  const hasSteadfast = Boolean(steadfastApiKey && steadfastSecretKey);

  // Other couriers keep as is (local env)
  const hasPathao = config.pathao.username && config.pathao.password;
  const hasRedX = config.redx.phoneNumber && config.redx.password;
  const hasPaperFly = config.paperfly.username && config.paperfly.password;

  const getMissingCredentialResult = (
    courierName: string
  ): FormatFraudCheckData => ({
    ...emptyResult,
    error: true,
    errorFrom: courierName,
    message: `${courierName} credentials are not configured${
      courierName === "Steadfast" ? " in database" : ""
    }.`,
  });

  // Fetch all data concurrently
  const [steadFast, pathao, redX, paperFly] = await Promise.all([
    hasSteadfast
      ? formatSteadfastFraudData(mobile, {
          apiKey: steadfastApiKey,
          secretKey: steadfastSecretKey,
        })
      : Promise.resolve(getMissingCredentialResult("Steadfast")),
    hasPathao
      ? formatPathaoFraudData(mobile)
      : Promise.resolve(getMissingCredentialResult("Pathao")),
    hasRedX
      ? formatRedXFraudData(mobile)
      : Promise.resolve(getMissingCredentialResult("RedX")),
    hasPaperFly
      ? formatPaperFlyFraudData(mobile)
      : Promise.resolve(getMissingCredentialResult("PaperFly")),
  ]);

  const errors: Errors[] = [];
  const reports: Report[] = [];

  // Helper to add reports and errors from each source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addData = (source: any) => {
    if (source.reports) reports.push(...source.reports);
    if (source.error) {
      errors.push({
        errorFrom: source.errorFrom,
        message: source.message,
      });
    }
  };

  // Process all sources
  [steadFast, pathao, redX, paperFly].forEach(addData);

  // Calculate total orders and deliveries correctly across all sources
  const totalOrders =
    steadFast.totalOrders +
    pathao.totalOrders +
    redX.totalOrders +
    paperFly.totalOrders;

  const totalDeliveries =
    steadFast.totalDeliveries +
    pathao.totalDeliveries +
    redX.totalDeliveries +
    paperFly.totalDeliveries;

  const totalCancellations = Math.max(0, totalOrders - totalDeliveries);

  let successRatio = 0;
  if (totalOrders > 0) {
    successRatio = (totalDeliveries / totalOrders) * 100;
  } else if (
    steadFast.deliveryRate !== null &&
    steadFast.deliveryRate !== undefined
  ) {
    successRatio = Number(steadFast.deliveryRate);
  }

  const couriers: Courier[] = [
    ...steadFast.couriers,
    ...pathao.couriers,
    ...redX.couriers,
    ...paperFly.couriers,
  ];

  const hasHistory =
    totalOrders > 0 ||
    (steadFast.deliveryRate !== null && steadFast.deliveryRate !== undefined);

  let message = "";
  if (!hasHistory) {
    message = "নতুন কাস্টমার! পূর্বের কোনো ডেলিভারি রেকর্ড পাওয়া যায়নি।";
  } else if (successRatio >= 70) {
    message = "ভালো কাস্টমার! ক্যাশ অন ডেলিভারিতে পার্সেল পাঠানো যাবে।";
  } else if (successRatio >= 40) {
    message =
      "ব্যবহার ও আচরণের উপর নির্ভর করে পার্সেল পাঠানো যাবে, অগ্রিম ডেলিভারি চার্জ নিলে ভালো হয়।";
  } else {
    message = "সাবধান! পার্সেল পাঠানোর আগে ডেলিভারি চার্জ নিয়ে নিবেন।";
  }

  return {
    phoneNumber: mobile,
    totalOrders,
    totalDeliveries,
    totalCancellations,
    successRatio: formatValue(successRatio),
    message,
    couriers,
    reports,
    errors,
  };
};

export const FraudCheckServices = {
  fraudCheckDB,
};
