import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usageService, UsageLimit, UserUsage } from "@/services/usageService";

export interface UseUsageReturn {
  usage: UserUsage | null;
  checkLimit: (platform: string) => UsageLimit;
  incrementUsage: (platform: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  usageSummary: {
    totalUsed: number;
    totalLimit: number;
    platformsAtLimit: string[];
    primaryPlatformUsage: number;
    secondaryPlatformsUsage: number;
  } | null;
  conversionProbability: number;
  nextResetDate: Date;
}

export const useUsage = (): UseUsageReturn => {
  const { userProfile, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usage = userProfile?.usage || null;

  const checkLimit = (platform: string): UsageLimit => {
    if (!userProfile || !usage) {
      return {
        allowed: false,
        remaining: 0,
        isAtLimit: true,
        willTriggerUpgrade: false,
        message: "User profile not loaded",
      };
    }

    return usageService.checkUsageLimit(
      userProfile.uid,
      platform,
      userProfile.plan,
      usage,
    );
  };

  const incrementUsage = async (platform: string): Promise<void> => {
    if (!userProfile || !usage) {
      throw new Error("User profile not loaded");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update local state optimistically
      const updatedUsage = {
        ...usage,
        [platform]: {
          ...usage[platform],
          used: usage[platform].used + 1,
        },
      };

      // Update in Firestore
      await usageService.incrementUsage(userProfile.uid, platform);

      // Update local context
      await updateUserProfile({ usage: updatedUsage });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update usage";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const usageSummary = usage ? usageService.getUsageSummary(usage) : null;

  const conversionProbability =
    usage && userProfile
      ? usageService.predictConversionProbability(
          usage,
          Math.floor(
            (Date.now() - new Date(userProfile.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const nextResetDate = usageService.getNextResetDate();

  return {
    usage,
    checkLimit,
    incrementUsage,
    isLoading,
    error,
    usageSummary,
    conversionProbability,
    nextResetDate,
  };
};

// Hook for conversion optimization
export const useConversionOptimization = () => {
  const { userProfile } = useAuth();
  const { usage, usageSummary, conversionProbability } = useUsage();

  const shouldShowUpgradePrompt = (): {
    show: boolean;
    type: "urgent" | "gentle" | "exploration";
    platform?: string;
    message: string;
  } => {
    if (!userProfile || !usage || userProfile.plan !== "free") {
      return { show: false, type: "gentle", message: "" };
    }

    // Primary platform near/at limit - URGENT
    const primaryPlatform = Object.keys(usage).find(
      (platform) => usage[platform].isPrimary,
    );
    if (primaryPlatform) {
      const primaryUsage = usage[primaryPlatform];
      const remaining = primaryUsage.limit - primaryUsage.used;

      if (remaining === 0) {
        return {
          show: true,
          type: "urgent",
          platform: primaryPlatform,
          message: `🔥 You've used all ${primaryUsage.limit} ${primaryPlatform} workflows! Upgrade for unlimited access to your main platform.`,
        };
      }

      if (remaining === 1) {
        return {
          show: true,
          type: "urgent",
          platform: primaryPlatform,
          message: `⚠️ Only 1 ${primaryPlatform} workflow left! Upgrade now to avoid interruption.`,
        };
      }
    }

    // High usage on secondary platforms - EXPLORATION
    const secondaryPlatforms = Object.keys(usage).filter(
      (platform) => !usage[platform].isPrimary,
    );
    const highUsageSecondary = secondaryPlatforms.find((platform) => {
      const platformUsage = usage[platform];
      return platformUsage.used >= platformUsage.limit * 0.8;
    });

    if (highUsageSecondary) {
      return {
        show: true,
        type: "exploration",
        platform: highUsageSecondary,
        message: `💡 Loving ${highUsageSecondary}? Upgrade for unlimited workflows on all platforms!`,
      };
    }

    // High conversion probability - GENTLE
    if (conversionProbability > 0.7) {
      return {
        show: true,
        type: "gentle",
        message: `🚀 Ready to scale your automation? Upgrade for unlimited workflows and priority support.`,
      };
    }

    return { show: false, type: "gentle", message: "" };
  };

  const getOptimalUpgradeOffer = (): {
    discount: number;
    urgency: string;
    features: string[];
  } => {
    if (!userProfile || !usageSummary) {
      return { discount: 0, urgency: "", features: [] };
    }

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(userProfile.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const totalUsageRate = usageSummary.totalUsed / usageSummary.totalLimit;

    // Dynamic pricing based on usage and time
    let discount = 0;
    let urgency = "";

    if (usageSummary.platformsAtLimit.length > 0) {
      discount = 25;
      urgency = "Limited time: 25% off to remove all limits!";
    } else if (totalUsageRate > 0.8) {
      discount = 20;
      urgency = "High usage detected: 20% off Pro plan!";
    } else if (daysSinceSignup <= 7) {
      discount = 30;
      urgency = "New user special: 30% off first month!";
    }

    const features = [
      "Unlimited workflows on ALL platforms",
      "Priority support and faster generation",
      "Advanced workflow templates",
      "Team collaboration features",
      "Export to multiple formats",
    ];

    return { discount, urgency, features };
  };

  return {
    shouldShowUpgradePrompt,
    getOptimalUpgradeOffer,
    conversionProbability,
  };
};
