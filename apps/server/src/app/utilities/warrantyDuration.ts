export const warrantyDuration = (
  duration: { quantity: string; unit: string } | undefined,
  start = new Date()
) => {
  const date = new Date(start);
  const quantity = Number(duration?.quantity);
  const unit = duration?.unit?.toLowerCase();
  const format = (value: Date) =>
    value.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(date.getTime())
  ) {
    return { startDate: format(date), endDate: undefined };
  }
  const end = new Date(date);
  switch (unit) {
    case "day":
    case "days":
      end.setDate(date.getDate() + quantity);
      break;
    case "week":
    case "weeks":
      end.setDate(date.getDate() + quantity * 7);
      break;
    case "month":
    case "months":
    case "year":
    case "years": {
      // Clamp month-end and leap-day warranties to the last day of the target month.
      end.setDate(1);
      if (unit === "month" || unit === "months")
        end.setMonth(date.getMonth() + quantity);
      else end.setFullYear(date.getFullYear() + quantity);
      const lastDay = new Date(
        end.getFullYear(),
        end.getMonth() + 1,
        0
      ).getDate();
      end.setDate(Math.min(date.getDate(), lastDay));
      break;
    }
    default:
      return { startDate: format(date), endDate: undefined };
  }
  return {
    startDate: format(date),
    endDate: Number.isFinite(end.getTime()) ? format(end) : undefined,
  };
};
