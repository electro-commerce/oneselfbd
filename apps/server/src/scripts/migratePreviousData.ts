import mongoose from "mongoose";
import config from "../app/config/config";
import { consoleLogger } from "../app/utilities/logger";
import { permissionList } from "../app/const/permission.const";
import upazilasData from "../app/utilities/bdAddress/upazilas";

type MigrationOptions = {
  dryRun?: boolean;
};

const parseDurationString = (
  raw: any
): { quantity: string; unit: string } | null => {
  if (!raw) return { quantity: "", unit: "" };
  if (typeof raw === "object" && raw.quantity !== undefined && raw.unit !== undefined) {
    return raw;
  }
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return { quantity: "", unit: "" };

  const match = trimmed.match(/^(\d+)\s*([a-zA-Z]+)$/);
  if (match) {
    return { quantity: match[1], unit: match[2].toLowerCase() };
  }
  return { quantity: trimmed, unit: "years" };
};

export const runMigration = async (options: MigrationOptions = {}): Promise<void> => {
  const isDryRun = !!options.dryRun;
  consoleLogger.info(`🚀 Starting database migration [Mode: ${isDryRun ? "DRY-RUN (Preview)" : "EXECUTE (Live)"}]...`);

  await mongoose.connect(config.DBUrl as string);
  if (!mongoose.connection.db) {
    throw new Error("❌ Database connection is not established.");
  }
  const db = mongoose.connection.db;

  try {
    // ----------------------------------------------------
    // STEP 1: Migrate Orders (productDetails -> orderedProducts, status fix)
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 1: Migrating Orders & Status Histories ---");
    const ordersCol = db.collection("orders");
    const totalOrders = await ordersCol.countDocuments();
    const ordersNeedingProducts = await ordersCol.countDocuments({
      productDetails: { $exists: true },
      $or: [
        { orderedProducts: { $exists: false } },
        { orderedProducts: { $size: 0 } },
      ],
    });
    const ordersWithOnCourier = await ordersCol.countDocuments({ status: "On courier" });

    consoleLogger.info(`Total orders: ${totalOrders}`);
    consoleLogger.info(`Orders needing orderedProducts: ${ordersNeedingProducts}`);
    consoleLogger.info(`Orders with 'On courier' status: ${ordersWithOnCourier}`);

    if (!isDryRun && (ordersNeedingProducts > 0 || ordersWithOnCourier > 0)) {
      consoleLogger.info("Syncing productDetails into orderedProducts (batching)...");

      // Batch process orders to ensure clean transformation of attributes
      const cursor = ordersCol.find({
        $or: [
          {
            productDetails: { $exists: true },
            $or: [
              { orderedProducts: { $exists: false } },
              { orderedProducts: { $size: 0 } },
            ],
          },
          { status: "On courier" },
        ],
      });

      let batch: any[] = [];
      let updatedCount = 0;
      const batchSize = 1000;

      while (await cursor.hasNext()) {
        const order = await cursor.next();
        if (!order) continue;

        const updateFields: any = {};

        // Migrate productDetails -> orderedProducts
        if (order.productDetails && (!order.orderedProducts || order.orderedProducts.length === 0)) {
          updateFields.orderedProducts = order.productDetails.map((item: any) => ({
            ...item,
            attributes: Array.isArray(item.attributes) ? {} : (item.attributes || {}),
          }));
        }

        // Normalize status
        if (order.status === "On courier") {
          updateFields.status = "on courier";
        }

        if (Object.keys(updateFields).length > 0) {
          batch.push({
            updateOne: {
              filter: { _id: order._id },
              update: { $set: updateFields },
            },
          });
        }

        if (batch.length >= batchSize) {
          await ordersCol.bulkWrite(batch, { ordered: false });
          updatedCount += batch.length;
          consoleLogger.info(`  Updated ${updatedCount} orders...`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await ordersCol.bulkWrite(batch, { ordered: false });
        updatedCount += batch.length;
      }
      consoleLogger.info(`✅ Successfully updated ${updatedCount} orders.`);
    }

    // Step 1b: orderstatushistories
    const statusHistoriesCol = db.collection("orderstatushistories");
    const historiesWithOnCourier = await statusHistoriesCol.countDocuments({
      "history.status": "On courier",
    });
    consoleLogger.info(`Order status histories with 'On courier': ${historiesWithOnCourier}`);

    if (!isDryRun && historiesWithOnCourier > 0) {
      const res = await statusHistoriesCol.updateMany(
        { "history.status": "On courier" },
        { $set: { "history.$[elem].status": "on courier" } },
        { arrayFilters: [{ "elem.status": "On courier" }] }
      );
      consoleLogger.info(`✅ Updated ${res.modifiedCount} order status histories.`);
    }

    // ----------------------------------------------------
    // STEP 2: Categories & Subcategories
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 2: Migrating Categories & Subcategories ---");
    const categoriesCol = db.collection("categories");
    const subcategoriesCol = db.collection("subcategories");

    const existingSubcats = await subcategoriesCol.find().toArray();
    for (const sub of existingSubcats) {
      const existsInCat = await categoriesCol.findOne({ _id: sub._id });
      if (!existsInCat) {
        consoleLogger.info(`Subcategory '${sub.name}' (_id: ${sub._id}) not in categories.`);
        if (!isDryRun) {
          await categoriesCol.insertOne({
            _id: sub._id,
            name: sub.name,
            slug: sub.slug,
            image: sub.image,
            parent: sub.category,
            level: 1,
            sortOrder: 0,
            isActive: !sub.isDeleted,
            createdBy: sub.createdBy,
            isDeleted: !!sub.isDeleted,
            createdAt: sub.createdAt || new Date(),
            updatedAt: sub.updatedAt || new Date(),
          });
          consoleLogger.info(`✅ Inserted subcategory '${sub.name}' into categories.`);
        }
      } else {
        consoleLogger.info(`ℹ️ Subcategory '${sub.name}' already present in categories.`);
      }
    }

    // ----------------------------------------------------
    // STEP 3: Products (Categories, Type, Variations, Warranty)
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 3: Migrating Products ---");
    const productsCol = db.collection("products");
    const variationsCol = db.collection("variations");
    const pricesCol = db.collection("prices");
    const inventoriesCol = db.collection("inventories");
    const allProducts = await productsCol.find().toArray();

    for (const product of allProducts) {
      const updates: any = {};

      // 3a. Category format: { name: ObjectId, subCategory?: ObjectId } -> [ObjectId, ObjectId]
      if (product.category && !Array.isArray(product.category)) {
        const catArray: mongoose.Types.ObjectId[] = [];
        if (product.category.name) catArray.push(new mongoose.Types.ObjectId(product.category.name));
        if (product.category.subCategory) catArray.push(new mongoose.Types.ObjectId(product.category.subCategory));
        updates.category = catArray;
      }

      // 3b. Embedded variations extraction
      if (product.variations && product.variations.length > 0) {
        const firstVar = product.variations[0];
        const isEmbedded = typeof firstVar === "object" && firstVar !== null && !(firstVar instanceof mongoose.Types.ObjectId) && firstVar.attributes;

        if (isEmbedded) {
          consoleLogger.info(`Product '${product.title}' has ${product.variations.length} embedded variations. Extracting...`);
          const extractedIds: mongoose.Types.ObjectId[] = [];

          for (let i = 0; i < product.variations.length; i++) {
            const v = product.variations[i];
            const vId = v._id ? new mongoose.Types.ObjectId(v._id) : new mongoose.Types.ObjectId();
            extractedIds.push(vId);

            if (!isDryRun) {
              let priceId = v.price;
              if (v.price && typeof v.price === "object" && !(v.price instanceof mongoose.Types.ObjectId)) {
                const pRes = await pricesCol.insertOne({
                  regularPrice: Number(v.price.regularPrice) || 0,
                  salePrice: Number(v.price.salePrice) || 0,
                  discountPercent: Number(v.price.discountPercent) || 0,
                  priceSave: Number(v.price.priceSave) || 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                priceId = pRes.insertedId;
              }

              let invId = v.inventory;
              if (v.inventory && typeof v.inventory === "object" && !(v.inventory instanceof mongoose.Types.ObjectId)) {
                const rawStatus = (v.inventory.stockStatus || "").toLowerCase();
                let status = "in_stock";
                if (rawStatus.includes("out")) status = "out_of_stock";
                else if (rawStatus.includes("low")) status = "low_stock";

                const invDoc: any = {
                  stockStatus: status,
                  stockQuantity: Number(v.inventory.stockQuantity) || 0,
                  stockAvailable: Number(v.inventory.stockAvailable) || 0,
                  manageStock: Boolean(v.inventory.manageStock),
                  lowStockWarning: Number(v.inventory.lowStockWarning) || 0,
                  hideStock: Boolean(v.inventory.hideStock),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                if (v.inventory.sku && typeof v.inventory.sku === "string" && v.inventory.sku.trim()) {
                  invDoc.sku = v.inventory.sku.trim();
                }
                const iRes = await inventoriesCol.insertOne(invDoc);
                invId = iRes.insertedId;
              }

              await variationsCol.updateOne(
                { _id: vId },
                {
                  $set: {
                    productId: product.id,
                    serial: i + 1,
                    attributes: v.attributes || {},
                    price: priceId,
                    inventory: invId,
                    isDeleted: false,
                    updatedAt: new Date(),
                  },
                  $setOnInsert: {
                    createdAt: new Date(),
                  },
                },
                { upsert: true }
              );
            }
          }
          updates.variations = extractedIds;
        }
      }

      // 3c. Product Type
      const hasVariations = (updates.variations ? updates.variations.length : (product.variations?.length || 0)) > 0;
      const expectedType = hasVariations ? "variable" : "simple";
      if (product.type !== expectedType) {
        updates.type = expectedType;
      }

      // 3d. Warranty duration format
      if (product.warrantyInfo && typeof product.warrantyInfo.duration === "string") {
        const parsed = parseDurationString(product.warrantyInfo.duration);
        if (parsed) {
          updates["warrantyInfo.duration"] = parsed;
        }
      }

      // 3e. Published status normalization (string enum: "published" | "draft" | "private")
      if (product.publishedStatus && typeof product.publishedStatus === "object") {
        const statusVal = (product.publishedStatus.status || "").toLowerCase();
        updates.publishedStatus = statusVal === "draft" ? "draft" : "published";
      }

      if (Object.keys(updates).length > 0) {
        consoleLogger.info(`Updating Product '${product.title}' (${product.id}): ${Object.keys(updates).join(", ")}`);
        if (!isDryRun) {
          await productsCol.updateOne({ _id: product._id }, { $set: updates });
        }
      }
    }

    // 3f. Ensure all variations in collection have valid Price and Inventory ObjectIds
    const unlinkedVariations = await variationsCol.find({
      $or: [
        { price: { $type: "object" } },
        { inventory: { $type: "object" } },
      ],
    }).toArray();

    if (unlinkedVariations.length > 0) {
      consoleLogger.info(`Found ${unlinkedVariations.length} variations with object price/inventory.`);
      for (const v of unlinkedVariations) {
        const vUpdates: any = {};
        if (v.price && typeof v.price === "object" && !(v.price instanceof mongoose.Types.ObjectId)) {
          if (!isDryRun) {
            const pRes = await pricesCol.insertOne({
              regularPrice: Number(v.price.regularPrice) || 0,
              salePrice: Number(v.price.salePrice) || 0,
              discountPercent: Number(v.price.discountPercent) || 0,
              priceSave: Number(v.price.priceSave) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            vUpdates.price = pRes.insertedId;
          }
        }
        if (v.inventory && typeof v.inventory === "object" && !(v.inventory instanceof mongoose.Types.ObjectId)) {
          if (!isDryRun) {
            const rawStatus = (v.inventory.stockStatus || "").toLowerCase();
            let status = "in_stock";
            if (rawStatus.includes("out")) status = "out_of_stock";
            else if (rawStatus.includes("low")) status = "low_stock";

            const invDoc: any = {
              stockStatus: status,
              stockQuantity: Number(v.inventory.stockQuantity) || 0,
              stockAvailable: Number(v.inventory.stockAvailable) || 0,
              manageStock: Boolean(v.inventory.manageStock),
              lowStockWarning: Number(v.inventory.lowStockWarning) || 0,
              hideStock: Boolean(v.inventory.hideStock),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            if (v.inventory.sku && typeof v.inventory.sku === "string" && v.inventory.sku.trim()) {
              invDoc.sku = v.inventory.sku.trim();
            }
            const iRes = await inventoriesCol.insertOne(invDoc);
            vUpdates.inventory = iRes.insertedId;
          }
        }
        if (Object.keys(vUpdates).length > 0 && !isDryRun) {
          await variationsCol.updateOne({ _id: v._id }, { $set: vUpdates });
        }
      }
    }
    consoleLogger.info("✅ Products migration completed.");

    // ----------------------------------------------------
    // STEP 4: Warranties Duration
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 4: Migrating Warranties ---");
    const warrantiesCol = db.collection("warranties");
    const warrantiesWithStringDuration = await warrantiesCol.countDocuments({
      duration: { $type: "string" },
    });
    consoleLogger.info(`Warranties with string duration: ${warrantiesWithStringDuration}`);

    if (!isDryRun && warrantiesWithStringDuration > 0) {
      const cursor = warrantiesCol.find({ duration: { $type: "string" } });
      let batch: any[] = [];
      let updatedWarranties = 0;

      while (await cursor.hasNext()) {
        const w = await cursor.next();
        if (!w) continue;

        const parsed = parseDurationString(w.duration);
        if (parsed) {
          batch.push({
            updateOne: {
              filter: { _id: w._id },
              update: { $set: { duration: parsed } },
            },
          });
        }

        if (batch.length >= 1000) {
          await warrantiesCol.bulkWrite(batch, { ordered: false });
          updatedWarranties += batch.length;
          consoleLogger.info(`  Updated ${updatedWarranties} warranties...`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await warrantiesCol.bulkWrite(batch, { ordered: false });
        updatedWarranties += batch.length;
      }
      consoleLogger.info(`✅ Successfully updated ${updatedWarranties} warranties.`);
    }

    // ----------------------------------------------------
    // STEP 5: Warranty Claims Duration
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 5: Migrating Warranty Claims ---");
    const claimsCol = db.collection("warrantyclaims");
    const claimsWithStringDuration = await claimsCol.find({
      "warrantyClaimReqData.prevWarrantyInformation.duration": { $type: "string" },
    }).toArray();

    consoleLogger.info(`Warranty claims needing duration fix: ${claimsWithStringDuration.length}`);
    if (!isDryRun && claimsWithStringDuration.length > 0) {
      for (const claim of claimsWithStringDuration) {
        const updatedReqData = (claim.warrantyClaimReqData || []).map((req: any) => {
          if (req.prevWarrantyInformation && typeof req.prevWarrantyInformation.duration === "string") {
            return {
              ...req,
              prevWarrantyInformation: {
                ...req.prevWarrantyInformation,
                duration: parseDurationString(req.prevWarrantyInformation.duration),
              },
            };
          }
          return req;
        });

        await claimsCol.updateOne(
          { _id: claim._id },
          { $set: { warrantyClaimReqData: updatedReqData } }
        );
      }
      consoleLogger.info(`✅ Updated ${claimsWithStringDuration.length} warranty claims.`);
    }

    // ----------------------------------------------------
    // STEP 6: Couriers (Steadfast credentials, slug, and defaults)
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 6: Aligning Couriers ---");
    const couriersCol = db.collection("couriers");
    const existingSteadfast = await couriersCol.findOne({
      $or: [{ slug: "steedfast" }, { slug: "steadfast" }, { name: "Steed fast" }],
    });

    if (existingSteadfast) {
      consoleLogger.info(`Found existing Steadfast courier (_id: ${existingSteadfast._id})`);
      const needsUpdate =
        existingSteadfast.slug !== "steadfast" ||
        existingSteadfast.name !== "Steadfast" ||
        Array.isArray(existingSteadfast.credentials?.[0]);

      if (needsUpdate) {
        let creds: any[] = [];
        if (Array.isArray(existingSteadfast.credentials)) {
          for (const item of existingSteadfast.credentials) {
            if (Array.isArray(item)) {
              creds.push({ key: item[0], value: item[1] });
            } else if (typeof item === "object" && item.key) {
              creds.push(item);
            }
          }
        }

        if (creds.length === 0) {
          creds = [
            { key: "Api-Key", value: "r1jtbfwv9z9rtlpo3ivvd6zzaa9rmviv" },
            { key: "Secret-Key", value: "axk4xwjnrbjiocq72hjpuzfq" },
          ];
        }

        const updates: any = {
          name: "Steadfast",
          slug: "steadfast",
          credentials: creds,
          thumb: existingSteadfast.thumb || existingSteadfast.image,
          isActive: true,
        };

        consoleLogger.info(`Updating Steadfast courier with slug='steadfast' and object credentials.`);
        if (!isDryRun) {
          await couriersCol.updateOne({ _id: existingSteadfast._id }, { $set: updates });
        }
      } else {
        consoleLogger.info("ℹ️ Steadfast courier is already correctly formatted.");
      }
    }

    // Ensure default couriers are present
    const defaultCouriers = [
      {
        name: "Pathao",
        slug: "pathao",
        credentials: [
          { key: "client_id", value: "" },
          { key: "client_secret", value: "" },
          { key: "username", value: "" },
          { key: "password", value: "", need_to_hash: true },
          { key: "access_token", value: "", is_optional: true },
          { key: "access_token_expires_in", value: "", is_optional: true },
        ],
        isActive: false,
      },
      {
        name: "Redx",
        slug: "redx",
        credentials: [{ key: "API-ACCESS-TOKEN", value: "" }],
        isActive: false,
      },
      {
        name: "Paperfly",
        slug: "paperfly",
        credentials: [
          { key: "username", value: "" },
          { key: "password", value: "", need_to_hash: false },
          { key: "paperflykey", value: "" },
        ],
        isActive: false,
      },
    ];

    for (const courier of defaultCouriers) {
      const exists = await couriersCol.findOne({ slug: courier.slug });
      if (!exists) {
        consoleLogger.info(`Courier ${courier.name} does not exist. Adding...`);
        if (!isDryRun) {
          await couriersCol.insertOne({
            ...courier,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // ----------------------------------------------------
    // STEP 7: Permissions Alignment
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 7: Aligning Permissions ---");
    const permissionsCol = db.collection("permissions");
    const nameMap: Record<string, string> = {
      "manage shipping charges": "manageShippingCharge",
      "manage sms": "manageSms",
      "manage customers": "manageCustomer",
      "manage product": "manageProduct",
      "manage coupon": "manageCoupon",
      "manage warranty claim": "manageWarrantyClaim",
      "manage orders": "manageOrder",
      "super admin": "superAdmin",
      "manage courier": "manageCourier",
      "manage admin or staff": "manageAdminOrStaff",
      "manage permission": "managePermission",
    };

    for (const [oldName, newName] of Object.entries(nameMap)) {
      const existingOld = await permissionsCol.findOne({ name: oldName });
      if (!existingOld) continue;

      const existingNew = await permissionsCol.findOne({ name: newName });
      if (existingNew) {
        consoleLogger.info(`Target permission '${newName}' already exists (_id: ${existingNew._id}). Merging from '${oldName}' (_id: ${existingOld._id})...`);
        if (!isDryRun) {
          await db.collection("users").updateMany(
            { permissions: existingOld._id },
            { $addToSet: { permissions: existingNew._id } as any }
          );
          await db.collection("users").updateMany(
            { permissions: existingOld._id },
            { $pull: { permissions: existingOld._id as any } as any }
          );
          await permissionsCol.deleteOne({ _id: existingOld._id });
          consoleLogger.info(`✅ Merged users and removed obsolete permission '${oldName}'.`);
        }
      } else {
        consoleLogger.info(`Renaming permission '${oldName}' -> '${newName}' (_id: ${existingOld._id})`);
        if (!isDryRun) {
          await permissionsCol.updateOne({ _id: existingOld._id }, { $set: { name: newName } });
        }
      }
    }

    // Insert any missing permissions from permissionList
    const currentPermissions = await permissionsCol.find().toArray();
    const currentNames = new Set(
      currentPermissions.map((p) => (nameMap[p.name] ? nameMap[p.name] : p.name))
    );

    for (const permName of permissionList) {
      if (!currentNames.has(permName)) {
        consoleLogger.info(`Inserting missing permission '${permName}'...`);
        if (!isDryRun) {
          await permissionsCol.insertOne({
            name: permName,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
    consoleLogger.info("✅ Permissions aligned successfully.");

    // ----------------------------------------------------
    // STEP 8: Banner Sliders (slidersections -> bannersliders)
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 8: Banner Sliders Synchronization ---");
    const slidersectionsCol = db.collection("slidersections");
    const bannerslidersCol = db.collection("bannersliders");

    const sliders = await slidersectionsCol.find().toArray();
    consoleLogger.info(`Found ${sliders.length} sliders in slidersections.`);

    if (sliders.length > 0) {
      for (const slider of sliders) {
        const exists = await bannerslidersCol.findOne({ _id: slider._id });
        if (!exists) {
          consoleLogger.info(`Copying slider '${slider.name}' (_id: ${slider._id}) to bannersliders.`);
          if (!isDryRun) {
            await bannerslidersCol.insertOne({
              ...slider,
              sortOrder: slider.sortOrder || 0,
            });
          }
        }
      }
      consoleLogger.info("✅ Banner sliders synced.");
    }

    // ----------------------------------------------------
    // STEP 9: Upazilas Seeding
    // ----------------------------------------------------
    consoleLogger.info("\n--- STEP 9: Upazilas Verification ---");
    const upazilasCol = db.collection("upazilas");
    const upazilaCount = await upazilasCol.countDocuments();
    consoleLogger.info(`Current upazilas in DB: ${upazilaCount}`);

    if (upazilaCount === 0 && Array.isArray(upazilasData) && upazilasData.length > 0) {
      consoleLogger.info(`Seeding ${upazilasData.length} upazilas into upazilas collection...`);
      if (!isDryRun) {
        await upazilasCol.insertMany(
          upazilasData.map((u) => ({
            ...u,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
        consoleLogger.info(`✅ Seeded ${upazilasData.length} upazilas successfully.`);
      }
    } else {
      consoleLogger.info("ℹ️ Upazilas collection already populated or static data not found.");
    }

    consoleLogger.info(`\n🎉 All migration checks completed successfully [Mode: ${isDryRun ? "DRY-RUN" : "EXECUTE"}]!`);
  } catch (error) {
    consoleLogger.error("❌ Migration failed with error:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Auto-run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  runMigration({ dryRun })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigration;
