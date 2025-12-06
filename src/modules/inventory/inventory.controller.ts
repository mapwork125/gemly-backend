import { asyncHandler } from "../../utils/asyncHandler.utility";
import { fail, success } from "../../utils/response.utility";
import Inventory from "../../models/Inventory.model";
import InventoryAuditLog from "../../models/InventoryAuditLog.model";
import {
  generateBarcode,
  generateInventoryId,
} from "../../utils/barcode.utility";

// Status transition validation
const VALID_TRANSITIONS: Record<string, string[]> = {
  IN_LOCKER: [
    "ON_MEMO",
    "SOLD",
    "IN_REPAIR",
    "IN_TRANSIT",
    "RESERVED",
    "PENDING_CERTIFICATION",
  ],
  ON_MEMO: ["RETURNED", "SOLD", "IN_LOCKER"],
  RETURNED: ["IN_LOCKER"],
  IN_REPAIR: ["IN_LOCKER"],
  IN_TRANSIT: ["IN_LOCKER"],
  RESERVED: ["IN_LOCKER", "SOLD"],
  PENDING_CERTIFICATION: ["IN_LOCKER"],
  SOLD: [], // Final state
};

function validateStatusTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

// Create inventory item
export const create = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Generate unique inventory ID
  const inventoryId = await generateInventoryId();

  // Generate barcode (remove hyphens for cleaner barcode)
  const barcodeText = inventoryId.replace(/-/g, "");
  const barcodeImage = await generateBarcode(inventoryId);

  // Create inventory item
  const item = await Inventory.create({
    inventoryId,
    barcode: barcodeText,
    barcodeImage,
    ...req.body,
    userId,
    createdBy: userId, // For backward compatibility
  });

  // Audit log
  await InventoryAuditLog.create({
    inventoryId: item._id,
    userId,
    action: "ITEM_CREATED",
    newValue: {
      inventoryId: item.inventoryId,
      status: item.status,
      location: item.location,
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return success(
    res,
    "Inventory item added successfully",
    {
      inventoryId: item.inventoryId,
      itemId: item._id,
      barcode: item.barcode,
      barcodeImage: item.barcodeImage,
      status: item.status,
      createdAt: item.createdAt,
    },
    201
  );
});

// List inventory with filtering and pagination
export const index = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 50,
    status,
    minCarat,
    maxCarat,
    color,
    cut,
    clarity,
    shape,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter
  const filter: any = {
    userId,
    deletedAt: null, // Exclude soft-deleted items
  };

  if (status) {
    filter.status = status;
  }

  if (minCarat || maxCarat) {
    filter["diamondDetails.carat"] = {};
    if (minCarat)
      filter["diamondDetails.carat"].$gte = parseFloat(minCarat as string);
    if (maxCarat)
      filter["diamondDetails.carat"].$lte = parseFloat(maxCarat as string);
  }

  if (color) {
    const colors = (color as string).split(",");
    filter["diamondDetails.color"] = { $in: colors };
  }

  if (cut) {
    const cuts = (cut as string).split(",");
    filter["diamondDetails.cut"] = { $in: cuts };
  }

  if (clarity) {
    const clarities = (clarity as string).split(",");
    filter["diamondDetails.clarity"] = { $in: clarities };
  }

  if (shape) {
    const shapes = (shape as string).split(",");
    filter["diamondDetails.shape"] = { $in: shapes };
  }

  if (search) {
    filter.$or = [
      { inventoryId: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      {
        "diamondDetails.certificateNumber": { $regex: search, $options: "i" },
      },
    ];
  }

  // Pagination
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const limitNum = Math.min(parseInt(limit as string), 100); // Max 100

  // Sort
  const sort: any = {};
  if (sortBy === "carat") {
    sort["diamondDetails.carat"] = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "costPrice") {
    sort["pricing.costPrice"] = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "sellingPrice") {
    sort["pricing.sellingPrice"] = sortOrder === "asc" ? 1 : -1;
  } else {
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;
  }

  // Fetch items
  const items = await Inventory.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Calculate metrics
  const itemsWithMetrics = items.map((item: any) => {
    const profit = item.pricing.sellingPrice - item.pricing.costPrice;
    const profitMargin = (profit / item.pricing.costPrice) * 100;
    const daysInInventory = Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...item,
      pricing: {
        ...item.pricing,
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
      },
      daysInInventory,
    };
  });

  // Total count
  const total = await Inventory.countDocuments(filter);

  // Summary - status breakdown and total value
  const allItems = await Inventory.find({
    userId,
    deletedAt: null,
  })
    .select("status pricing.costPrice")
    .lean();

  const statusBreakdown = allItems.reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const totalValue = allItems.reduce(
    (sum: number, item: any) => sum + (item.pricing?.costPrice || 0),
    0
  );

  return success(res, "Inventory list retrieved", {
    items: itemsWithMetrics,
    pagination: {
      page: parseInt(page as string),
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + limitNum < total,
    },
    summary: {
      totalItems: allItems.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      byStatus: statusBreakdown,
    },
  });
});

// Update inventory item
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  // Find item (support both _id and inventoryId)
  const item = await Inventory.findOne({
    $or: [{ _id: id }, { inventoryId: id }, { barcode: id }],
    userId,
    deletedAt: null,
  });

  if (!item) {
    return fail(res, "Inventory item not found or unauthorized", 404);
  }

  // Validate status transition if status is being updated
  const oldStatus = item.status;
  if (updates.status && updates.status !== item.status) {
    const validTransition = validateStatusTransition(
      item.status,
      updates.status
    );
    if (!validTransition) {
      return fail(
        res,
        `Invalid status transition from ${item.status} to ${updates.status}`,
        409
      );
    }

    // If marking as SOLD, require soldAt and soldTo
    if (updates.status === "SOLD") {
      if (!updates.soldAt || !updates.soldTo) {
        return fail(
          res,
          "soldAt and soldTo are required when marking item as SOLD",
          400
        );
      }
    }

    // Audit log for status change
    await InventoryAuditLog.create({
      inventoryId: item._id,
      userId,
      action: "STATUS_CHANGED",
      oldValue: { status: oldStatus },
      newValue: { status: updates.status },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  }

  // Handle photos (append to existing, don't replace)
  if (updates.photos) {
    const existingPhotos = item.photos || [];
    updates.photos = [...existingPhotos, ...updates.photos].slice(0, 10); // Max 10
  }

  // Handle nested updates (merge with existing)
  if (updates.diamondDetails) {
    updates.diamondDetails = {
      ...item.diamondDetails,
      ...updates.diamondDetails,
    };
  }

  if (updates.pricing) {
    updates.pricing = {
      ...item.pricing,
      ...updates.pricing,
    };
  }

  // Apply updates
  Object.assign(item, updates);
  item.updatedAt = new Date();
  await item.save();

  // Audit log for general update
  if (Object.keys(updates).length > 0) {
    await InventoryAuditLog.create({
      inventoryId: item._id,
      userId,
      action: "ITEM_UPDATED",
      newValue: updates,
      metadata: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  }

  return success(res, "Inventory item updated successfully", {
    inventoryId: item.inventoryId,
    itemId: item._id,
    status: item.status,
    updatedFields: Object.keys(updates),
    updatedAt: item.updatedAt,
  });
});

// Soft delete inventory item
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { reason, notes } = req.body;

  // Find item
  const item = await Inventory.findOne({
    $or: [{ _id: id }, { inventoryId: id }, { barcode: id }],
    userId,
    deletedAt: null,
  });

  if (!item) {
    return fail(res, "Inventory item not found or unauthorized", 404);
  }

  // Check if can be deleted
  if (item.status === "SOLD") {
    return fail(
      res,
      "Cannot delete sold item - it is part of transaction history",
      409
    );
  }

  if (item.status === "ON_MEMO") {
    return fail(
      res,
      "Cannot delete item on memo - please return item to inventory first",
      409
    );
  }

  // Soft delete
  item.deletedAt = new Date();
  item.deletedBy = userId;
  item.deletionReason = reason;
  item.deletionNotes = notes;
  await item.save();

  // Audit log
  await InventoryAuditLog.create({
    inventoryId: item._id,
    userId,
    action: "ITEM_DELETED",
    oldValue: { status: item.status },
    metadata: { reason, notes },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return success(res, "Inventory item deleted successfully", {
    inventoryId: item.inventoryId,
    itemId: item._id,
    deletedAt: item.deletedAt,
    deletedBy: item.deletedBy,
  });
});

// Quick status update (for mobile barcode scanning)
export const quickStatusUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { status, location } = req.body;

  // Find item (can search by inventoryId or barcode)
  const item = await Inventory.findOne({
    $or: [{ inventoryId: id }, { barcode: id }],
    userId,
    deletedAt: null,
  });

  if (!item) {
    return fail(res, "Item not found", 404);
  }

  // Validate status transition
  const validTransition = validateStatusTransition(item.status, status);
  if (!validTransition) {
    return fail(
      res,
      `Invalid status transition from ${item.status} to ${status}`,
      409
    );
  }

  // Quick update
  const oldStatus = item.status;
  item.status = status;
  if (location) item.location = location;
  item.updatedAt = new Date();
  await item.save();

  // Audit log
  await InventoryAuditLog.create({
    inventoryId: item._id,
    userId,
    action: "QUICK_STATUS_UPDATE",
    oldValue: { status: oldStatus },
    newValue: { status, location },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    scannedVia: "MOBILE_BARCODE",
  });

  return success(res, "Status updated successfully", {
    inventoryId: item.inventoryId,
    barcode: item.barcode,
    oldStatus,
    newStatus: item.status,
    location: item.location,
    updatedAt: item.updatedAt,
  });
});
