import moment from "moment-timezone";
import { z } from "zod";
import { orderStatus } from "../../orderManagement/order/order.const";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine(
    (value) => moment(value, "YYYY-MM-DD", true).isValid(),
    "Invalid calendar date"
  );
const dateFilters = z.object({ from: date.optional(), to: date.optional() });
const validRange = (value: { from?: string; to?: string }) =>
  !value.from || !value.to || value.from <= value.to;
const rangeMessage = {
  message: "'from' must be on or before 'to'",
  path: ["to"],
};
const positiveInteger = (maximum: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Use a positive whole number")
    .refine(
      (value) =>
        Number.isSafeInteger(Number(value)) && Number(value) <= maximum,
      `Must be at most ${maximum}`
    );
const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID")
  .optional();

export const SalesValidation = {
  summary: z.object({ query: dateFilters.refine(validRange, rangeMessage) }),
  orders: z.object({
    query: dateFilters
      .extend({
        page: positiveInteger(1000000).optional(),
        limit: positiveInteger(200).optional(),
        order_status: z.enum(orderStatus as [string, ...string[]]).optional(),
      })
      .refine(validRange, rangeMessage),
  }),
  byProduct: z.object({
    query: dateFilters
      .extend({ product_id: objectId, category_id: objectId })
      .refine(validRange, rangeMessage),
  }),
  byCategory: z.object({
    query: dateFilters
      .extend({ category_id: objectId })
      .refine(validRange, rangeMessage),
  }),
  payments: z.object({
    query: dateFilters
      .extend({ method_id: objectId })
      .refine(validRange, rangeMessage),
  }),
};
