import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleWorkflowGeneration,
  handleWorkflowHistory,
  handleWorkflowTemplates,
  handleWorkflowValidation,
} from "./routes/workflow";
import {
  handleCreateCheckoutSession,
  handleCreatePortalSession,
  handleStripeWebhook,
  handleGetPricing,
  handleGetSubscription,
  handleCancelSubscription,
  handleGetPaymentHistory,
} from "./routes/payment";
import {
  handleTrackEvent,
  handleTrackMetric,
  handleGetUserAnalytics,
  handleGetBusinessMetrics,
  handleGetConversionFunnel,
  handleGetPlatformAnalytics,
} from "./routes/analytics";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Workflow generation routes
  app.post("/api/generate-workflow", handleWorkflowGeneration);
  app.get("/api/workflows/history/:userId", handleWorkflowHistory);
  app.get("/api/workflows/templates", handleWorkflowTemplates);
  app.post("/api/workflows/validate", handleWorkflowValidation);

  // Payment processing routes
  app.post("/api/payment/create-checkout-session", handleCreateCheckoutSession);
  app.post("/api/payment/create-portal-session", handleCreatePortalSession);
  app.post(
    "/api/payment/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
  );
  app.get("/api/payment/pricing", handleGetPricing);
  app.get("/api/payment/subscription/:customerId", handleGetSubscription);
  app.post("/api/payment/cancel-subscription", handleCancelSubscription);
  app.get("/api/payment/history/:customerId", handleGetPaymentHistory);

  // Analytics and tracking routes
  app.post("/api/analytics/track", handleTrackEvent);
  app.post("/api/analytics/metrics", handleTrackMetric);
  app.get("/api/analytics/user/:userId", handleGetUserAnalytics);
  app.get("/api/analytics/business", handleGetBusinessMetrics);
  app.get("/api/analytics/funnel", handleGetConversionFunnel);
  app.get("/api/analytics/platforms", handleGetPlatformAnalytics);

  return app;
}
