import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/services/analyticsService";

/**
 * Main analytics hook
 */
export const useAnalytics = () => {
  const { currentUser, userProfile } = useAuth();

  // Initialize analytics with user context
  useEffect(() => {
    if (currentUser && userProfile) {
      analyticsService.identify(currentUser.uid, {
        email: userProfile.email,
        displayName: userProfile.displayName,
        plan: userProfile.plan,
        primaryPlatform: userProfile.primaryPlatform,
        createdAt: userProfile.createdAt,
      });
    }
  }, [currentUser, userProfile]);

  const track = useCallback(
    (event: string, properties: Record<string, any> = {}) => {
      analyticsService.track(event, properties);
    },
    [],
  );

  const trackConversionStep = useCallback(
    (
      step:
        | "visitor"
        | "signup"
        | "activated"
        | "limited"
        | "trial"
        | "converted"
        | "retained",
      properties: Record<string, any> = {},
    ) => {
      analyticsService.trackConversionStep(step, properties);
    },
    [],
  );

  const trackPageView = useCallback((page: string) => {
    analyticsService.trackPageView(page);
  }, []);

  const trackError = useCallback(
    (error: Error, context: Record<string, any> = {}) => {
      analyticsService.trackError(error, context);
    },
    [],
  );

  return {
    track,
    trackConversionStep,
    trackPageView,
    trackError,
    identify: analyticsService.identify.bind(analyticsService),
    setUserProperties:
      analyticsService.setUserProperties.bind(analyticsService),
  };
};

/**
 * Hook for tracking page views automatically
 */
export const usePageView = (pageName: string) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
};

/**
 * Hook for tracking workflow generation events
 */
export const useWorkflowAnalytics = () => {
  const { track } = useAnalytics();

  const trackWorkflowGeneration = useCallback(
    (data: {
      platform: string;
      inputLength: number;
      outputNodes: number;
      complexity: string;
      generationTime: number;
      success: boolean;
    }) => {
      analyticsService.trackWorkflowGeneration(data);
    },
    [],
  );

  const trackWorkflowDownload = useCallback(
    (platform: string, format: string) => {
      track("workflow_downloaded", {
        platform,
        format,
      });
    },
    [track],
  );

  const trackWorkflowCopy = useCallback(
    (platform: string) => {
      track("workflow_copied", {
        platform,
      });
    },
    [track],
  );

  const trackWorkflowShare = useCallback(
    (platform: string, method: string) => {
      track("workflow_shared", {
        platform,
        share_method: method,
      });
    },
    [track],
  );

  return {
    trackWorkflowGeneration,
    trackWorkflowDownload,
    trackWorkflowCopy,
    trackWorkflowShare,
  };
};

/**
 * Hook for tracking usage and conversion events
 */
export const useUsageAnalytics = () => {
  const { track } = useAnalytics();

  const trackUsageLimitHit = useCallback(
    (data: {
      platform: string;
      isPrimary: boolean;
      remainingWorkflows: number;
    }) => {
      analyticsService.trackUsageLimitHit(data);
    },
    [],
  );

  const trackUpgradePromptShown = useCallback(
    (type: "urgent" | "gentle" | "exploration", platform?: string) => {
      track("upgrade_prompt_shown", {
        prompt_type: type,
        platform,
        conversion_opportunity: true,
      });
    },
    [track],
  );

  const trackUpgradeButtonClicked = useCallback(
    (plan: string, discount: number = 0) => {
      track("upgrade_button_clicked", {
        plan,
        discount_percent: discount,
        conversion_intent: true,
      });
    },
    [track],
  );

  const trackTrialStarted = useCallback(
    (plan: string) => {
      track("trial_started", {
        plan,
        value: plan === "pro" ? 19 : 149,
      });
    },
    [track],
  );

  return {
    trackUsageLimitHit,
    trackUpgradePromptShown,
    trackUpgradeButtonClicked,
    trackTrialStarted,
  };
};

/**
 * Hook for tracking subscription events
 */
export const useSubscriptionAnalytics = () => {
  const { track } = useAnalytics();

  const trackSubscriptionStarted = useCallback(
    (plan: string, interval: string, amount: number) => {
      analyticsService.trackSubscription("started", {
        plan,
        interval,
        amount,
        currency: "USD",
      });
    },
    [],
  );

  const trackSubscriptionUpgraded = useCallback(
    (fromPlan: string, toPlan: string, amount: number) => {
      track("subscription_upgraded", {
        from_plan: fromPlan,
        to_plan: toPlan,
        amount,
        currency: "USD",
      });
    },
    [track],
  );

  const trackSubscriptionCancelled = useCallback(
    (plan: string, reason?: string) => {
      track("subscription_cancelled", {
        plan,
        cancellation_reason: reason,
      });
    },
    [track],
  );

  const trackBillingIssue = useCallback(
    (issue: string, plan: string) => {
      track("billing_issue", {
        issue_type: issue,
        plan,
      });
    },
    [track],
  );

  return {
    trackSubscriptionStarted,
    trackSubscriptionUpgraded,
    trackSubscriptionCancelled,
    trackBillingIssue,
  };
};

/**
 * Hook for tracking onboarding events
 */
export const useOnboardingAnalytics = () => {
  const { track, trackConversionStep } = useAnalytics();

  const trackOnboardingStarted = useCallback(() => {
    trackConversionStep("signup");
    track("onboarding_started");
  }, [track, trackConversionStep]);

  const trackPlatformSelected = useCallback(
    (platform: string) => {
      track("platform_selected", {
        primary_platform: platform,
        onboarding_step: "platform_selection",
      });
    },
    [track],
  );

  const trackOnboardingCompleted = useCallback(
    (platform: string, timeSpent: number) => {
      trackConversionStep("activated");
      track("onboarding_completed", {
        primary_platform: platform,
        time_spent_seconds: timeSpent,
      });
    },
    [track, trackConversionStep],
  );

  const trackOnboardingAbandoned = useCallback(
    (step: string, timeSpent: number) => {
      track("onboarding_abandoned", {
        abandoned_at_step: step,
        time_spent_seconds: timeSpent,
      });
    },
    [track],
  );

  return {
    trackOnboardingStarted,
    trackPlatformSelected,
    trackOnboardingCompleted,
    trackOnboardingAbandoned,
  };
};

/**
 * Hook for tracking performance metrics
 */
export const usePerformanceAnalytics = () => {
  const trackPerformance = useCallback(
    (metric: string, value: number, unit: string = "ms") => {
      analyticsService.trackPerformance(metric, value, unit);
    },
    [],
  );

  const trackPageLoad = useCallback(
    (loadTime: number) => {
      trackPerformance("page_load_time", loadTime);
    },
    [trackPerformance],
  );

  const trackApiResponse = useCallback(
    (endpoint: string, responseTime: number, success: boolean) => {
      trackPerformance(
        `api_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}`,
        responseTime,
      );
      analyticsService.track("api_call", {
        endpoint,
        response_time_ms: responseTime,
        success,
      });
    },
    [trackPerformance],
  );

  const trackWorkflowGenerationTime = useCallback(
    (platform: string, generationTime: number) => {
      trackPerformance(`workflow_generation_${platform}`, generationTime);
    },
    [trackPerformance],
  );

  return {
    trackPerformance,
    trackPageLoad,
    trackApiResponse,
    trackWorkflowGenerationTime,
  };
};

/**
 * Hook for error tracking
 */
export const useErrorTracking = () => {
  const { trackError } = useAnalytics();

  const trackApiError = useCallback(
    (endpoint: string, error: Error, statusCode?: number) => {
      trackError(error, {
        type: "api_error",
        endpoint,
        status_code: statusCode,
      });
    },
    [trackError],
  );

  const trackUIError = useCallback(
    (component: string, error: Error, props?: any) => {
      trackError(error, {
        type: "ui_error",
        component,
        props: JSON.stringify(props),
      });
    },
    [trackError],
  );

  const trackValidationError = useCallback((field: string, error: string) => {
    analyticsService.track("validation_error", {
      field,
      error_message: error,
    });
  }, []);

  return {
    trackApiError,
    trackUIError,
    trackValidationError,
  };
};
