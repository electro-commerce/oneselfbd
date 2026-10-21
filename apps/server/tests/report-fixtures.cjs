// Small fixture evaluator for the Mongo stages used by reports; no database or
// production data is accessed. Unsupported expressions fail rather than pass silently.
const moment = require("moment-timezone");
const same = (a, b) => (a == null && b == null) || String(a) === String(b);
const get = (doc, path) =>
  path.split(".").reduce((value, key) => value?.[key], doc);
const put = (doc, path, value) => {
  const keys = path.split(".");
  let target = doc;
  for (const key of keys.slice(0, -1)) target = target[key] ||= {};
  target[keys.at(-1)] = value;
};
function evaluate(expr, doc) {
  if (typeof expr === "string" && expr.startsWith("$"))
    return get(doc, expr.slice(1));
  if (
    expr == null ||
    typeof expr !== "object" ||
    expr instanceof Date ||
    expr._bsontype
  )
    return expr;
  if (Array.isArray(expr)) return expr.map((value) => evaluate(value, doc));
  const op = Object.keys(expr)[0];
  if (!op?.startsWith("$"))
    return Object.fromEntries(
      Object.entries(expr).map(([key, value]) => [key, evaluate(value, doc)])
    );
  const value = expr[op];
  switch (op) {
    case "$ifNull": {
      const [a, b] = evaluate(value, doc);
      return a ?? b;
    }
    case "$add":
      return evaluate(value, doc).reduce((a, b) => a + b, 0);
    case "$max":
      return Math.max(...evaluate(value, doc));
    case "$in": {
      const [a, b] = evaluate(value, doc);
      return b.some((item) => same(a, item));
    }
    case "$eq": {
      const [a, b] = evaluate(value, doc);
      return same(a, b);
    }
    case "$gt": {
      const [a, b] = evaluate(value, doc);
      return a > b;
    }
    case "$lte": {
      const [a, b] = evaluate(value, doc);
      return a <= b;
    }
    case "$cond":
      return evaluate(evaluate(value[0], doc) ? value[1] : value[2], doc);
    case "$toString": {
      const result = evaluate(value, doc);
      return result == null ? null : String(result);
    }
    case "$arrayElemAt": {
      const [a, b] = evaluate(value, doc);
      return a?.[b];
    }
    case "$switch": {
      const branch = value.branches.find((branch) =>
        evaluate(branch.case, doc)
      );
      return evaluate(branch ? branch.then : value.default, doc);
    }
    case "$year":
    case "$month":
    case "$dayOfMonth":
    case "$isoWeekYear":
    case "$isoWeek": {
      const date =
        typeof value === "string"
          ? evaluate(value, doc)
          : evaluate(value.date, doc);
      const m = moment(date).tz(value.timezone || "UTC");
      return {
        $year: () => m.year(),
        $month: () => m.month() + 1,
        $dayOfMonth: () => m.date(),
        $isoWeekYear: () => m.isoWeekYear(),
        $isoWeek: () => m.isoWeek(),
      }[op]();
    }
    case "$dateToString":
      return moment(evaluate(value.date, doc))
        .tz(value.timezone || "UTC")
        .format(
          {
            "%b %d": "MMM DD",
            "%b %Y": "MMM YYYY",
            "%Y": "YYYY",
            "%G-W%V": "GGGG-[W]WW",
          }[value.format]
        );
    default:
      throw Error(`Unsupported report test expression ${op}`);
  }
}
function matches(doc, query) {
  return Object.entries(query).every(([key, value]) => {
    const actual = get(doc, key);
    if (
      value &&
      typeof value === "object" &&
      !value._bsontype &&
      !(value instanceof Date)
    ) {
      return Object.entries(value).every(([op, expected]) => {
        switch (op) {
          case "$in":
            return expected.some((item) => same(actual, item));
          case "$nin":
            return !expected.some((item) => same(actual, item));
          case "$ne":
            return !same(actual, expected);
          case "$gte":
            return actual >= expected;
          case "$lte":
            return actual <= expected;
          default:
            throw Error(`Unsupported report test match ${op}`);
        }
      });
    }
    return same(actual, value);
  });
}
function aggregate(input, pipeline, collections = {}) {
  let docs = input;
  for (const stage of pipeline) {
    const [operator, value] = Object.entries(stage)[0];
    switch (operator) {
      case "$match":
        docs = docs.filter((doc) => matches(doc, value));
        break;
      case "$sort":
        docs = [...docs].sort((a, b) => {
          for (const [key, direction] of Object.entries(value)) {
            const aa = get(a, key),
              bb = get(b, key);
            if (aa < bb) return -direction;
            if (aa > bb) return direction;
          }
          return 0;
        });
        break;
      case "$skip":
        docs = docs.slice(value);
        break;
      case "$limit":
        docs = docs.slice(0, value);
        break;
      case "$count":
        docs = docs.length ? [{ [value]: docs.length }] : [];
        break;
      case "$lookup":
        docs = docs.map((doc) => ({
          ...doc,
          [value.as]: (collections[value.from] || []).filter((other) =>
            same(get(doc, value.localField), get(other, value.foreignField))
          ),
        }));
        break;
      case "$unwind": {
        const path = (typeof value === "string" ? value : value.path).slice(1);
        docs = docs.flatMap((doc) => {
          const items = get(doc, path);
          if (!items?.length)
            return value.preserveNullAndEmptyArrays ? [doc] : [];
          return items.map((item) => {
            const result = structuredClone(doc);
            put(result, path, item);
            return result;
          });
        });
        break;
      }
      case "$set":
        docs = docs.map((doc) => {
          const result = { ...doc };
          for (const [key, expr] of Object.entries(value))
            put(result, key, evaluate(expr, doc));
          return result;
        });
        break;
      case "$project":
        docs = docs.map((doc) =>
          Object.fromEntries(
            Object.entries(value)
              .filter(([, expr]) => expr !== 0)
              .map(([key, expr]) => [
                key,
                expr === 1 ? doc[key] : evaluate(expr, doc),
              ])
          )
        );
        break;
      case "$group": {
        const groups = new Map();
        for (const doc of docs) {
          const id = evaluate(value._id, doc),
            key = JSON.stringify(id);
          if (!groups.has(key)) groups.set(key, { _id: id });
          const result = groups.get(key);
          for (const [field, expr] of Object.entries(value)) {
            if (field === "_id") continue;
            if ("$sum" in expr)
              result[field] =
                (result[field] || 0) + (evaluate(expr.$sum, doc) || 0);
            else if ("$first" in expr) {
              if (!(field in result))
                result[field] = evaluate(expr.$first, doc);
            } else if ("$min" in expr) {
              const next = evaluate(expr.$min, doc);
              if (!(field in result) || next < result[field])
                result[field] = next;
            } else throw Error("Unsupported report test accumulator");
          }
        }
        docs = [...groups.values()];
        break;
      }
      case "$facet":
        docs = [
          Object.fromEntries(
            Object.entries(value).map(([key, pipeline]) => [
              key,
              aggregate(docs, pipeline, collections),
            ])
          ),
        ];
        break;
      default:
        throw Error(`Unsupported report test stage ${operator}`);
    }
  }
  return docs;
}
module.exports = { aggregate };
