import { z } from "zod";
import { paymentZodSchema } from "../../orderManagement/orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../../orderManagement/shipping/shipping.validation";
import { phoneNumberValidationZodSchema } from "../../userManagement/user/user.validation";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
} from "./warrantyClaim.const";

const warrantyCodesSchema = z
  .array(z.string().trim().min(1, "Warranty code is required"))
  .min(1, "Add at least one warranty code")
  .refine(
    (codes) => new Set(codes).size === codes.length,
    "Duplicate warranty codes are not allowed"
  );

const checkWarranty = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    warrantyCodes: warrantyCodesSchema,
  }),
});

const createWarrantyClaimReq = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    warrantyCodes: warrantyCodesSchema,
    shipping: shippingValidationZodSchema(true),
    problemInDetails: z.string({
      required_error: "Problem details is required",
    }),
  }),
});

const updateWarrantyClaimReq = z.object({
  body: z.object({
    shipping: shippingValidationZodSchema(true).optional(),
    officialNotes: z.string().optional(),
    phoneNumber: z.string().optional(),
    result: z
      .enum([...warrantyClaimedProductCondition] as [string, ...string[]])
      .optional(),
    approvalStatus: z
      .enum([...warrantyApprovalStatus] as [string, ...string[]])
      .optional(),
    contactStatus: z
      .enum([...warrantyClaimedContactStatus] as [string, ...string[]])
      .optional(),
    warrantyClaimReqData: warrantyCodesSchema.optional(),
  }),
});

const updateContactStatus = z.object({
  body: z.object({
    warrantyClaimedReqIds: z
      .string({ required_error: "Warranty claim ids is required" })
      .array(),
    status: z.enum([...warrantyClaimedContactStatus] as [string, ...string[]]),
  }),
});

const approveAndCreateOrder = z.object({
  body: z.object({
    payment: paymentZodSchema,
    shippingCharge: z.string({
      required_error: "Shipping charge id is required",
    }),
  }),
});

export const WarrantyClaimValidation = {
  checkWarranty,
  createWarrantyClaimReq,
  updateWarrantyClaimReq,
  updateContactStatus,
  approveAndCreateOrder,
};
