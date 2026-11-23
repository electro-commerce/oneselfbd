/* eslint-disable @typescript-eslint/no-explicit-any */
import { Courier as CourierModel } from "../../courier/courier.model";
import { TShippingMethodCredential } from "../../courier/courier.interface";
import { decrypt } from "../../../utilities/encryptAndDecryptDBPass";

export type TSteadfastCredentials = {
  apiKey?: string;
  secretKey?: string;
};

export type TSteadfastFraudResponse = {
  status: number;
  phone: string;
  delivery_ratio: number | null;
  cancellation_ratio: number | null;
  volume_band: string | null;
  volume_range: string | null;
  delivered_count: number | null;
  cancelled_count: number | null;
  total_reports: number;
  fraud_categories: Record<string, number> | string[] | any;
  score: number | null;
  level: string | null;
  reasons: string[];
  scoring_disabled: boolean;
  doubtful_reports?: boolean;
  return_ratio?: number | null;
  message?: string;
  error?: string;
  frauds?: any[];
};

/**
 * Helper to retrieve a credential value from a courier's credential array in DB.
 * Handles key variations and decryptions when needed.
 */
export const getCourierCredentialValue = (
  credentials?: TShippingMethodCredential[],
  keyName: string = ""
): string | undefined => {
  if (!credentials || !Array.isArray(credentials)) return undefined;
  const normalizedKey = keyName.toLowerCase().replace(/[-_]/g, "");
  const cred = credentials.find(
    (c) =>
      c.key &&
      (c.key.toLowerCase().replace(/[-_]/g, "") === normalizedKey ||
        c.key === keyName)
  );
  if (!cred || !cred.value) return undefined;
  if (cred.need_to_hash) {
    try {
      return decrypt(cred.value);
    } catch {
      return cred.value;
    }
  }
  return cred.value;
};

/**
 * Check fraud status using Steadfast Official API:
 * GET https://portal.packzy.com/api/v1/fraud_check/score/{phone}
 * Uses API credentials from database (not local env).
 */
async function steadfastFraudCheck(
  phoneNumber: string,
  credentials?: TSteadfastCredentials
): Promise<TSteadfastFraudResponse> {
  let apiKey = credentials?.apiKey;
  let secretKey = credentials?.secretKey;

  // Retrieve credentials from database if not explicitly provided
  if (!apiKey || !secretKey) {
    const steadfastCourier = await CourierModel.findOne({
      slug: { $in: ["steadfast", "steedfast"] },
    });

    if (!steadfastCourier) {
      throw new Error("Steadfast courier is not configured in database.");
    }

    apiKey = getCourierCredentialValue(steadfastCourier.credentials, "Api-Key");
    secretKey = getCourierCredentialValue(
      steadfastCourier.credentials,
      "Secret-Key"
    );
  }

  if (!apiKey || !secretKey) {
    throw new Error(
      "Steadfast Api-Key or Secret-Key credentials missing in database."
    );
  }

  const cleanPhone = phoneNumber.trim();
  const url = `https://portal.packzy.com/api/v1/fraud_check/score/${cleanPhone}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    const responseData = (await response.json().catch(() => null)) as any;

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `Request failed with status ${response.status}`;

      if (response.status === 429) {
        throw new Error(
          `Failed to check steadfast fraud status. Rate limit exceeded (429): ${errorMessage}`
        );
      }

      if (response.status === 401) {
        throw new Error(
          `Failed to check steadfast fraud status. Unauthorized (401): ${errorMessage}`
        );
      }

      throw new Error(`Failed to check steadfast fraud status. ${errorMessage}`);
    }

    if (responseData?.status && responseData.status !== 200) {
      throw new Error(
        `Failed to check steadfast fraud status. ${
          responseData?.message || `Status: ${responseData.status}`
        }`
      );
    }

    return responseData;
  } catch (error: any) {
    throw new Error(error.message || "Failed to check steadfast fraud status.");
  }
}

export { steadfastFraudCheck };
