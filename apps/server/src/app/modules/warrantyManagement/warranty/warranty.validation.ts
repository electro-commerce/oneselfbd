import { z } from "zod";

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");
const createWarranty = z.object({
  body: z.object({
    order_Id: objectId,
    warrantyInfo: z
      .array(
        z.object({
          itemId: objectId,
          codes: z
            .array(
              z.object({ code: z.string().trim().min(1, "Code is required") })
            )
            .min(1, "Add at least one code"),
        })
      )
      .min(1, "Warranty information is required")
      .superRefine((items, ctx) => {
        const codes = new Set<string>();
        const itemIds = new Set<string>();
        items.forEach((item, itemIndex) => {
          if (itemIds.has(item.itemId))
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [itemIndex, "itemId"],
              message: "Duplicate order item",
            });
          itemIds.add(item.itemId);
          item.codes.forEach(({ code }, codeIndex) => {
            if (codes.has(code))
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [itemIndex, "codes", codeIndex, "code"],
                message: "Duplicate warranty code",
              });
            codes.add(code);
          });
        });
      }),
  }),
});

export const ValidateWarranty = { createWarranty };
