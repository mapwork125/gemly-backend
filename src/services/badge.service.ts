import mongoose from "mongoose";
import { Badge, UserBadge, IUserBadge } from "../models/Badge.model";
import User from "../models/User.model";
import Deal from "../models/Deal.model";
import Rating from "../models/Rating.model";
import Requirement from "../models/Requirement.model";
import { BADGE_IDS, BADGE_TIER } from "../utils/constants.utility";

// Badge criteria definitions
const BADGE_DEFINITIONS = [
  // Deal-Based Badges
  {
    badgeId: BADGE_IDS.FIRST_DEAL,
    name: "First Deal",
    description: "Complete your first deal",
    icon: "🎯",
    tier: BADGE_TIER.BRONZE,
    criteria: { completedDeals: 1 },
  },
  {
    badgeId: BADGE_IDS.DEAL_MAKER,
    name: "Deal Maker",
    description: "Complete 10 deals",
    icon: "💼",
    tier: BADGE_TIER.SILVER,
    criteria: { completedDeals: 10 },
  },
  {
    badgeId: BADGE_IDS.DEAL_MASTER,
    name: "Deal Master",
    description: "Complete 50 deals",
    icon: "🏅",
    tier: BADGE_TIER.GOLD,
    criteria: { completedDeals: 50 },
  },
  {
    badgeId: BADGE_IDS.DEAL_LEGEND,
    name: "Deal Legend",
    description: "Complete 100+ deals",
    icon: "👑",
    tier: BADGE_TIER.PLATINUM,
    criteria: { completedDeals: 100 },
  },

  // Rating-Based Badges
  {
    badgeId: BADGE_IDS.HIGHLY_RATED,
    name: "Highly Rated",
    description: "Maintain 4.5+ rating",
    icon: "⭐",
    tier: BADGE_TIER.SILVER,
    criteria: { averageRating: 4.5, totalRatings: 10 },
  },
  {
    badgeId: BADGE_IDS.TOP_RATED,
    name: "Top Rated",
    description: "Maintain 4.8+ rating for 3 months",
    icon: "🌟",
    tier: BADGE_TIER.PLATINUM,
    criteria: { averageRating: 4.8, totalRatings: 30 },
  },

  // Volume-Based Badges
  {
    badgeId: BADGE_IDS.SMALL_TRADER,
    name: "Small Trader",
    description: "Complete $50K in deals",
    icon: "💰",
    tier: BADGE_TIER.BRONZE,
    criteria: { totalVolume: 50000 },
  },
  {
    badgeId: BADGE_IDS.MEDIUM_TRADER,
    name: "Medium Trader",
    description: "Complete $250K in deals",
    icon: "💎",
    tier: BADGE_TIER.SILVER,
    criteria: { totalVolume: 250000 },
  },
  {
    badgeId: BADGE_IDS.HIGH_VOLUME,
    name: "High Volume Trader",
    description: "Complete $1M+ in deals",
    icon: "💸",
    tier: BADGE_TIER.GOLD,
    criteria: { totalVolume: 1000000 },
  },
  {
    badgeId: BADGE_IDS.ELITE_TRADER,
    name: "Elite Trader",
    description: "Complete $5M+ in deals",
    icon: "🏆",
    tier: BADGE_TIER.PLATINUM,
    criteria: { totalVolume: 5000000 },
  },

  // Activity-Based Badges
  {
    badgeId: BADGE_IDS.ACTIVE_MEMBER,
    name: "Active Member",
    description: "Post 10+ listings",
    icon: "📝",
    tier: BADGE_TIER.BRONZE,
    criteria: { totalPosts: 10 },
  },
  {
    badgeId: BADGE_IDS.POWER_USER,
    name: "Power User",
    description: "Post 50+ listings",
    icon: "🔥",
    tier: BADGE_TIER.SILVER,
    criteria: { totalPosts: 50 },
  },
  {
    badgeId: BADGE_IDS.SUPER_USER,
    name: "Super User",
    description: "Post 100+ listings",
    icon: "⚡",
    tier: BADGE_TIER.GOLD,
    criteria: { totalPosts: 100 },
  },

  // Special Badges
  {
    badgeId: BADGE_IDS.VERIFIED_BUSINESS,
    name: "Verified Business",
    description: "Business verification completed",
    icon: "✓",
    tier: BADGE_TIER.GOLD,
    criteria: { isVerified: true },
  },
  {
    badgeId: BADGE_IDS.FAST_RESPONDER,
    name: "Fast Responder",
    description: "Average response time < 1 hour",
    icon: "⚡",
    tier: BADGE_TIER.SILVER,
    criteria: { avgResponseTime: 3600, completedDeals: 10 }, // seconds
  },
  {
    badgeId: BADGE_IDS.RELIABLE_SHIPPER,
    name: "Reliable Shipper",
    description: "95%+ on-time delivery rate",
    icon: "📦",
    tier: BADGE_TIER.GOLD,
    criteria: { onTimeDeliveryRate: 95, totalShipments: 20 },
  },
];

class BadgeService {
  /**
   * Initialize badge definitions in database
   */
  async initializeBadges(): Promise<void> {
    try {
      for (const badge of BADGE_DEFINITIONS) {
        await Badge.findOneAndUpdate({ badgeId: badge.badgeId }, badge, {
          upsert: true,
          new: true,
        });
      }
      console.log("✅ Badge definitions initialized");
    } catch (error) {
      console.error("❌ Failed to initialize badges:", error);
      throw error;
    }
  }

  /**
   * Check and award badges for a user
   */
  async checkAndAwardBadges(userId: string): Promise<any[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Calculate user stats
      const stats = await this.calculateUserStats(userObjectId);

      const badgesEarned: any[] = [];

      // Check each badge definition
      for (const badgeDef of BADGE_DEFINITIONS) {
        const progress = this.calculateBadgeProgress(stats, badgeDef.criteria);
        const isEarned = progress.percentage >= 100;

        // Check if user already has this badge
        let userBadge = await UserBadge.findOne({
          userId: userObjectId,
          badgeId: badgeDef.badgeId,
        });

        if (!userBadge) {
          // Create new user badge record
          userBadge = await UserBadge.create({
            userId: userObjectId,
            badgeId: badgeDef.badgeId,
            progress: progress,
            isEarned: isEarned,
            earnedAt: isEarned ? new Date() : undefined,
          });

          if (isEarned) {
            badgesEarned.push({
              badge: badgeDef.badgeId,
              name: badgeDef.name,
              tier: badgeDef.tier,
              earnedAt: userBadge.earnedAt,
              isNew: true,
            });
          }
        } else if (!userBadge.isEarned && isEarned) {
          // User just earned this badge
          userBadge.isEarned = true;
          userBadge.earnedAt = new Date();
          userBadge.progress = progress;
          await userBadge.save();

          badgesEarned.push({
            badge: badgeDef.badgeId,
            name: badgeDef.name,
            tier: badgeDef.tier,
            earnedAt: userBadge.earnedAt,
            isNew: true,
          });
        } else if (!userBadge.isEarned) {
          // Update progress for locked badges
          userBadge.progress = progress;
          await userBadge.save();
        }
      }

      // Update user's badge count
      const earnedCount = await UserBadge.countDocuments({
        userId: userObjectId,
        isEarned: true,
      });

      await User.findByIdAndUpdate(userObjectId, {
        "stats.badgeCount": earnedCount,
      });

      return badgesEarned;
    } catch (error) {
      console.error("❌ Failed to check and award badges:", error);
      throw error;
    }
  }

  /**
   * Calculate user statistics for badge criteria
   */
  private async calculateUserStats(
    userId: mongoose.Types.ObjectId
  ): Promise<any> {
    try {
      // Get completed deals count and volume
      const dealStats = await Deal.aggregate([
        {
          $match: {
            $or: [{ buyer: userId }, { seller: userId }],
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: null,
            completedDeals: { $sum: 1 },
            totalVolume: { $sum: "$agreedPrice" },
          },
        },
      ]);

      // Get rating statistics
      const ratingStats = await Rating.aggregate([
        {
          $match: { userId: userId },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 },
          },
        },
      ]);

      // Get post/listing count (requirements count)
      const postCount = await Requirement.countDocuments({
        user: userId,
      });

      // Get user info
      const user = await User.findById(userId).lean();

      return {
        completedDeals: dealStats[0]?.completedDeals || 0,
        totalVolume: dealStats[0]?.totalVolume || 0,
        averageRating: ratingStats[0]?.averageRating || 0,
        totalRatings: ratingStats[0]?.totalRatings || 0,
        totalPosts: postCount,
        isVerified: user?.isVerified || false,
        type: user?.type,
        avgResponseTime: user?.stats?.avgResponseTime || 0,
        onTimeDeliveryRate: user?.stats?.onTimeDeliveryRate || 0,
        totalShipments: user?.stats?.totalShipments || 0,
      };
    } catch (error) {
      console.error("❌ Failed to calculate user stats:", error);
      throw error;
    }
  }

  /**
   * Calculate badge progress based on criteria
   */
  private calculateBadgeProgress(stats: any, criteria: any): any {
    const progresses: number[] = [];
    let current: any = {};
    let target: any = {};

    for (const [key, targetValue] of Object.entries(criteria)) {
      const currentValue = stats[key] || 0;
      current[key] = currentValue;
      target[key] = targetValue;

      // For boolean criteria (like isVerified)
      if (typeof targetValue === "boolean") {
        const progress = currentValue === targetValue ? 100 : 0;
        progresses.push(progress);
      }
      // For avgResponseTime (lower is better)
      else if (key === "avgResponseTime") {
        if (currentValue === 0) {
          progresses.push(0);
        } else {
          const progress = Math.min(
            ((targetValue as number) / currentValue) * 100,
            100
          );
          progresses.push(progress);
        }
      }
      // For numeric criteria (higher is better)
      else {
        const progress = Math.min(
          (currentValue / (targetValue as number)) * 100,
          100
        );
        progresses.push(progress);
      }
    }

    // Overall progress is the minimum of all criteria (all must be met)
    const overallProgress = progresses.length > 0 ? Math.min(...progresses) : 0;

    return {
      current,
      target,
      percentage: Math.round(overallProgress),
    };
  }

  /**
   * Get all badges for a user (earned and in-progress)
   */
  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Get all badge definitions
      const allBadges = await Badge.find({ isActive: true }).lean();

      // Get user's badge progress
      const userBadges = await UserBadge.find({ userId: userObjectId }).lean();

      // Calculate current stats for progress updates
      const stats = await this.calculateUserStats(userObjectId);

      const result = allBadges.map((badge) => {
        const userBadge = userBadges.find((ub) => ub.badgeId === badge.badgeId);

        if (userBadge && userBadge.isEarned) {
          return {
            badgeId: badge.badgeId,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            tier: badge.tier,
            earnedAt: userBadge.earnedAt,
            progress: null,
          };
        } else {
          // Calculate current progress
          const progress = this.calculateBadgeProgress(stats, badge.criteria);

          return {
            badgeId: badge.badgeId,
            name: badge.name,
            description: `${badge.description} (Progress: ${progress.percentage}%)`,
            icon: badge.icon,
            tier: badge.tier,
            earnedAt: null,
            progress: progress,
          };
        }
      });

      // Sort: earned badges first, then by tier
      return result.sort((a, b) => {
        if (a.earnedAt && !b.earnedAt) return -1;
        if (!a.earnedAt && b.earnedAt) return 1;
        return 0;
      });
    } catch (error) {
      console.error("❌ Failed to get user badges:", error);
      throw error;
    }
  }
}

export default new BadgeService();
