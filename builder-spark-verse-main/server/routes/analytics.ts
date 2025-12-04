import { RequestHandler } from "express";
import { z } from "zod";

// Validation schemas
const AnalyticsEventSchema = z.object({
  event: z.string().min(1, "Event name is required"),
  properties: z.record(z.any()).default({}),
  userId: z.string().optional(),
  timestamp: z.string().datetime(),
});

const BusinessMetricSchema = z.object({
  metric: z.string().min(1, "Metric name is required"),
  value: z.number(),
  timestamp: z.string().datetime(),
  dimensions: z.record(z.string()).optional(),
});

/**
 * Track analytics events
 * POST /api/analytics/track
 */
export const handleTrackEvent: RequestHandler = async (req, res) => {
  try {
    const validationResult = AnalyticsEventSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid event data",
        details: validationResult.error.issues,
      });
    }

    const event = validationResult.data;

    // In production, you would store this in a database or send to analytics service
    console.log("Analytics event received:", {
      event: event.event,
      userId: event.userId,
      timestamp: event.timestamp,
      properties: event.properties,
    });

    // Store in database (mock for demo)
    await storeAnalyticsEvent(event);

    // Send to external analytics services
    await sendToExternalAnalytics(event);

    res.json({
      success: true,
      message: "Event tracked successfully",
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to track event",
    });
  }
};

/**
 * Track business metrics
 * POST /api/analytics/metrics
 */
export const handleTrackMetric: RequestHandler = async (req, res) => {
  try {
    const validationResult = BusinessMetricSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid metric data",
        details: validationResult.error.issues,
      });
    }

    const metric = validationResult.data;

    // Store business metric
    await storeBusinessMetric(metric);

    console.log("Business metric tracked:", metric);

    res.json({
      success: true,
      message: "Metric tracked successfully",
    });
  } catch (error) {
    console.error("Metric tracking error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to track metric",
    });
  }
};

/**
 * Get user analytics data
 * GET /api/analytics/user/:userId
 */
export const handleGetUserAnalytics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = "30d" } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Mock user analytics data
    const userAnalytics = {
      userId,
      timeRange,
      summary: {
        totalEvents: 245,
        workflowsGenerated: 23,
        lastActive: new Date().toISOString(),
        conversionFunnelStep: "activated",
      },
      events: [
        {
          event: "workflow_generated",
          timestamp: new Date().toISOString(),
          properties: { platform: "zapier", complexity: "simple" },
        },
        {
          event: "page_view",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          properties: { page: "dashboard" },
        },
      ],
      conversionFunnel: {
        visitor: new Date(userAnalytics.summary.lastActive).toISOString(),
        signup: new Date(Date.now() - 86400000 * 5).toISOString(),
        activated: new Date(Date.now() - 86400000 * 4).toISOString(),
        limited: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    };

    res.json({
      success: true,
      analytics: userAnalytics,
    });
  } catch (error) {
    console.error("Get user analytics error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get user analytics",
    });
  }
};

/**
 * Get business metrics and KPIs
 * GET /api/analytics/business
 */
export const handleGetBusinessMetrics: RequestHandler = async (req, res) => {
  try {
    const { range = "30d" } = req.query;

    // Mock business metrics data
    const businessMetrics = {
      timeRange: range,
      revenue: {
        totalRevenue: 89750,
        mrr: 45200,
        arr: 542400,
        growth: 23.5,
        churnRate: 4.2,
      },
      users: {
        totalUsers: 12450,
        activeUsers: 8920,
        newSignups: 156,
        conversionRate: 15.3,
        retentionRate: 85.7,
      },
      product: {
        workflowsGenerated: 45600,
        averageWorkflowsPerUser: 5.2,
        platformUsage: {
          zapier: 42,
          n8n: 28,
          make: 18,
          power_automate: 12,
        },
        successRate: 97.8,
      },
      conversion: {
        visitorToSignup: 12.4,
        signupToActivated: 78.9,
        activatedToPaid: 18.7,
        trialToPaid: 24.3,
      },
      timeSeries: [
        { date: "2024-01-01", revenue: 2800, users: 45, workflows: 234 },
        { date: "2024-01-02", revenue: 3200, users: 52, workflows: 267 },
        { date: "2024-01-03", revenue: 2950, users: 48, workflows: 245 },
      ],
    };

    res.json({
      success: true,
      metrics: businessMetrics,
    });
  } catch (error) {
    console.error("Get business metrics error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get business metrics",
    });
  }
};

/**
 * Get conversion funnel data
 * GET /api/analytics/funnel
 */
export const handleGetConversionFunnel: RequestHandler = async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;

    // Mock conversion funnel data
    const funnelData = {
      timeRange,
      steps: [
        { step: "visitor", count: 25400, percentage: 100 },
        { step: "signup", count: 3150, percentage: 12.4 },
        { step: "activated", count: 2485, percentage: 78.9 },
        { step: "limited", count: 1242, percentage: 50.0 },
        { step: "trial", count: 465, percentage: 18.7 },
        { step: "converted", count: 389, percentage: 83.7 },
        { step: "retained", count: 334, percentage: 85.9 },
      ],
      conversionRates: {
        visitorToSignup: 12.4,
        signupToActivated: 78.9,
        activatedToLimited: 50.0,
        limitedToTrial: 37.4,
        trialToConverted: 83.7,
        convertedToRetained: 85.9,
      },
      dropoffPoints: [
        { step: "visitor_to_signup", dropoff: 22250, reason: "no_interest" },
        {
          step: "signup_to_activated",
          dropoff: 665,
          reason: "onboarding_abandoned",
        },
        { step: "activated_to_limited", dropoff: 1243, reason: "low_usage" },
      ],
    };

    res.json({
      success: true,
      funnel: funnelData,
    });
  } catch (error) {
    console.error("Get funnel data error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get funnel data",
    });
  }
};

/**
 * Get platform usage analytics
 * GET /api/analytics/platforms
 */
export const handleGetPlatformAnalytics: RequestHandler = async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;

    // Mock platform analytics
    const platformAnalytics = {
      timeRange,
      overview: {
        totalWorkflows: 45600,
        totalUsers: 8920,
        averageWorkflowsPerUser: 5.1,
      },
      platforms: [
        {
          name: "zapier",
          workflows: 19152,
          users: 3745,
          percentage: 42.0,
          avgComplexity: "simple",
          conversionRate: 16.2,
          retention: 87.3,
        },
        {
          name: "n8n",
          users: 2498,
          workflows: 12768,
          percentage: 28.0,
          avgComplexity: "medium",
          conversionRate: 22.1,
          retention: 91.2,
        },
        {
          name: "make",
          users: 1606,
          workflows: 8208,
          percentage: 18.0,
          avgComplexity: "medium",
          conversionRate: 19.8,
          retention: 89.1,
        },
        {
          name: "power_automate",
          users: 1071,
          workflows: 5472,
          percentage: 12.0,
          avgComplexity: "simple",
          conversionRate: 14.7,
          retention: 83.6,
        },
      ],
      trends: [
        {
          date: "2024-01-01",
          zapier: 450,
          n8n: 320,
          make: 180,
          power_automate: 120,
        },
        {
          date: "2024-01-02",
          zapier: 470,
          n8n: 335,
          make: 195,
          power_automate: 125,
        },
      ],
    };

    res.json({
      success: true,
      platforms: platformAnalytics,
    });
  } catch (error) {
    console.error("Get platform analytics error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get platform analytics",
    });
  }
};

/**
 * Store analytics event (mock implementation)
 */
async function storeAnalyticsEvent(event: any): Promise<void> {
  // In production, this would store in a database like ClickHouse, BigQuery, or Postgres
  console.log("Storing analytics event:", event.event);
}

/**
 * Store business metric (mock implementation)
 */
async function storeBusinessMetric(metric: any): Promise<void> {
  // In production, this would store in a time-series database
  console.log("Storing business metric:", metric.metric, metric.value);
}

/**
 * Send to external analytics services (mock implementation)
 */
async function sendToExternalAnalytics(event: any): Promise<void> {
  // In production, this would send to services like Mixpanel, Amplitude, etc.
  console.log("Sending to external analytics:", event.event);
}
