import {
  doc,
  updateDoc,
  increment,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UsageData {
  used: number;
  limit: number;
  isPrimary: boolean;
}

export interface UserUsage {
  [platform: string]: UsageData;
}

export interface UsageLimit {
  allowed: boolean;
  remaining: number;
  isAtLimit: boolean;
  willTriggerUpgrade: boolean;
  conversionTrigger?: "primary_platform_limit" | "secondary_platform_limit";
  message?: string;
}

export interface UsageAnalytics {
  workflowId: string;
  userId: string;
  platform: string;
  inputLength: number;
  outputNodes: number;
  complexity: string;
  generationTime: number;
  timestamp: string;
}

class UsageService {
  private readonly platforms = ["n8n", "zapier", "make", "power_automate"];

  /**
   * Calculate usage limits based on primary platform (THE PSYCHOLOGICAL PRICING STRATEGY)
   * Users get FEWER workflows on their primary platform but MORE on others
   * This drives them to upgrade when they hit their primary platform limit
   */
  calculateInitialUsage(primaryPlatform: string): UserUsage {
    const usage: UserUsage = {};

    this.platforms.forEach((platform) => {
      if (platform === primaryPlatform) {
        // Primary platform gets LESS (creates urgency to upgrade)
        usage[platform] = {
          used: 0,
          limit: 3,
          isPrimary: true,
        };
      } else {
        // Other platforms get MORE (hooks them in)
        usage[platform] = {
          used: 0,
          limit: 10,
          isPrimary: false,
        };
      }
    });

    return usage;
  }

  /**
   * Check if user can generate a workflow on a specific platform
   * Returns detailed information for conversion optimization
   */
  checkUsageLimit(
    userId: string,
    platform: string,
    userPlan: string,
    currentUsage: UserUsage,
  ): UsageLimit {
    // Pro and Enterprise users get unlimited access
    if (userPlan === "pro" || userPlan === "enterprise") {
      return {
        allowed: true,
        remaining: 999999,
        isAtLimit: false,
        willTriggerUpgrade: false,
      };
    }

    const platformUsage = currentUsage[platform];
    if (!platformUsage) {
      return {
        allowed: false,
        remaining: 0,
        isAtLimit: true,
        willTriggerUpgrade: false,
        message: "Platform not found in user usage data",
      };
    }

    const remaining = platformUsage.limit - platformUsage.used;
    const isAtLimit = remaining <= 0;
    const willTriggerUpgrade = remaining <= 1 && platformUsage.isPrimary;

    if (isAtLimit) {
      const conversionTrigger = platformUsage.isPrimary
        ? "primary_platform_limit"
        : "secondary_platform_limit";

      const message = platformUsage.isPrimary
        ? `You've used all ${platformUsage.limit} ${platform} workflows this month. Upgrade to Pro for unlimited access to your main platform!`
        : `You've used all ${platformUsage.limit} ${platform} workflows this month. Try ${platform} with unlimited Pro access!`;

      // Track conversion opportunities
      this.trackConversionOpportunity(userId, platform, conversionTrigger);

      return {
        allowed: false,
        remaining: 0,
        isAtLimit: true,
        willTriggerUpgrade: platformUsage.isPrimary,
        conversionTrigger,
        message,
      };
    }

    return {
      allowed: true,
      remaining,
      isAtLimit: false,
      willTriggerUpgrade,
    };
  }

  /**
   * Increment usage count for a platform
   */
  async incrementUsage(userId: string, platform: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        [`usage.${platform}.used`]: increment(1),
        lastUsedAt: new Date().toISOString(),
      });

      // Track usage analytics
      await this.trackUsageAnalytics(userId, platform);
    } catch (error) {
      console.error("Error incrementing usage:", error);
      throw new Error("Failed to update usage count");
    }
  }

  /**
   * Reset monthly usage (called by scheduled function)
   */
  async resetMonthlyUsage(
    userId: string,
    currentUsage: UserUsage,
  ): Promise<void> {
    try {
      const resetUsage: UserUsage = {};

      Object.keys(currentUsage).forEach((platform) => {
        resetUsage[platform] = {
          ...currentUsage[platform],
          used: 0,
        };
      });

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        usage: resetUsage,
        lastResetAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error resetting monthly usage:", error);
      throw new Error("Failed to reset monthly usage");
    }
  }

  /**
   * Update usage limits when user upgrades plan
   */
  async updatePlanUsage(userId: string, newPlan: string): Promise<UserUsage> {
    try {
      let newUsage: UserUsage;

      if (newPlan === "pro" || newPlan === "enterprise") {
        // Unlimited usage for paid plans
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        newUsage = {};
        this.platforms.forEach((platform) => {
          newUsage[platform] = {
            used: userData?.usage?.[platform]?.used || 0,
            limit: 999999, // Unlimited
            isPrimary: userData?.usage?.[platform]?.isPrimary || false,
          };
        });
      } else {
        // Revert to free plan limits
        const userData = await getDoc(doc(db, "users", userId));
        const userPrimaryPlatform = userData.data()?.primaryPlatform || "n8n";
        newUsage = this.calculateInitialUsage(userPrimaryPlatform);
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        usage: newUsage,
        plan: newPlan,
        planUpdatedAt: new Date().toISOString(),
      });

      return newUsage;
    } catch (error) {
      console.error("Error updating plan usage:", error);
      throw new Error("Failed to update plan usage");
    }
  }

  /**
   * Track conversion opportunities for analytics
   */
  private async trackConversionOpportunity(
    userId: string,
    platform: string,
    trigger: string,
  ): Promise<void> {
    try {
      await addDoc(collection(db, "conversion_opportunities"), {
        userId,
        platform,
        trigger,
        timestamp: new Date().toISOString(),
        converted: false, // Will be updated when user actually converts
      });
    } catch (error) {
      console.error("Error tracking conversion opportunity:", error);
    }
  }

  /**
   * Track usage analytics for business intelligence
   */
  private async trackUsageAnalytics(
    userId: string,
    platform: string,
  ): Promise<void> {
    try {
      await addDoc(collection(db, "usage_analytics"), {
        userId,
        platform,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0], // For daily aggregation
        month: new Date().toISOString().substring(0, 7), // For monthly aggregation
      });
    } catch (error) {
      console.error("Error tracking usage analytics:", error);
    }
  }

  /**
   * Get usage statistics for admin dashboard
   */
  async getUsageStatistics(): Promise<any> {
    // This would be implemented for admin analytics
    // Returns aggregated usage data, conversion rates, etc.
    return {
      totalWorkflows: 0,
      conversionRate: 0,
      platformUsage: {},
      monthlyGrowth: 0,
    };
  }

  /**
   * Calculate next billing cycle usage reset
   */
  getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Get usage summary for user display
   */
  getUsageSummary(usage: UserUsage): {
    totalUsed: number;
    totalLimit: number;
    platformsAtLimit: string[];
    primaryPlatformUsage: number;
    secondaryPlatformsUsage: number;
  } {
    let totalUsed = 0;
    let totalLimit = 0;
    let primaryPlatformUsage = 0;
    let secondaryPlatformsUsage = 0;
    const platformsAtLimit: string[] = [];

    Object.entries(usage).forEach(([platform, data]) => {
      totalUsed += data.used;
      totalLimit += data.limit;

      if (data.isPrimary) {
        primaryPlatformUsage = data.used;
      } else {
        secondaryPlatformsUsage += data.used;
      }

      if (data.used >= data.limit) {
        platformsAtLimit.push(platform);
      }
    });

    return {
      totalUsed,
      totalLimit,
      platformsAtLimit,
      primaryPlatformUsage,
      secondaryPlatformsUsage,
    };
  }

  /**
   * Predict conversion probability based on usage patterns
   */
  predictConversionProbability(
    usage: UserUsage,
    daysSinceSignup: number,
  ): number {
    const summary = this.getUsageSummary(usage);

    // Algorithm to predict conversion based on:
    // - Primary platform usage percentage
    // - Days since signup
    // - Secondary platform exploration

    const primaryUsageRate =
      summary.primaryPlatformUsage /
      usage[Object.keys(usage).find((k) => usage[k].isPrimary) || "n8n"].limit;
    const explorationScore = summary.secondaryPlatformsUsage > 0 ? 1.2 : 1.0;
    const timeScore = Math.min(daysSinceSignup / 14, 1); // Higher after 14 days

    const baseProbability =
      primaryUsageRate * 0.6 + timeScore * 0.3 + (explorationScore - 1) * 0.1;

    return Math.min(Math.max(baseProbability, 0), 1);
  }
}

export const usageService = new UsageService();
