import { RequestHandler } from "express";
import { z } from "zod";
import { stripeService } from "../services/stripeService";

// Validation schemas
const CreateCheckoutSessionSchema = z.object({
  plan: z.enum(["pro", "enterprise"], {
    errorMap: () => ({ message: "Plan must be 'pro' or 'enterprise'" }),
  }),
  interval: z.enum(["monthly", "yearly"], {
    errorMap: () => ({ message: "Interval must be 'monthly' or 'yearly'" }),
  }),
  userId: z.string().min(1, "User ID is required"),
  userEmail: z.string().email("Valid email is required"),
  discountPercent: z.number().min(0).max(100).optional(),
});

const CreatePortalSessionSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

/**
 * Create Stripe Checkout session
 * POST /api/payment/create-checkout-session
 */
export const handleCreateCheckoutSession: RequestHandler = async (req, res) => {
  try {
    const validationResult = CreateCheckoutSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { plan, interval, userId, userEmail, discountPercent } =
      validationResult.data;

    // Get pricing plans
    const pricingPlans = stripeService.getPricingPlans();
    const selectedPlan = pricingPlans[plan as keyof typeof pricingPlans];
    const priceId = selectedPlan[interval as keyof typeof selectedPlan].priceId;

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      priceId,
      userId,
      userEmail,
      successUrl: `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard?payment=success`,
      cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard?payment=cancelled`,
      discountPercent,
    });

    // Log the conversion attempt
    console.log(`Checkout session created:`, {
      userId,
      plan,
      interval,
      sessionId: session.sessionId,
      discountPercent,
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create checkout session",
      message:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Please try again later",
    });
  }
};

/**
 * Create Stripe Customer Portal session
 * POST /api/payment/create-portal-session
 */
export const handleCreatePortalSession: RequestHandler = async (req, res) => {
  try {
    const validationResult = CreatePortalSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: validationResult.error.issues,
      });
    }

    const { customerId } = validationResult.data;

    const session = await stripeService.createPortalSession({
      customerId,
      returnUrl: `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Create portal session error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create portal session",
    });
  }
};

/**
 * Handle Stripe webhooks
 * POST /api/payment/webhook
 */
export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: "Missing stripe signature",
    });
  }

  try {
    await stripeService.handleWebhook(req.body, signature);

    res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    res.status(400).json({
      success: false,
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get pricing plans
 * GET /api/payment/pricing
 */
export const handleGetPricing: RequestHandler = async (req, res) => {
  try {
    const pricingPlans = stripeService.getPricingPlans();

    res.json({
      success: true,
      plans: {
        pro: {
          name: "Pro",
          description: "Perfect for individuals and small teams",
          features: [
            "Unlimited workflows",
            "All platforms supported",
            "Priority support",
            "Advanced templates",
            "Team collaboration",
          ],
          monthly: {
            price: pricingPlans.pro.monthly.amount / 100,
            priceId: pricingPlans.pro.monthly.priceId,
          },
          yearly: {
            price: pricingPlans.pro.yearly.amount / 100,
            priceId: pricingPlans.pro.yearly.priceId,
            savings: 20, // percentage
          },
        },
        enterprise: {
          name: "Enterprise",
          description: "Advanced features for large organizations",
          features: [
            "Everything in Pro",
            "SSO integration",
            "Audit logs",
            "Custom integrations",
            "Dedicated support",
            "On-premise deployment",
            "White-label options",
          ],
          monthly: {
            price: pricingPlans.enterprise.monthly.amount / 100,
            priceId: pricingPlans.enterprise.monthly.priceId,
          },
          yearly: {
            price: pricingPlans.enterprise.yearly.amount / 100,
            priceId: pricingPlans.enterprise.yearly.priceId,
            savings: 20, // percentage
          },
        },
      },
    });
  } catch (error) {
    console.error("Get pricing error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get pricing information",
    });
  }
};

/**
 * Get subscription status
 * GET /api/payment/subscription/:customerId
 */
export const handleGetSubscription: RequestHandler = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    const subscription = await stripeService.getSubscriptionStatus(customerId);

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: "No active subscription found",
      });
    }

    res.json({
      success: true,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get subscription status",
    });
  }
};

/**
 * Cancel subscription
 * POST /api/payment/cancel-subscription
 */
export const handleCancelSubscription: RequestHandler = async (req, res) => {
  try {
    const { subscriptionId, immediately } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Subscription ID is required",
      });
    }

    await stripeService.cancelSubscription(
      subscriptionId,
      immediately || false,
    );

    res.json({
      success: true,
      message: immediately
        ? "Subscription cancelled immediately"
        : "Subscription will cancel at the end of the current period",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription",
    });
  }
};

/**
 * Get payment history
 * GET /api/payment/history/:customerId
 */
export const handleGetPaymentHistory: RequestHandler = async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // In a real implementation, you would fetch from Stripe
    // For demo purposes, return mock data
    res.json({
      success: true,
      payments: [
        {
          id: "pi_1234567890",
          amount: 1900,
          currency: "usd",
          status: "succeeded",
          created: new Date().toISOString(),
          description: "FlowForge AI Pro - Monthly",
        },
      ],
      pagination: {
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to get payment history",
    });
  }
};
