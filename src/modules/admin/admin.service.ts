import User from "../../models/User.model";
import AdminLog from "../../models/AdminLog.model";
import notificationService from "../../services/notification.service";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  RESPONSE_MESSAGES,
  USER_STATUS,
} from "../../utils/constants.utility";
import mongoose from "mongoose";

class AdminService {
  /**
   * List users with pagination, filtering, and search
   */
  async listUsers(query: any = {}) {
    const {
      page = 1,
      limit = 50,
      status,
      userType,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Build filter
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (userType) {
      filter.userType = userType;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch users
    const users = await User.find(filter)
      .select("-password")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Total count
    const total = await User.countDocuments(filter);

    // Summary by status
    const summary = await User.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryObj = summary.reduce(
      (acc: any, item: any) => {
        acc[item._id.toLowerCase().replace(/_/g, "")] = item.count;
        return acc;
      },
      { total }
    );

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: summaryObj,
    };
  }

  /**
   * Approve, reject, or suspend user
   */
  async actionUser(userId: string, body: any, adminId: string) {
    const { action, rejectionReason, suspensionReason } = body;

    // Map action to USER_STATUS
    const statusMap: Record<string, string> = {
      APPROVE: USER_STATUS.APPROVED,
      REJECT: USER_STATUS.REJECTED,
      SUSPEND: USER_STATUS.SUSPENDED,
    };

    const userStatus = statusMap[action];

    const user: any = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Update user status
    user.status = userStatus;

    if (userStatus === USER_STATUS.REJECTED && rejectionReason) {
      user.rejectionReason = rejectionReason;
    }

    if (userStatus === USER_STATUS.SUSPENDED && suspensionReason) {
      user.suspensionReason = suspensionReason;
    }

    if (userStatus === USER_STATUS.APPROVED) {
      user.isVerified = true;
    }

    await user.save();

    // Send notification to user
    let notificationMessage = RESPONSE_MESSAGES[userStatus];
    if (userStatus === USER_STATUS.REJECTED && rejectionReason) {
      notificationMessage = `Your account was rejected: ${rejectionReason}`;
    } else if (userStatus === USER_STATUS.SUSPENDED && suspensionReason) {
      notificationMessage = `Your account has been suspended: ${suspensionReason}`;
    }

    try {
      await notificationService.sendNotification(user._id.toString(), {
        title: `Account ${action}D`,
        message: notificationMessage,
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: { userId: user._id.toString() },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Log admin action
    await AdminLog.create({
      adminId: new mongoose.Types.ObjectId(adminId),
      action: `USER_${action}` as any,
      resourceType: "USER",
      resourceId: user._id,
      details: { rejectionReason, suspensionReason },
      timestamp: new Date(),
    });

    return user;
  }
}

export default new AdminService();
