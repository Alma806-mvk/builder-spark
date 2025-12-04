// Analytics Service for FlowForge AI
// Tracks user behavior, conversion funnel, and business metrics

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: string;
}

export interface ConversionFunnelStep {
  step:
    | "visitor"
    | "signup"
    | "activated"
    | "limited"
    | "trial"
    | "converted"
    | "retained";
  userId: string;
  timestamp: string;
  properties?: Record<string, any>;
}

export interface BusinessMetric {
  metric: string;
  value: number;
  timestamp: string;
  dimensions?: Record<string, string>;
}

class AnalyticsService {
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize analytics with user context
   */
  initialize(userId?: string): void {
    this.userId = userId || null;
    this.isInitialized = true;

    // Initialize Google Analytics
    this.initializeGoogleAnalytics();

    // Initialize Mixpanel (for detailed event tracking)
    this.initializeMixpanel();

    // Set up error monitoring
    this.initializeErrorMonitoring();

    console.log("Analytics initialized for user:", userId);
  }

  /**
   * Track user events
   */
  track(event: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) {
      console.warn("Analytics not initialized");
      return;
    }

    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      userId: this.userId || undefined,
      timestamp: new Date().toISOString(),
    };

    // Send to multiple analytics providers
    this.sendToGoogleAnalytics(eventData);
    this.sendToMixpanel(eventData);
    this.sendToBackend(eventData);

    console.log("Analytics event tracked:", eventData);
  }

  /**
   * Track conversion funnel steps
   */
  trackConversionStep(
    step: ConversionFunnelStep["step"],
    properties: Record<string, any> = {},
  ): void {
    this.track(`funnel_${step}`, {
      funnel_step: step,
      ...properties,
    });

    // Special handling for key conversion events
    if (step === "signup") {
      this.trackConversion("signup", properties);
    } else if (step === "converted") {
      this.trackConversion("subscription", properties);
    }
  }

  /**
   * Track business conversions (for ad platforms)
   */
  trackConversion(type: string, properties: Record<string, any> = {}): void {
    // Google Ads conversion tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
        value: properties.value || 0,
        currency: properties.currency || "USD",
        transaction_id: properties.transactionId || Date.now().toString(),
      });
    }

    // Facebook Pixel conversion tracking
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq(
        "track",
        type === "signup" ? "CompleteRegistration" : "Purchase",
        {
          value: properties.value || 0,
          currency: properties.currency || "USD",
        },
      );
    }

    this.track(`conversion_${type}`, properties);
  }

  /**
   * Track page views
   */
  trackPageView(page: string): void {
    this.track("page_view", {
      page,
      title: document.title,
      referrer: document.referrer,
    });

    // Google Analytics page view
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "GA_MEASUREMENT_ID", {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }

  /**
   * Track workflow generation events
   */
  trackWorkflowGeneration(data: {
    platform: string;
    inputLength: number;
    outputNodes: number;
    complexity: string;
    generationTime: number;
    success: boolean;
  }): void {
    this.track("workflow_generated", {
      platform: data.platform,
      input_length: data.inputLength,
      output_nodes: data.outputNodes,
      complexity: data.complexity,
      generation_time_ms: data.generationTime,
      success: data.success,
    });

    // Track as business metric
    this.trackBusinessMetric("workflows_generated", 1, {
      platform: data.platform,
      complexity: data.complexity,
    });
  }

  /**
   * Track usage limit hits (conversion opportunities)
   */
  trackUsageLimitHit(data: {
    platform: string;
    isPrimary: boolean;
    remainingWorkflows: number;
  }): void {
    this.track("usage_limit_hit", {
      platform: data.platform,
      is_primary_platform: data.isPrimary,
      remaining_workflows: data.remainingWorkflows,
      conversion_opportunity: true,
    });

    // High-value conversion opportunity
    if (data.isPrimary && data.remainingWorkflows === 0) {
      this.trackConversion("limit_reached", {
        platform: data.platform,
        value: 19, // Pro plan price
      });
    }
  }

  /**
   * Track subscription events
   */
  trackSubscription(
    event: "started" | "upgraded" | "cancelled" | "renewed",
    data: {
      plan: string;
      interval: string;
      amount: number;
      currency: string;
    },
  ): void {
    this.track(`subscription_${event}`, {
      plan: data.plan,
      interval: data.interval,
      amount: data.amount,
      currency: data.currency,
    });

    // Track as business metric
    if (event === "upgraded" || event === "renewed") {
      this.trackBusinessMetric("revenue", data.amount, {
        plan: data.plan,
        interval: data.interval,
      });
    }
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    dimensions: Record<string, string> = {},
  ): void {
    const metricData: BusinessMetric = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      dimensions,
    };

    // Send to backend for business intelligence
    this.sendMetricToBackend(metricData);
  }

  /**
   * Track errors and exceptions
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    this.track("error", {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });

    // Send to error monitoring service (Sentry)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: context,
        user: { id: this.userId },
      });
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = "ms"): void {
    this.track("performance", {
      metric,
      value,
      unit,
    });

    // Send to performance monitoring
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "timing_complete", {
        name: metric,
        value: value,
      });
    }
  }

  /**
   * Identify user (set user properties)
   */
  identify(userId: string, properties: Record<string, any> = {}): void {
    this.userId = userId;

    // Mixpanel identify
    if (typeof window !== "undefined" && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      (window as any).mixpanel.people.set(properties);
    }

    // Google Analytics user properties
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "GA_MEASUREMENT_ID", {
        user_id: userId,
        custom_map: properties,
      });
    }

    this.track("user_identified", {
      user_id: userId,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (typeof window !== "undefined" && (window as any).mixpanel) {
      (window as any).mixpanel.people.set(properties);
    }

    this.track("user_properties_updated", properties);
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics(): void {
    if (typeof window === "undefined") return;

    // Load Google Analytics
    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID";
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag("js", new Date());
    (window as any).gtag("config", "GA_MEASUREMENT_ID");
  }

  /**
   * Initialize Mixpanel
   */
  private initializeMixpanel(): void {
    if (typeof window === "undefined") return;

    // In production, you would load the actual Mixpanel script
    // For demo purposes, we'll mock it
    (window as any).mixpanel = {
      init: () => {},
      track: (event: string, properties: any) => {
        console.log("Mixpanel track:", event, properties);
      },
      identify: (userId: string) => {
        console.log("Mixpanel identify:", userId);
      },
      people: {
        set: (properties: any) => {
          console.log("Mixpanel people set:", properties);
        },
      },
    };
  }

  /**
   * Initialize error monitoring
   */
  private initializeErrorMonitoring(): void {
    if (typeof window === "undefined") return;

    // Mock Sentry for demo
    (window as any).Sentry = {
      init: () => {},
      captureException: (error: Error, context: any) => {
        console.log("Sentry error:", error, context);
      },
    };

    // Global error handler
    window.addEventListener("error", (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(new Error(event.reason), {
        type: "unhandled_promise_rejection",
      });
    });
  }

  /**
   * Send event to Google Analytics
   */
  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event.event, {
        event_category: "user_interaction",
        event_label: event.properties.label,
        value: event.properties.value,
        user_id: event.userId,
      });
    }
  }

  /**
   * Send event to Mixpanel
   */
  private sendToMixpanel(event: AnalyticsEvent): void {
    if (typeof window !== "undefined" && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.event, {
        distinct_id: event.userId,
        ...event.properties,
      });
    }
  }

  /**
   * Send event to backend analytics
   */
  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("Failed to send analytics event to backend:", error);
    }
  }

  /**
   * Send business metric to backend
   */
  private async sendMetricToBackend(metric: BusinessMetric): Promise<void> {
    try {
      await fetch("/api/analytics/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error("Failed to send metric to backend:", error);
    }
  }

  /**
   * Get user analytics data (for admin dashboard)
   */
  async getUserAnalytics(userId: string): Promise<any> {
    try {
      const response = await fetch(`/api/analytics/user/${userId}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get user analytics:", error);
      return null;
    }
  }

  /**
   * Get business metrics (for admin dashboard)
   */
  async getBusinessMetrics(timeRange: string = "30d"): Promise<any> {
    try {
      const response = await fetch(
        `/api/analytics/business?range=${timeRange}`,
      );
      return await response.json();
    } catch (error) {
      console.error("Failed to get business metrics:", error);
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();

// Auto-initialize analytics when the service is imported
if (typeof window !== "undefined") {
  // Initialize after a short delay to ensure page is loaded
  setTimeout(() => {
    analyticsService.initialize();
  }, 100);
}
