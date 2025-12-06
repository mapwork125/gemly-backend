import User, { INotificationSettings } from "../models/User.model";
import notificationService from "./notification.service";
import notificationQueueService from "./notificationQueue.service";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
} from "../utils/constants.utility";

interface MatchResult {
  userId: string;
  score: number;
  matched: boolean;
  reasons: string[];
}

class RequirementMatchingService {
  /**
   * Main matching algorithm - triggers when a new requirement is created
   */
  async matchRequirementToUsers(requirement: any): Promise<number> {
    console.log(
      `[MATCHING] Starting match for requirement: ${requirement._id}`
    );

    // Get all users with notifications enabled
    const users: any[] = await User.find({
      "notificationSettings.enabled": true,
      _id: { $ne: requirement.userId }, // Exclude requirement creator
    })
      .select("_id notificationSettings fcmToken")
      .lean();

    if (users.length === 0) {
      console.log("[MATCHING] No users with notifications enabled");
      return 0;
    }

    const matchResults: MatchResult[] = [];

    // Calculate match score for each user
    for (const user of users) {
      const settings = user.notificationSettings as INotificationSettings;
      const matchResult = this.calculateMatchScore(requirement, settings);

      if (matchResult.matched) {
        matchResults.push({
          userId: user._id.toString(),
          score: matchResult.score,
          matched: true,
          reasons: matchResult.reasons,
        });
      }
    }

    // Sort by score (highest first)
    matchResults.sort((a, b) => b.score - a.score);

    console.log(
      `[MATCHING] Found ${matchResults.length} matching users out of ${users.length} total`
    );

    // Send notifications to matched users
    const notificationsSent = await this.sendMatchNotifications(
      matchResults,
      requirement,
      users
    );

    return notificationsSent;
  }

  /**
   * Calculate match score (0-100 points)
   */
  private calculateMatchScore(
    requirement: any,
    settings: INotificationSettings
  ): { score: number; matched: boolean; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const details = requirement.details;

    // REQUIRED: Diamond type match (+20 points)
    if (!this.matchDiamondType(details.diamondType, settings.diamondTypes)) {
      return { score: 0, matched: false, reasons: ["Diamond type mismatch"] };
    }
    score += 20;
    reasons.push("Diamond type match");

    // Lab-grown method (+5 points)
    if (
      details.labGrownMethod &&
      settings.labGrownMethods?.includes(details.labGrownMethod)
    ) {
      score += 5;
      reasons.push("Lab-grown method match");
    }

    // Treatment preference (+10 points)
    if (
      this.matchTreatment(
        details.treatmentStatus,
        settings.treatmentPreferences
      )
    ) {
      score += 10;
      reasons.push("Treatment preference match");
    }

    // Shape match (+15 points)
    if (this.matchShapes(details.shapes, settings.shapes)) {
      score += 15;
      reasons.push("Shape match");
    }

    // Carat range overlap (+15 points)
    if (this.matchCaratRange(details, settings.caratRanges)) {
      score += 15;
      reasons.push("Carat range overlap");
    }

    // Color grade overlap (+10 points)
    if (this.matchColorGrades(details, settings)) {
      score += 10;
      reasons.push("Color grade match");
    }

    // Clarity grade overlap (+10 points)
    if (
      this.matchClarityGrades(details.clarityGrades, settings.clarityGrades)
    ) {
      score += 10;
      reasons.push("Clarity grade match");
    }

    // Certification match (+10 points)
    if (this.matchCertification(details, settings.certificationFilter)) {
      score += 10;
      reasons.push("Certification match");
    }

    // Budget range overlap (+15 points)
    if (this.matchBudgetRange(details, settings.budgetRanges)) {
      score += 15;
      reasons.push("Budget range overlap");
    }

    // Geographic match (+5 points)
    if (this.matchGeographic(details, settings.geographicPreferences)) {
      score += 5;
      reasons.push("Geographic match");
    }

    // Apply filters (can disqualify user)
    const filterResults = this.applyFilters(requirement, settings);
    if (!filterResults.passed) {
      return {
        score,
        matched: false,
        reasons: [...reasons, ...filterResults.failures],
      };
    }

    // User matches if score >= 50
    const matched = score >= 50;

    return { score, matched, reasons };
  }

  /**
   * Diamond type matching (REQUIRED)
   */
  private matchDiamondType(
    requirementType: string,
    userTypes: string[]
  ): boolean {
    if (!userTypes || userTypes.length === 0) return true; // No preference
    return userTypes.includes(requirementType);
  }

  /**
   * Treatment matching
   */
  private matchTreatment(requirementTreatment: any, userPrefs: any): boolean {
    if (!userPrefs) return true;

    if (userPrefs.acceptAny) return true;

    if (requirementTreatment === "UNTREATED" && userPrefs.acceptUntreated) {
      return true;
    }

    if (requirementTreatment === "TREATED" && userPrefs.acceptTreated) {
      return true;
    }

    return false;
  }

  /**
   * Shape matching
   */
  private matchShapes(
    requirementShapes: string[],
    userShapes: string[]
  ): boolean {
    if (!userShapes || userShapes.length === 0) return true;
    return requirementShapes.some((shape) => userShapes.includes(shape));
  }

  /**
   * Carat range overlap
   */
  private matchCaratRange(
    details: any,
    userRanges: { min: number; max: number }[]
  ): boolean {
    if (!userRanges || userRanges.length === 0) return true;

    const reqMin = details.caratMin;
    const reqMax = details.caratMax;

    return userRanges.some((range) =>
      this.rangesOverlap(reqMin, reqMax, range.min, range.max)
    );
  }

  /**
   * Color grade matching
   */
  private matchColorGrades(
    details: any,
    settings: INotificationSettings
  ): boolean {
    if (!settings.colorGrades || settings.colorGrades.length === 0) return true;

    // Standard color grades
    if (details.colorGrades) {
      return details.colorGrades.some((grade: string) =>
        settings.colorGrades.includes(grade)
      );
    }

    // Fancy colors
    if (details.fancyColorGrades && settings.fancyColors?.enabled) {
      return details.fancyColorGrades.some((fancy: any) => {
        const intensityMatch =
          !settings.fancyColors.intensities.length ||
          settings.fancyColors.intensities.includes(fancy.intensity);
        const hueMatch =
          !settings.fancyColors.hues.length ||
          settings.fancyColors.hues.includes(fancy.primaryHue);
        return intensityMatch && hueMatch;
      });
    }

    return true;
  }

  /**
   * Clarity grade matching
   */
  private matchClarityGrades(
    requirementGrades: string[],
    userGrades: string[]
  ): boolean {
    if (!userGrades || userGrades.length === 0) return true;
    return requirementGrades.some((grade) => userGrades.includes(grade));
  }

  /**
   * Certification matching
   */
  private matchCertification(details: any, certFilter: any): boolean {
    if (!certFilter) return true;

    // If requirement needs certification
    if (details.certified) {
      if (certFilter.certifiedOnly) {
        // Check if labs overlap or requirement has no lab preference
        if (details.preferredLabs && details.preferredLabs.length > 0) {
          if (certFilter.preferredLabs && certFilter.preferredLabs.length > 0) {
            return details.preferredLabs.some((lab: string) =>
              certFilter.preferredLabs.includes(lab)
            );
          }
        }
        return true; // Certified requirement, user accepts certified
      }
    }

    // If requirement doesn't need certification
    if (!details.certified && certFilter.nonCertifiedOk) {
      return true;
    }

    return true; // Default match
  }

  /**
   * Budget range matching
   */
  private matchBudgetRange(
    details: any,
    userRanges: { min: number; max: number; currency: string }[]
  ): boolean {
    if (!userRanges || userRanges.length === 0) return true;
    if (!details.budgetMin && !details.budgetMax) return true;

    const reqMin = details.budgetMin || 0;
    const reqMax = details.budgetMax || Infinity;
    const reqCurrency = details.currency || "USD";

    return userRanges.some(
      (range) =>
        range.currency === reqCurrency &&
        this.rangesOverlap(reqMin, reqMax, range.min, range.max)
    );
  }

  /**
   * Geographic matching
   */
  private matchGeographic(details: any, geoPrefs: any): boolean {
    if (!geoPrefs) return true;

    // If user only wants local
    if (geoPrefs.localOnly) {
      // Would need buyer location to check
      // For now, allow it
      return true;
    }

    // Check shipping preferences
    if (geoPrefs.canShipTo && geoPrefs.canShipTo.length > 0) {
      if (details.locationPreference?.countries) {
        return details.locationPreference.countries.some((country: string) =>
          geoPrefs.canShipTo.includes(country)
        );
      }
    }

    return true; // No restriction
  }

  /**
   * Apply disqualifying filters
   */
  private applyFilters(
    requirement: any,
    settings: INotificationSettings
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    // Minimum budget threshold
    if (settings.advancedFilters?.minimumBudget) {
      const reqBudgetMax = requirement.details.budgetMax || 0;
      if (reqBudgetMax < settings.advancedFilters.minimumBudget) {
        failures.push(
          `Budget below minimum (${reqBudgetMax} < ${settings.advancedFilters.minimumBudget})`
        );
      }
    }

    // Timing filters
    const timingResult = this.checkTimingFilters(
      requirement.details.deliveryTimeline,
      settings.timingFilters
    );
    if (!timingResult.passed) {
      failures.push(...timingResult.failures);
    }

    // Conflict-free requirement
    if (
      settings.advancedFilters?.conflictFreeOnly &&
      !requirement.details.conflictFree
    ) {
      failures.push("Conflict-free requirement not met");
    }

    // Matching pairs
    if (
      settings.advancedFilters?.canProvideMatchingPairs &&
      requirement.details.matching?.requiresMatching === false
    ) {
      // User can provide pairs but requirement doesn't need them - still OK
    }

    // Intended use
    if (
      settings.advancedFilters?.intendedUses &&
      settings.advancedFilters.intendedUses.length > 0
    ) {
      if (
        requirement.details.intendedUse &&
        !settings.advancedFilters.intendedUses.includes(
          requirement.details.intendedUse
        )
      ) {
        failures.push("Intended use mismatch");
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Check timing filters
   */
  private checkTimingFilters(
    deliveryTimeline: Date,
    timingFilters: any
  ): { passed: boolean; failures: string[] } {
    if (!timingFilters) return { passed: true, failures: [] };

    const failures: string[] = [];
    const daysUntilDelivery = Math.floor(
      (new Date(deliveryTimeline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    // Minimum lead time
    if (timingFilters.minimumLeadTime) {
      if (daysUntilDelivery < timingFilters.minimumLeadTime) {
        failures.push(
          `Insufficient lead time (${daysUntilDelivery} < ${timingFilters.minimumLeadTime} days)`
        );
      }
    }

    // Maximum lead time
    if (timingFilters.maximumLeadTime) {
      if (daysUntilDelivery > timingFilters.maximumLeadTime) {
        failures.push(
          `Too far in future (${daysUntilDelivery} > ${timingFilters.maximumLeadTime} days)`
        );
      }
    }

    // Urgent only
    if (timingFilters.urgentOnly && daysUntilDelivery > 14) {
      failures.push(`Not urgent enough (${daysUntilDelivery} > 14 days)`);
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Check if two ranges overlap
   * Formula: NOT (max1 < min2 OR max2 < min1)
   */
  private rangesOverlap(
    min1: number,
    max1: number,
    min2: number,
    max2: number
  ): boolean {
    return !(max1 < min2 || max2 < min1);
  }

  /**
   * Send notifications to matched users
   */
  private async sendMatchNotifications(
    matchResults: MatchResult[],
    requirement: any,
    allUsers: any[]
  ): Promise<number> {
    let notificationsSent = 0;

    for (const match of matchResults) {
      const user = allUsers.find((u) => u._id.toString() === match.userId);
      if (!user) continue;

      const settings = user.notificationSettings;
      const frequency = settings.frequency || "Instant";

      // Check quiet hours
      const inQuietHours = this.isInQuietHours(settings.quietHours);

      if (inQuietHours) {
        console.log(
          `[MATCHING] User ${match.userId} in quiet hours - queuing notification`
        );
      }

      // Determine if we should queue or send immediately
      const shouldQueue = inQuietHours || frequency !== "Instant";

      try {
        if (shouldQueue) {
          // Queue for later delivery
          await this.queueNotification(user, requirement, match, settings);
          console.log(
            `[MATCHING] Queued notification for user ${
              match.userId
            } (${frequency}${inQuietHours ? ", in quiet hours" : ""})`
          );
        } else {
          // Send immediately
          await this.sendToUser(user, requirement, match, settings);
        }
        notificationsSent++;
      } catch (error) {
        console.error(
          `[MATCHING] Failed to notify user ${match.userId}:`,
          error
        );
      }
    }

    return notificationsSent;
  }

  /**
   * Queue notification for later delivery
   */
  private async queueNotification(
    user: any,
    requirement: any,
    match: MatchResult,
    settings: INotificationSettings
  ): Promise<void> {
    const title = "New Requirement Match";
    const message = `A new requirement "${requirement.title}" matches your preferences (${match.score}% match)`;
    const actionUrl = `/requirements/${requirement._id}`;

    const frequency = (settings.frequency || "Instant") as
      | "Instant"
      | "Hourly"
      | "Daily"
      | "Weekly";

    await notificationQueueService.queueNotification(
      user._id.toString(),
      frequency,
      {
        title,
        message,
        actionUrl,
        type: NOTIFICATION_TYPE.REQUIREMENT,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          requirementId: requirement._id.toString(),
          matchScore: match.score,
          matchReasons: match.reasons,
        },
      },
      settings.quietHours?.timezone || "UTC"
    );
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(quietHours: any): boolean {
    if (!quietHours || !quietHours.enabled) return false;

    const now = new Date();
    const userTimezone = quietHours.timezone || "UTC";

    // Get user's local time
    const userTime = new Date(
      now.toLocaleString("en-US", { timeZone: userTimezone })
    );
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentDay = userTime.getDay();

    // Check day of week
    if (
      quietHours.daysOfWeek &&
      quietHours.daysOfWeek.length > 0 &&
      !quietHours.daysOfWeek.includes(currentDay)
    ) {
      return false; // Not a quiet day
    }

    // Parse start and end times
    const [startHour, startMinute] = quietHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = quietHours.endTime.split(":").map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if current time is in quiet hours
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Send notification to user via enabled channels
   */
  private async sendToUser(
    user: any,
    requirement: any,
    match: MatchResult,
    settings: INotificationSettings
  ): Promise<void> {
    const title = "New Requirement Match";
    const message = `A new requirement "${requirement.title}" matches your preferences (${match.score}% match)`;
    const actionUrl = `/requirements/${requirement._id}`;

    // In-app notification (always sent if enabled)
    if (settings.channels.inApp) {
      await notificationService.sendNotification(user._id.toString(), {
        title,
        message,
        actionUrl,
        data: {
          requirementId: requirement._id.toString(),
          matchScore: match.score,
          matchReasons: match.reasons,
        },
        type: NOTIFICATION_TYPE.REQUIREMENT,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
      });
    }

    // Push notification
    if (settings.channels.push && user.fcmToken) {
      // Already handled by sendNotification above
    }

    // Email notification
    if (settings.channels.email) {
      if (settings.channels.emailDigest) {
        // Queue for digest
        console.log(
          `[MATCHING] Queueing email digest for user ${user._id} (frequency: ${settings.frequency})`
        );
        // TODO: Implement email digest queue
      } else {
        // Send instant email
        console.log(
          `[MATCHING] Sending instant email to ${settings.channels.emailAddress}`
        );
        // TODO: Implement instant email sending
      }
    }

    // SMS notification
    if (settings.channels.sms && settings.channels.phoneNumber) {
      // Only for high-value or urgent requirements
      const isHighValue =
        requirement.details.budgetMax && requirement.details.budgetMax > 50000;
      const daysUntil = Math.floor(
        (new Date(requirement.details.deliveryTimeline).getTime() -
          Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      const isUrgent = daysUntil <= 7;

      if (isHighValue || isUrgent) {
        console.log(
          `[MATCHING] Sending SMS to ${settings.channels.phoneNumber}`
        );
        // TODO: Implement SMS sending
      }
    }
  }
}

export default new RequirementMatchingService();
