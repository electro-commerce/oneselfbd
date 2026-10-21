const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { warrantyDuration } = require("../src/app/utilities/warrantyDuration");
const {
  ValidateWarranty,
} = require("../src/app/modules/warrantyManagement/warranty/warranty.validation");
const {
  WarrantyService,
} = require("../src/app/modules/warrantyManagement/warranty/warranty.service");
const {
  Warranty,
} = require("../src/app/modules/warrantyManagement/warranty/warranty.model");
const {
  Order,
} = require("../src/app/modules/orderManagement/order/order.model");
const {
  OrderStatusHistory,
} = require("../src/app/modules/orderManagement/orderStatusHistory/orderStatusHistory.model");
const id = () => new mongoose.Types.ObjectId();

for (const [quantity, unit] of [
  ["0", "days"],
  ["-1", "months"],
  ["1.5", "years"],
  ["abc", "days"],
  ["12", "select"],
]) {
  test(`reject invalid warranty duration ${quantity} ${unit}`, () => {
    assert.equal(warrantyDuration({ quantity, unit }).endDate, undefined);
  });
}
test("month-end and leap-day durations stay in the target month", () => {
  assert.equal(
    warrantyDuration({ quantity: "1", unit: "months" }, new Date(2026, 0, 31))
      .endDate,
    "February 28, 2026"
  );
  assert.equal(
    warrantyDuration({ quantity: "1", unit: "years" }, new Date(2024, 1, 29))
      .endDate,
    "February 28, 2025"
  );
});
test("API rejects blank codes, repeated codes across products, and duplicate item IDs", () => {
  const itemId = String(id());
  const parse = (warrantyInfo) =>
    ValidateWarranty.createWarranty.safeParse({
      body: { order_Id: String(id()), warrantyInfo },
    });
  assert.equal(parse([{ itemId, codes: [{ code: " " }] }]).success, false);
  assert.equal(
    parse([
      { itemId, codes: [{ code: " A " }] },
      { itemId: String(id()), codes: [{ code: "A" }] },
    ]).success,
    false
  );
  assert.equal(
    parse([
      { itemId, codes: [{ code: "A" }] },
      { itemId, codes: [{ code: "B" }] },
    ]).success,
    false
  );
  assert.equal(parse([]).success, false);
  assert.equal(parse([{ itemId, codes: [{ code: " A " }] }]).success, true);
});

function setup(
  t,
  {
    existing = false,
    status = "processing",
    duplicate = false,
    quantity = 1,
    replacement = false,
  } = {}
) {
  const existingId = id();
  const item = {
    _id: id(),
    quantity,
    isWarrantyClaim: replacement,
    product: {
      _id: id(),
      title: "Device",
      warranty: true,
      warrantyInfo: { duration: { quantity: "12", unit: "months" } },
    },
    ...(existing
      ? { warranty: { _id: existingId, warrantyCodes: [{ code: "OLD" }] } }
      : {}),
  };
  if (replacement)
    item.prevWarrantyInformation = {
      startDate: "January 1, 2026",
      endsDate: "January 1, 2027",
      duration: { quantity: "1", unit: "years" },
    };
  const order = {
    _id: id(),
    orderId: "TEST",
    statusHistory: id(),
    status,
    products: [item],
  };
  const session = {
    startTransaction: mock.fn(),
    commitTransaction: mock.fn(),
    abortTransaction: mock.fn(),
    endSession: mock.fn(),
  };
  t.mock.method(mongoose, "startSession", async () => session);
  t.mock.method(Order, "aggregate", () => ({ session: async () => [order] }));
  t.mock.method(Warranty, "findOne", () => ({
    session: async () => (duplicate ? { _id: id() } : null),
  }));
  const createdId = id();
  const create = t.mock.method(Warranty, "create", async () => [
    { _id: createdId },
  ]);
  const update = t.mock.method(Warranty, "updateOne", async () => ({}));
  const link = t.mock.method(Order, "updateOne", async () => ({}));
  const history = t.mock.method(
    OrderStatusHistory,
    "updateOne",
    async () => ({})
  );
  return { order, item, session, create, update, link, history, createdId };
}
const user = { id: id() };
test("create links the new warranty and advances processing status", async (t) => {
  const f = setup(t);
  await WarrantyService.createWarrantyIntoDB(
    f.order._id,
    [{ itemId: f.item._id, codes: [{ code: " SERIAL " }] }],
    user
  );
  assert.equal(
    f.create.mock.calls[0].arguments[0][0].warrantyCodes[0].code,
    "SERIAL"
  );
  assert.equal(
    f.link.mock.calls[0].arguments[1].$set["orderedProducts.$.warranty"],
    f.createdId
  );
  assert.equal(f.history.mock.callCount(), 1);
  assert.equal(f.session.commitTransaction.mock.callCount(), 1);
  assert.equal(f.session.endSession.mock.callCount(), 1);
});
test("editing codes preserves existing warranty dates and delivery status", async (t) => {
  const f = setup(t, { existing: true, status: "on courier" });
  await WarrantyService.updateWarrantyIntoDB(
    f.order._id,
    [{ itemId: f.item._id, codes: [{ code: "NEW" }] }],
    user
  );
  assert.equal(f.create.mock.callCount(), 0);
  assert.deepEqual(f.update.mock.calls[0].arguments[1], {
    $set: { warrantyCodes: [{ code: "NEW" }] },
  });
  assert.equal(f.link.mock.callCount(), 0);
  assert.equal(f.history.mock.callCount(), 0);
});
test("update repairs missing warranty records by creating and linking them", async (t) => {
  const f = setup(t);
  await WarrantyService.updateWarrantyIntoDB(
    f.order._id,
    [{ itemId: f.item._id, codes: [{ code: "NEW" }] }],
    user
  );
  assert.equal(f.create.mock.callCount(), 1);
  assert.equal(
    f.link.mock.calls[0].arguments[1].$set["orderedProducts.$.warranty"],
    f.createdId
  );
});
test("replacement warranty retains its original period", async (t) => {
  const f = setup(t, { replacement: true, status: "warranty processing" });
  await WarrantyService.createWarrantyIntoDB(
    f.order._id,
    [{ itemId: f.item._id, codes: [{ code: "REPLACEMENT" }] }],
    user
  );
  assert.equal(
    f.create.mock.calls[0].arguments[0][0].endsDate,
    "January 1, 2027"
  );
  assert.equal(
    f.create.mock.calls[0].arguments[0][0].startDate,
    "January 1, 2026"
  );
});
test("code reuse from another order aborts and releases the session", async (t) => {
  const f = setup(t, { duplicate: true });
  await assert.rejects(
    WarrantyService.updateWarrantyIntoDB(
      f.order._id,
      [{ itemId: f.item._id, codes: [{ code: "USED" }] }],
      user
    ),
    /already assigned/
  );
  assert.equal(f.create.mock.callCount(), 0);
  assert.equal(f.session.abortTransaction.mock.callCount(), 1);
  assert.equal(f.session.endSession.mock.callCount(), 1);
});
test("wrong quantities and unknown items cannot create orphan warranties", async (t) => {
  const f = setup(t, { quantity: 2 });
  await assert.rejects(
    WarrantyService.updateWarrantyIntoDB(
      f.order._id,
      [{ itemId: f.item._id, codes: [{ code: "ONE" }] }],
      user
    ),
    /2 warranty codes/
  );
  await assert.rejects(
    WarrantyService.updateWarrantyIntoDB(
      f.order._id,
      [{ itemId: id(), codes: [{ code: "ONE" }, { code: "TWO" }] }],
      user
    ),
    /2 warranty codes/
  );
  assert.equal(f.create.mock.callCount(), 0);
});

test('mixed orders save existing codes and link new warranty products together', async (t) => {
  const f = setup(t, { existing: true });
  const second = { ...f.item, _id: id(), warranty: undefined };
  const noWarranty = { ...f.item, _id: id(), warranty: undefined, product: { ...f.item.product, warranty: false } };
  f.order.products.push(second, noWarranty);
  await WarrantyService.updateWarrantyIntoDB(f.order._id, [
    { itemId: f.item._id, codes: [{ code: 'EXISTING' }] },
    { itemId: second._id, codes: [{ code: 'NEW' }] },
  ], user);
  assert.equal(f.update.mock.callCount(), 1);
  assert.equal(f.create.mock.callCount(), 1);
  assert.equal(f.link.mock.calls[0].arguments[0]['orderedProducts._id'], second._id);
});
test('replacement products remain eligible if catalog warranty was disabled', async (t) => {
  const f = setup(t, { replacement: true });
  f.item.product.warranty = false;
  await WarrantyService.createWarrantyIntoDB(f.order._id, [{ itemId: f.item._id, codes: [{ code: 'REPLACEMENT' }] }], user);
  assert.equal(f.create.mock.callCount(), 1);
});
test('invalid product warranty duration aborts before creating a record', async (t) => {
  const f = setup(t);
  f.item.product.warrantyInfo.duration.quantity = '0';
  await assert.rejects(WarrantyService.createWarrantyIntoDB(f.order._id, [{ itemId: f.item._id, codes: [{ code: 'NEW' }] }], user), /Invalid warranty duration/);
  assert.equal(f.create.mock.callCount(), 0);
  assert.equal(f.session.abortTransaction.mock.callCount(), 1);
});
