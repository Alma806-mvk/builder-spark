import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  Rocket,
  LogOut,
  Crown,
  Code2,
  Layers,
  Settings,
  Target,
  Copy,
  Download,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage, useConversionOptimization } from "@/hooks/useUsage";
import { UpgradeModal } from "@/components/payment/UpgradeModal";

interface WorkflowResult {
  id: string;
  platform: string;
  input: string;
  workflow: any;
  createdAt: string;
  complexity: "simple" | "medium" | "complex";
}

const PLATFORM_DATA = {
  n8n: {
    name: "n8n",
    icon: Code2,
    color: "bg-red-100 text-red-700 border-red-200",
    description: "Open-source workflow automation",
  },
  zapier: {
    name: "Zapier",
    icon: Zap,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    description: "Popular automation platform",
  },
  make: {
    name: "Make",
    icon: Layers,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Visual workflow builder",
  },
  power_automate: {
    name: "Power Automate",
    icon: Settings,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Microsoft's automation tool",
  },
};

export default function Dashboard() {
  const [workflowInput, setWorkflowInput] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] =
    useState<WorkflowResult | null>(null);
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowResult[]>([]);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<
    "pro" | "enterprise"
  >("pro");

  const { currentUser, userProfile, logout } = useAuth();
  const { usage, checkLimit, incrementUsage, usageSummary } = useUsage();
  const { shouldShowUpgradePrompt, getOptimalUpgradeOffer } =
    useConversionOptimization();
  const navigate = useNavigate();

  // Redirect if not logged in or no profile
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    } else if (userProfile && !userProfile.primaryPlatform) {
      navigate("/onboarding");
    } else if (userProfile?.primaryPlatform) {
      setSelectedPlatform(userProfile.primaryPlatform);
    }
  }, [currentUser, userProfile, navigate]);

  // Mock data for demonstration
  useEffect(() => {
    setRecentWorkflows([
      {
        id: "1",
        platform: "zapier",
        input: "Send Slack notification when GitHub issue is created",
        workflow: { nodes: 3, triggers: 1 },
        createdAt: new Date().toISOString(),
        complexity: "simple",
      },
      {
        id: "2",
        platform: "n8n",
        input: "Sync customer data between Salesforce and HubSpot",
        workflow: { nodes: 8, triggers: 2 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        complexity: "complex",
      },
    ]);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleGenerateWorkflow = async () => {
    if (!workflowInput.trim() || !selectedPlatform) return;

    const usageCheck = checkLimit(selectedPlatform);

    if (!usageCheck.allowed) {
      setError(
        usageCheck.message ||
          "Usage limit reached. Please upgrade to continue.",
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Call the real workflow generation API
      const response = await fetch("/api/generate-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: workflowInput,
          platform: selectedPlatform,
          userId: userProfile!.uid,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate workflow");
      }

      const mockWorkflow = {
        id: Date.now().toString(),
        platform: selectedPlatform,
        input: workflowInput,
        workflow: {
          nodes: result.metadata?.nodesCount || 3,
          triggers: 1,
          json: JSON.stringify(result.workflow, null, 2),
        },
        createdAt: new Date().toISOString(),
        complexity: result.metadata?.complexity || "simple",
      };

      setGeneratedWorkflow(mockWorkflow);
      setRecentWorkflows((prev) => [mockWorkflow, ...prev.slice(0, 4)]);

      // Update usage count using the service
      try {
        await incrementUsage(selectedPlatform);
      } catch (usageError) {
        console.error("Failed to update usage:", usageError);
        // Don't block the user experience for usage tracking errors
      }

      setWorkflowInput("");
    } catch (error) {
      console.error("Error generating workflow:", error);
      setError("Failed to generate workflow. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const usageData = usage
    ? Object.entries(usage).map(([platform, data]) => ({
        platform,
        ...data,
        percentage: (data.used / data.limit) * 100,
      }))
    : [];

  const upgradePrompt = shouldShowUpgradePrompt();
  const upgradeOffer = getOptimalUpgradeOffer();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FlowForge AI
              </span>
            </div>
            {userProfile.plan === "free" && (
              <Badge
                variant="outline"
                className="border-blue-200 text-blue-700"
              >
                Free Plan
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome back, {userProfile.displayName}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Workflow Generator */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Generate your next workflow</span>
                </CardTitle>
                <CardDescription>
                  Describe what you want to automate in plain English, and our
                  AI will generate the perfect workflow for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Describe your workflow
                    </label>
                    <Textarea
                      value={workflowInput}
                      onChange={(e) => setWorkflowInput(e.target.value)}
                      placeholder="Example: Send Slack notification when new GitHub issue is created with high priority label"
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Target platform
                    </label>
                    <Select
                      value={selectedPlatform}
                      onValueChange={setSelectedPlatform}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORM_DATA).map(
                          ([key, platform]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <platform.icon className="w-4 h-4" />
                                <span>{platform.name}</span>
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateWorkflow}
                  disabled={
                    isGenerating || !workflowInput.trim() || !selectedPlatform
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating workflow...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Workflow
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Workflow Result */}
            {generatedWorkflow && (
              <Card className="shadow-lg border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Workflow Generated Successfully!</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your {generatedWorkflow.platform} workflow is ready to use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        {generatedWorkflow.workflow.nodes}
                      </div>
                      <div className="text-sm text-green-600">Nodes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        {generatedWorkflow.workflow.triggers}
                      </div>
                      <div className="text-sm text-green-600">Triggers</div>
                    </div>
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700 capitalize"
                      >
                        {generatedWorkflow.complexity}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                    <pre>{generatedWorkflow.workflow.json}</pre>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in{" "}
                      {
                        PLATFORM_DATA[
                          generatedWorkflow.platform as keyof typeof PLATFORM_DATA
                        ].name
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Workflows */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span>Recent Workflows</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentWorkflows.map((workflow) => {
                    const platformData =
                      PLATFORM_DATA[
                        workflow.platform as keyof typeof PLATFORM_DATA
                      ];
                    const Icon = platformData.icon;

                    return (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              platformData.color,
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">
                              {workflow.input}
                            </div>
                            <div className="text-sm text-gray-500">
                              {platformData.name} •{" "}
                              {new Date(
                                workflow.createdAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {workflow.complexity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Display */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">This month's usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageData.map((usage) => {
                  const platformData =
                    PLATFORM_DATA[usage.platform as keyof typeof PLATFORM_DATA];
                  const Icon = platformData.icon;
                  const isAtLimit =
                    usage.used >= usage.limit && userProfile.plan === "free";

                  return (
                    <div key={usage.platform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">
                            {platformData.name}
                          </span>
                          {usage.isPrimary && (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="text-xs border-blue-200 text-blue-700"
                            >
                              Primary
                            </Badge>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isAtLimit ? "text-red-600" : "text-gray-600",
                          )}
                        >
                          {usage.used}/{usage.limit}
                        </span>
                      </div>
                      <Progress
                        value={usage.percentage}
                        className={cn("h-2", isAtLimit && "bg-red-100")}
                      />
                      {isAtLimit && (
                        <p className="text-xs text-red-600">Limit reached</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Smart Upgrade Prompt */}
            {userProfile.plan === "free" && upgradePrompt.show && (
              <Card
                className={cn(
                  "shadow-lg",
                  upgradePrompt.type === "urgent"
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50"
                    : upgradePrompt.type === "exploration"
                      ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                      : "border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50",
                )}
              >
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "flex items-center space-x-2",
                      upgradePrompt.type === "urgent"
                        ? "text-red-800"
                        : upgradePrompt.type === "exploration"
                          ? "text-green-800"
                          : "text-blue-800",
                    )}
                  >
                    <Crown className="w-5 h-5" />
                    <span>
                      {upgradePrompt.type === "urgent"
                        ? "Workflow Limit Reached!"
                        : upgradePrompt.type === "exploration"
                          ? `Loving ${upgradePrompt.platform}?`
                          : "Unlock unlimited workflows"}
                    </span>
                  </CardTitle>
                  <CardDescription
                    className={cn(
                      upgradePrompt.type === "urgent"
                        ? "text-red-700"
                        : upgradePrompt.type === "exploration"
                          ? "text-green-700"
                          : "text-blue-700",
                    )}
                  >
                    {upgradePrompt.message}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upgradeOffer.urgency && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm font-medium text-yellow-800">
                          {upgradeOffer.urgency}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {upgradeOffer.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 text-sm text-gray-800"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={cn(
                        "w-full",
                        upgradePrompt.type === "urgent"
                          ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                          : upgradePrompt.type === "exploration"
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      )}
                      onClick={() => {
                        setUpgradeModalPlan("pro");
                        setShowUpgradeModal(true);
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {upgradeOffer.discount > 0
                        ? `Upgrade to Pro - ${upgradeOffer.discount}% off!`
                        : "Upgrade to Pro - $19/month"}
                    </Button>

                    <p className="text-xs text-center opacity-75">
                      💡 Save 20+ hours/month vs building manually
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Default Upgrade Prompt for users who don't trigger smart prompts */}
            {userProfile.plan === "free" && !upgradePrompt.show && (
              <Card className="shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Crown className="w-5 h-5" />
                    <span>Unlock unlimited workflows</span>
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Generate unlimited workflows on all platforms with Pro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Unlimited workflows</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Advanced templates</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => {
                        setUpgradeModalPlan("pro");
                        setShowUpgradeModal(true);
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro - $19/month
                    </Button>
                    <p className="text-xs text-blue-600 text-center">
                      💡 Save 20+ hours/month vs building manually
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total workflows</span>
                  <span className="font-medium">{recentWorkflows.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This month</span>
                  <span className="font-medium">
                    {usageSummary?.totalUsed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Primary platform
                  </span>
                  <span className="font-medium">
                    {usageSummary?.primaryPlatformUsage || 0} workflows
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success rate</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
                {usageSummary && usageSummary.platformsAtLimit.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Platforms at limit
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {usageSummary.platformsAtLimit.length}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        defaultPlan={upgradeModalPlan}
        urgency={upgradePrompt.show ? upgradeOffer.urgency : undefined}
        discount={upgradePrompt.show ? upgradeOffer.discount : 0}
        trigger={
          upgradePrompt.show
            ? upgradePrompt.type === "urgent"
              ? "primary_platform_limit"
              : "secondary_platform_limit"
            : "general"
        }
      />
    </div>
  );
}
