import { RequestHandler } from "express";
import { z } from "zod";
import {
  openaiService,
  WorkflowGenerationRequest,
} from "../services/openaiService";

// Validation schema for workflow generation request
const WorkflowGenerationSchema = z.object({
  input: z
    .string()
    .min(10, "Workflow description must be at least 10 characters")
    .max(2000, "Workflow description too long"),
  platform: z.enum(["n8n", "zapier", "make", "power_automate"], {
    errorMap: () => ({
      message: "Platform must be one of: n8n, zapier, make, power_automate",
    }),
  }),
  userId: z.string().min(1, "User ID is required"),
});

export interface WorkflowGenerationBody {
  input: string;
  platform: "n8n" | "zapier" | "make" | "power_automate";
  userId: string;
}

/**
 * Generate workflow using AI
 * POST /api/generate-workflow
 */
export const handleWorkflowGeneration: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validationResult = WorkflowGenerationSchema.safeParse(req.body);

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

    const { input, platform, userId } = validationResult.data;

    // Rate limiting check (in production, implement proper rate limiting)
    if (req.rateLimit && req.rateLimit.remaining === 0) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: req.rateLimit.reset,
      });
    }

    // Log the request for analytics
    console.log(`Workflow generation request:`, {
      userId,
      platform,
      inputLength: input.length,
      timestamp: new Date().toISOString(),
    });

    // Generate workflow using OpenAI service
    const generationRequest: WorkflowGenerationRequest = {
      input: input.trim(),
      platform,
      userId,
    };

    const result = await openaiService.generateWorkflow(generationRequest);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to generate workflow",
        platform,
        retryable: true,
      });
    }

    // Log successful generation for analytics
    console.log(`Workflow generated successfully:`, {
      userId,
      platform,
      nodesCount: result.metadata.nodesCount,
      complexity: result.metadata.complexity,
      tokensUsed: result.metadata.tokensUsed,
      generationTime: result.metadata.generationTime,
    });

    // Return successful response
    res.json({
      success: true,
      workflow: result.workflow,
      metadata: {
        platform: result.metadata.platform,
        nodesCount: result.metadata.nodesCount,
        complexity: result.metadata.complexity,
        generationTime: result.metadata.generationTime,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Workflow generation error:", error);

    // Return error response
    res.status(500).json({
      success: false,
      error: "Internal server error during workflow generation",
      message:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : "Please try again later",
      retryable: true,
    });
  }
};

/**
 * Get workflow generation history for user
 * GET /api/workflows/history/:userId
 */
export const handleWorkflowHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // In a real implementation, this would query a database
    // For demo purposes, return mock data
    const mockHistory = [
      {
        id: "wf_1",
        platform: "zapier",
        input: "Send Slack notification when GitHub issue is created",
        createdAt: new Date().toISOString(),
        complexity: "simple",
        nodesCount: 3,
      },
      {
        id: "wf_2",
        platform: "n8n",
        input: "Sync customer data between Salesforce and HubSpot",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        complexity: "complex",
        nodesCount: 8,
      },
    ];

    res.json({
      success: true,
      workflows: mockHistory.slice(offset, offset + limit),
      pagination: {
        total: mockHistory.length,
        limit,
        offset,
        hasMore: offset + limit < mockHistory.length,
      },
    });
  } catch (error) {
    console.error("Workflow history error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch workflow history",
    });
  }
};

/**
 * Get workflow templates for inspiration
 * GET /api/workflows/templates
 */
export const handleWorkflowTemplates: RequestHandler = async (req, res) => {
  try {
    const { platform, category } = req.query;

    const templates = [
      {
        id: "template_1",
        title: "GitHub to Slack Notifications",
        description: "Get notified in Slack when issues are created or updated",
        platform: "zapier",
        category: "productivity",
        complexity: "simple",
        estimatedTime: "2 minutes",
      },
      {
        id: "template_2",
        title: "Customer Data Sync",
        description: "Sync customer information between CRM systems",
        platform: "n8n",
        category: "crm",
        complexity: "medium",
        estimatedTime: "5 minutes",
      },
      {
        id: "template_3",
        title: "Email Campaign Automation",
        description: "Trigger email campaigns based on user behavior",
        platform: "make",
        category: "marketing",
        complexity: "complex",
        estimatedTime: "10 minutes",
      },
      {
        id: "template_4",
        title: "Document Approval Workflow",
        description: "Automate document approval process with notifications",
        platform: "power_automate",
        category: "business",
        complexity: "medium",
        estimatedTime: "7 minutes",
      },
    ];

    let filteredTemplates = templates;

    if (platform) {
      filteredTemplates = filteredTemplates.filter(
        (t) => t.platform === platform,
      );
    }

    if (category) {
      filteredTemplates = filteredTemplates.filter(
        (t) => t.category === category,
      );
    }

    res.json({
      success: true,
      templates: filteredTemplates,
      categories: ["productivity", "crm", "marketing", "business"],
      platforms: ["n8n", "zapier", "make", "power_automate"],
    });
  } catch (error) {
    console.error("Workflow templates error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch workflow templates",
    });
  }
};

/**
 * Validate workflow configuration
 * POST /api/workflows/validate
 */
export const handleWorkflowValidation: RequestHandler = async (req, res) => {
  try {
    const { workflow, platform } = req.body;

    if (!workflow || !platform) {
      return res.status(400).json({
        success: false,
        error: "Workflow and platform are required",
      });
    }

    // Use the OpenAI service validation
    const validation = (openaiService as any).validateWorkflow(
      workflow,
      platform,
    );

    if (validation.valid) {
      res.json({
        success: true,
        valid: true,
        message: "Workflow validation passed",
      });
    } else {
      res.json({
        success: true,
        valid: false,
        errors: validation.errors,
        suggestions: [
          "Check the workflow structure matches the platform schema",
          "Ensure all required fields are present",
          "Verify node connections are properly defined",
        ],
      });
    }
  } catch (error) {
    console.error("Workflow validation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to validate workflow",
    });
  }
};
