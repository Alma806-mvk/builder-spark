import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_demo_key", {
  apiVersion: "2024-12-18.acacia",
});

export interface CreateCheckoutSessionRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  discountPercent?: number;
}

export interface CreatePortalSessionRequest {
  customerId: string;
  returnUrl: string;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

class StripeService {
  // Stripe Price IDs (these would be real price IDs from Stripe Dashboard)
  private readonly priceIds = {
    pro_monthly: "price_1234567890_pro_monthly",
    pro_yearly: "price_1234567890_pro_yearly",
    enterprise_monthly: "price_1234567890_enterprise_monthly",
    enterprise_yearly: "price_1234567890_enterprise_yearly",
  };

  /**
   * Create a Stripe Checkout session for subscription
   */
  async createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: request.priceId,
            quantity: 1,
          },
        ],
        customer_email: request.userEmail,
        client_reference_id: request.userId,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        metadata: {
          userId: request.userId,
          plan: this.getPlanFromPriceId(request.priceId),
        },
        subscription_data: {
          metadata: {
            userId: request.userId,
            plan: this.getPlanFromPriceId(request.priceId),
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        automatic_tax: {
          enabled: true,
        },
      };

      // Apply discount if provided
      if (request.discountPercent && request.discountPercent > 0) {
        const coupon = await this.createDiscountCoupon(request.discountPercent);
        sessionParams.discounts = [{ coupon: coupon.id }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.id || !session.url) {
        throw new Error("Failed to create checkout session");
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error("Stripe checkout session creation failed:", error);
      throw new Error(
        `Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a customer portal session for subscription management
   */
  async createPortalSession(
    request: CreatePortalSessionRequest,
  ): Promise<{ url: string }> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: request.customerId,
        return_url: request.returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      console.error("Stripe portal session creation failed:", error);
      throw new Error(
        `Failed to create portal session: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error("Invalid webhook signature");
    }

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Get subscription status for a customer
   */
  async getSubscriptionStatus(customerId: string): Promise<{
    status: string;
    plan: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;

      return {
        status: subscription.status,
        plan: this.getPlanFromPriceId(priceId || ""),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      return null;
    }
  }

  /**
   * Create a discount coupon
   */
  private async createDiscountCoupon(
    percentOff: number,
  ): Promise<Stripe.Coupon> {
    return await stripe.coupons.create({
      percent_off: percentOff,
      duration: "once",
      name: `${percentOff}% off FlowForge AI`,
    });
  }

  /**
   * Get plan name from Stripe price ID
   */
  private getPlanFromPriceId(priceId: string): string {
    if (priceId.includes("pro")) return "pro";
    if (priceId.includes("enterprise")) return "enterprise";
    return "free";
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.client_reference_id || session.metadata?.userId;
    const customerId = session.customer as string;

    if (!userId) {
      console.error("No user ID found in checkout session");
      return;
    }

    console.log(
      `Checkout completed for user ${userId}, customer ${customerId}`,
    );

    // Here you would update the user's subscription status in your database
    // For demo purposes, we'll just log it
    // await updateUserSubscription(userId, {
    //   customerId,
    //   status: 'active',
    //   plan: session.metadata?.plan || 'pro'
    // });
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;
    const userId = subscription.metadata.userId;

    console.log(`Subscription created for user ${userId}`);

    // Update user's plan and usage limits
    // await updateUserPlan(userId, subscription.metadata.plan);
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = subscription.metadata.userId;

    console.log(`Subscription updated for user ${userId}`);

    // Handle plan changes, cancellations, etc.
    if (subscription.cancel_at_period_end) {
      console.log(`Subscription will cancel at period end for user ${userId}`);
    }
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = subscription.metadata.userId;

    console.log(`Subscription deleted for user ${userId}`);

    // Downgrade user to free plan
    // await updateUserPlan(userId, 'free');
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    console.log(`Payment succeeded for customer ${customerId}`);

    // Update payment history, send receipts, etc.
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    console.log(`Payment failed for customer ${customerId}`);

    // Send failed payment notifications, retry logic, etc.
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<void> {
    try {
      if (immediately) {
        await stripe.subscriptions.cancel(subscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  /**
   * Get available plans and pricing
   */
  getPricingPlans() {
    return {
      pro: {
        monthly: {
          priceId: this.priceIds.pro_monthly,
          amount: 1900, // $19.00 in cents
          currency: "usd",
          interval: "month",
        },
        yearly: {
          priceId: this.priceIds.pro_yearly,
          amount: 19000, // $190.00 in cents (save $38)
          currency: "usd",
          interval: "year",
        },
      },
      enterprise: {
        monthly: {
          priceId: this.priceIds.enterprise_monthly,
          amount: 14900, // $149.00 in cents
          currency: "usd",
          interval: "month",
        },
        yearly: {
          priceId: this.priceIds.enterprise_yearly,
          amount: 149000, // $1490.00 in cents (save $298)
          currency: "usd",
          interval: "year",
        },
      },
    };
  }
}

export const stripeService = new StripeService();
