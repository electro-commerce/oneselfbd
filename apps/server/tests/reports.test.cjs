const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  Order,
} = require("../src/app/modules/orderManagement/order/order.model");
const {
  OrderStatusHistory,
} = require("../src/app/modules/orderManagement/orderStatusHistory/orderStatusHistory.model");
const {
  SalesServices: sales,
} = require("../src/app/modules/reports/sales/sales.service");
const {
  SalesValidation: validation,
} = require("../src/app/modules/reports/sales/sales.validation");
const {
  DashboardServices: dashboard,
} = require("../src/app/modules/dashboard/dashboard.service");
const {
  buildDateMatch,
} = require("../src/app/modules/reports/sales/sales.utils");
const { aggregate } = require("./report-fixtures.cjs");

function setup(t, orders, collections = {}) {
  t.mock.method(Order, "aggregate", async (pipeline) =>
    aggregate(orders, pipeline, collections)
  );
}
const order = (extra = {}) => ({
  _id: "order",
  orderId: "INV",
  status: "completed",
  advance: 100,
  total: 900,
  discount: 0,
  couponDiscount: 0,
  createdAt: new Date("2026-10-21T06:00:00Z"),
  statusHistory: "history",
  payment: "payment",
  orderedProducts: [],
  ...extra,
});
const paymentCollections = (refunded = false) => ({
  orderpayments: [{ _id: "payment", paymentMethod: "method" }],
  paymentmethods: [{ _id: "method", name: "Cash" }],
  orderstatushistories: [{ _id: "history", refunded }],
});

test("unpaid order balances are never counted as received", async (t) => {
  setup(
    t,
    [order({ status: "pending", advance: 0, total: 1000 })],
    paymentCollections()
  );
  const [result] = await sales.getSalesByPaymentsFromDB({});
  assert.equal(result.total_received, 0);
  assert.equal(result.total_refunded, 0);
});
test("pending and canceled advances remain recorded payments", async (t) => {
  setup(
    t,
    [
      order({ status: "pending", advance: 200, total: 800 }),
      order({ _id: "canceled", status: "canceled", advance: 50, total: 950 }),
    ],
    paymentCollections()
  );
  const [result] = await sales.getSalesByPaymentsFromDB({});
  assert.equal(result.total_received, 250);
  assert.equal(result.total_refunded, 0);
});
test("a return alone does not count as a refund", async (t) => {
  setup(
    t,
    [order({ status: "returned", advance: 100, total: 900 })],
    paymentCollections(false)
  );
  assert.equal((await sales.getSalesSummaryFromDB({})).refund_amount, 0);
  assert.equal((await sales.getSalesByPaymentsFromDB({}))[0].total_refunded, 0);
});
test("confirmed refunds count the recorded advance, never unpaid balances", async (t) => {
  setup(
    t,
    [order({ status: "returned", advance: 100, total: 900 })],
    paymentCollections(true)
  );
  assert.equal((await sales.getSalesSummaryFromDB({})).refund_amount, 100);
  const [result] = await sales.getSalesByPaymentsFromDB({});
  assert.equal(result.total_received, 100);
  assert.equal(result.total_refunded, 100);
});
test("an unpaid returned order produces no refund even if marked refunded", async (t) => {
  setup(
    t,
    [order({ status: "returned", advance: 0, total: 1000 })],
    paymentCollections(true)
  );
  assert.equal((await sales.getSalesSummaryFromDB({})).refund_amount, 0);
});
test("sales include only completed and partially completed orders", async (t) => {
  setup(t, [
    order({ discount: 50, couponDiscount: 25 }),
    order({
      _id: "partial",
      status: "partial completed",
      advance: 0,
      total: 500,
    }),
    order({ _id: "pending", status: "pending", total: 5000 }),
    order({ _id: "returned", status: "returned", total: 5000 }),
  ]);
  const summary = await sales.getSalesSummaryFromDB({});
  assert.deepEqual(summary, {
    total_orders: 2,
    gross_sales: 1575,
    discount_total: 75,
    net_sales: 1500,
    paid_amount: 100,
    due_amount: 1400,
    refund_amount: 0,
  });
  assert.equal((await sales.getSalesOrdersFromDB({})).meta.total, 2);
});
test("orders beyond row 50 are reachable with consistent pagination metadata", async (t) => {
  setup(
    t,
    Array.from({ length: 65 }, (_, i) =>
      order({ _id: String(i).padStart(3, "0") })
    )
  );
  const first = await sales.getSalesOrdersFromDB({ page: "1", limit: "50" });
  const second = await sales.getSalesOrdersFromDB({ page: "2", limit: "50" });
  assert.equal(first.data.length, 50);
  assert.equal(second.data.length, 15);
  assert.equal(second.meta.total, 65);
  assert.equal(second.meta.totalPage, 2);
  assert.equal(
    new Set([...first.data, ...second.data].map((item) => item.order_id)).size,
    65
  );
});
test("Bangladesh day boundaries include local midnight and exclude the next day", async (t) => {
  const range = buildDateMatch({
    from: "2026-10-21",
    to: "2026-10-21",
  }).createdAt;
  assert.equal(range.$gte.toISOString(), "2026-10-20T18:00:00.000Z");
  assert.equal(range.$lte.toISOString(), "2026-10-21T17:59:59.999Z");
  setup(t, [
    order({ createdAt: range.$gte }),
    order({ _id: "end", createdAt: range.$lte }),
    order({ _id: "before", createdAt: new Date(range.$gte - 1) }),
    order({ _id: "after", createdAt: new Date(+range.$lte + 1) }),
  ]);
  assert.equal(
    (
      await sales.getSalesSummaryFromDB({
        from: "2026-10-21",
        to: "2026-10-21",
      })
    ).total_orders,
    2
  );
});
test("strict date filters reject invalid formats, dates, and reversed ranges", () => {
  for (const from of ["2026-02-30", "2026-10-21T00:00:00Z", "10/21/2026", ""])
    assert.equal(
      validation.summary.safeParse({ query: { from } }).success,
      false,
      from
    );
  assert.equal(
    validation.summary.safeParse({
      query: { from: "2026-10-22", to: "2026-10-21" },
    }).success,
    false
  );
  assert.equal(
    validation.summary.safeParse({ query: { from: "2024-02-29" } }).success,
    true
  );
});
test("pagination rejects decimals, nonpositive numbers, and excessive limits", () => {
  for (const query of [
    { page: "1.5" },
    { page: "0" },
    { limit: "2.5" },
    { limit: "1000000" },
    { page: "Infinity" },
  ])
    assert.equal(validation.orders.safeParse({ query }).success, false);
});
test("invalid IDs fail validation instead of silently removing filters", () => {
  assert.equal(
    validation.byProduct.safeParse({ query: { product_id: "bad" } }).success,
    false
  );
  assert.equal(
    validation.byCategory.safeParse({ query: { category_id: "bad" } }).success,
    false
  );
  assert.equal(
    validation.payments.safeParse({ query: { method_id: "bad" } }).success,
    false
  );
});
test("deleted products and categories retain historical sales without category duplication", async (t) => {
  setup(
    t,
    [
      order({
        orderedProducts: [{ product: "product", quantity: 2, total: 1000 }],
      }),
    ],
    {
      products: [
        {
          _id: "product",
          title: "Archived",
          isDeleted: true,
          category: ["one", "two"],
        },
      ],
      categories: [
        { _id: "one", name: "Archived category", isDeleted: true },
        { _id: "two", name: "Second" },
      ],
    }
  );
  const products = await sales.getSalesByProductFromDB({});
  const categories = await sales.getSalesByCategoryFromDB({});
  assert.equal(products[0].total_sales, 1000);
  assert.equal(products[0].quantity_sold, 2);
  assert.equal(categories.length, 1);
  assert.equal(categories[0].category_id, "one");
  assert.equal(categories[0].total_sales, 1000);
});
test("missing catalog records are retained in explicit fallback buckets", async (t) => {
  setup(t, [
    order({
      orderedProducts: [{ product: "removed", quantity: 1, total: 1000 }],
    }),
  ]);
  assert.equal(
    (await sales.getSalesByProductFromDB({}))[0].product_name,
    "Deleted product"
  );
  assert.equal(
    (await sales.getSalesByCategoryFromDB({}))[0].category_id,
    "uncategorized"
  );
  assert.equal(
    (await sales.getSalesByPaymentsFromDB({}))[0].total_received,
    100
  );
});
test("warranty replacement units do not inflate merchandise sales", async (t) => {
  setup(t, [
    order({
      orderedProducts: [
        { product: "product", quantity: 2, total: 1000, isWarrantyClaim: true },
      ],
    }),
  ]);
  assert.deepEqual(await sales.getSalesByProductFromDB({}), []);
  assert.deepEqual(await sales.getSalesByCategoryFromDB({}), []);
});
test("chart groups early and late local orders into the same Bangladesh day", async (t) => {
  const start = new Date();
  start.setUTCHours(18, 0, 0, 0);
  setup(t, [
    order({ createdAt: new Date(+start - 23 * 3600000) }),
    order({ _id: "late", createdAt: new Date(+start - 1) }),
  ]);
  const result = await dashboard.getOrderReportFromDB("daily");
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 2);
});
test("refund lookup targets the real Mongoose collection", () => {
  assert.equal(OrderStatusHistory.collection.name, "orderstatushistories");
});

test("category filters use the same single attribution in both breakdowns", async (t) => {
  const primary = "111111111111111111111111",
    secondary = "222222222222222222222222";
  setup(
    t,
    [
      order({
        orderedProducts: [{ product: "product", quantity: 1, total: 1000 }],
      }),
    ],
    {
      products: [
        { _id: "product", title: "Device", category: [primary, secondary] },
      ],
      categories: [
        { _id: primary, name: "Primary" },
        { _id: secondary, name: "Secondary" },
      ],
    }
  );
  assert.equal(
    (await sales.getSalesByProductFromDB({ category_id: primary })).length,
    1
  );
  assert.equal(
    (await sales.getSalesByCategoryFromDB({ category_id: primary })).length,
    1
  );
  assert.deepEqual(
    await sales.getSalesByProductFromDB({ category_id: secondary }),
    []
  );
  assert.deepEqual(
    await sales.getSalesByCategoryFromDB({ category_id: secondary }),
    []
  );
});
test("a deleted payment method remains filterable by its stored ID", async (t) => {
  const method = "111111111111111111111111";
  setup(t, [order()], {
    orderpayments: [{ _id: "payment", paymentMethod: method }],
  });
  const [result] = await sales.getSalesByPaymentsFromDB({ method_id: method });
  assert.equal(result.total_received, 100);
  assert.equal(result.method_id, method);
});
