/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Workflow Generation API Types
export interface WorkflowGenerationRequest {
  input: string;
  platform: "n8n" | "zapier" | "make" | "power_automate";
  userId: string;
}

export interface WorkflowGenerationResponse {
  success: boolean;
  workflow?: any;
  metadata?: {
    platform: string;
    nodesCount: number;
    complexity: "simple" | "medium" | "complex";
    generationTime: number;
    generatedAt: string;
  };
  error?: string;
  retryable?: boolean;
}

export interface WorkflowHistoryResponse {
  success: boolean;
  workflows?: {
    id: string;
    platform: string;
    input: string;
    createdAt: string;
    complexity: string;
    nodesCount: number;
  }[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  platform: string;
  category: string;
  complexity: "simple" | "medium" | "complex";
  estimatedTime: string;
}

export interface WorkflowTemplatesResponse {
  success: boolean;
  templates?: WorkflowTemplate[];
  categories?: string[];
  platforms?: string[];
  error?: string;
}

export interface WorkflowValidationRequest {
  workflow: any;
  platform: string;
}

export interface WorkflowValidationResponse {
  success: boolean;
  valid?: boolean;
  errors?: string[];
  suggestions?: string[];
  error?: string;
}
