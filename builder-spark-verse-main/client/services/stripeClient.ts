import { loadStripe, Stripe } from "@stripe/stripe-js";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_demo_key",
);

export interface CheckoutSessionRequest {
  plan: "pro" | "enterprise";
  interval: "monthly" | "yearly";
  userId: string;
  userEmail: string;
  discountPercent?: number;
}

export interface PricingPlan {
  name: string;
  description: string;
  features: string[];
  monthly: {
    price: number;
    priceId: string;
  };
  yearly: {
    price: number;
    priceId: string;
    savings: number;
  };
}

class StripeClientService {
  private stripe: Stripe | null = null;

  async initialize(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await stripePromise;
    }
    return this.stripe;
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(request: CheckoutSessionRequest): Promise<void> {
    try {
      const stripe = await this.initialize();
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      // Create checkout session on backend
      const response = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const { success, sessionId, url, error } = await response.json();

      if (!success) {
        throw new Error(error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      throw error;
    }
  }

  /**
   * Redirect to Customer Portal
   */
  async redirectToPortal(customerId: string): Promise<void> {
    try {
      const response = await fetch("/api/payment/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      const { success, url, error } = await response.json();

      if (!success) {
        throw new Error(error || "Failed to create portal session");
      }

      window.location.href = url;
    } catch (error) {
      console.error("Stripe portal error:", error);
      throw error;
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<{ pro: PricingPlan; enterprise: PricingPlan }> {
    try {
      const response = await fetch("/api/payment/pricing");
      const { success, plans, error } = await response.json();

      if (!success) {
        throw new Error(error || "Failed to get pricing");
      }

      return plans;
    } catch (error) {
      console.error("Get pricing error:", error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(customerId: string): Promise<{
    status: string;
    plan: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null> {
    try {
      const response = await fetch(`/api/payment/subscription/${customerId}`);
      const { success, subscription, error } = await response.json();

      if (!success) {
        throw new Error(error || "Failed to get subscription");
      }

      return subscription;
    } catch (error) {
      console.error("Get subscription error:", error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<void> {
    try {
      const response = await fetch("/api/payment/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId,
          immediately,
        }),
      });

      const { success, error } = await response.json();

      if (!success) {
        throw new Error(error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      throw error;
    }
  }

  /**
   * Calculate price with discount
   */
  calculateDiscountedPrice(
    originalPrice: number,
    discountPercent: number,
  ): {
    discountedPrice: number;
    savings: number;
  } {
    const savings = (originalPrice * discountPercent) / 100;
    const discountedPrice = originalPrice - savings;

    return {
      discountedPrice: Math.round(discountedPrice),
      savings: Math.round(savings),
    };
  }

  /**
   * Format price for display
   */
  formatPrice(priceInCents: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(priceInCents / 100);
  }

  /**
   * Track conversion events
   */
  trackConversion(event: string, data: any): void {
    // In production, you would send this to your analytics service
    console.log("Conversion event:", event, data);

    // Example: Send to Google Analytics, Mixpanel, etc.
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
        value: data.value,
        currency: data.currency,
        transaction_id: data.sessionId,
      });
    }
  }
}

export const stripeClientService = new StripeClientService();
