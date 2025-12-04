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
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  Target,
  Shield,
  Users,
  Rocket,
  Code2,
  Layers,
  Settings,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView, useOnboardingAnalytics } from "@/hooks/useAnalytics";

const PLATFORM_DATA = {
  n8n: {
    name: "n8n",
    description: "Open-source workflow automation",
    icon: Code2,
    color: "bg-red-100 text-red-700 border-red-200",
    features: [
      "Self-hosted",
      "Open source",
      "Advanced customization",
      "Developer-friendly",
    ],
  },
  zapier: {
    name: "Zapier",
    description: "Popular automation platform",
    icon: Zap,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    features: ["Easy to use", "Large app ecosystem", "No-code", "Quick setup"],
  },
  make: {
    name: "Make",
    description: "Visual workflow builder",
    icon: Layers,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    features: [
      "Visual designer",
      "Advanced routing",
      "Data transformation",
      "Conditional logic",
    ],
  },
  power_automate: {
    name: "Power Automate",
    description: "Microsoft's automation tool",
    icon: Settings,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    features: [
      "Microsoft integration",
      "Enterprise features",
      "Office 365",
      "SharePoint connectors",
    ],
  },
  exploring: {
    name: "Other/Exploring",
    description: "I'm exploring different options",
    icon: Target,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    features: [
      "Compare platforms",
      "Try different tools",
      "Learn automation",
      "Find best fit",
    ],
  },
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const {
    trackOnboardingStarted,
    trackPlatformSelected,
    trackOnboardingCompleted,
  } = useOnboardingAnalytics();

  // Track page view
  usePageView("onboarding");

  // Track onboarding start
  useEffect(() => {
    trackOnboardingStarted();
  }, [trackOnboardingStarted]);

  // Redirect if user already completed onboarding
  useEffect(() => {
    if (userProfile?.primaryPlatform) {
      navigate("/dashboard");
    }
  }, [userProfile, navigate]);

  const calculateUsageLimits = (primaryPlatform: string) => {
    const platforms = ["n8n", "zapier", "make", "power_automate"];
    const limits: Record<
      string,
      { used: number; limit: number; isPrimary: boolean }
    > = {};

    platforms.forEach((platform) => {
      if (platform === primaryPlatform) {
        limits[platform] = { used: 0, limit: 3, isPrimary: true }; // Primary gets LESS
      } else {
        limits[platform] = { used: 0, limit: 10, isPrimary: false }; // Others get MORE
      }
    });

    return limits;
  };

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    trackPlatformSelected(platform);
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedPlatform) {
      setCurrentStep(3);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!selectedPlatform) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const usageLimits = calculateUsageLimits(
        selectedPlatform === "exploring" ? "n8n" : selectedPlatform,
      );
      const finalPlatform =
        selectedPlatform === "exploring" ? "n8n" : selectedPlatform;

      await updateUserProfile({
        primaryPlatform: finalPlatform,
        usage: usageLimits,
      });

      // Track onboarding completion
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackOnboardingCompleted(finalPlatform, timeSpent);

      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlowForge AI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Step {currentStep} of 3</div>
            <Progress value={(currentStep / 3) * 100} className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to FlowForge AI! 🚀
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                You're about to join 50,000+ developers who've revolutionized
                their automation workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Generate workflows in 30 seconds
                  </h3>
                  <p className="text-gray-600 text-sm">
                    AI-powered generation for instant results
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Save 20+ hours per month
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Focus on what matters, automate the rest
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Works with all major platforms
                  </h3>
                  <p className="text-gray-600 text-sm">
                    n8n, Zapier, Make, Power Automate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              size="lg"
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Let's get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Platform Selection (THE PSYCHOLOGICAL HOOK) */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Which automation platform do you primarily use?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                This helps us personalize your experience and show you the most
                relevant features for your workflow automation needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Object.entries(PLATFORM_DATA).map(([key, platform]) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform === key;

                return (
                  <Card
                    key={key}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      isSelected
                        ? "ring-2 ring-blue-500 shadow-lg scale-105"
                        : "hover:scale-102",
                    )}
                    onClick={() => handlePlatformSelect(key)}
                  >
                    <CardHeader className="text-center">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4",
                          platform.color,
                        )}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <CardTitle className="text-xl">{platform.name}</CardTitle>
                      <CardDescription className="text-base">
                        {platform.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {platform.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center space-x-2 text-sm text-gray-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedPlatform && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Continue with{" "}
                  {
                    PLATFORM_DATA[
                      selectedPlatform as keyof typeof PLATFORM_DATA
                    ].name
                  }
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Usage Limits Display (THE PSYCHOLOGICAL TRIGGER) */}
        {currentStep === 3 && selectedPlatform && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your FlowForge AI account is ready! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                Here are your monthly workflow allowances on the free plan
              </p>
            </div>

            <Card className="mb-8 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  Your monthly workflow allowances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(
                    calculateUsageLimits(
                      selectedPlatform === "exploring"
                        ? "n8n"
                        : selectedPlatform,
                    ),
                  ).map(([platform, data]) => {
                    const platformInfo =
                      PLATFORM_DATA[platform as keyof typeof PLATFORM_DATA];
                    if (!platformInfo) return null;

                    const Icon = platformInfo.icon;
                    const isPrimary = data.isPrimary;

                    return (
                      <Card
                        key={platform}
                        className={cn(
                          "relative",
                          isPrimary
                            ? "border-red-200 bg-red-50"
                            : "border-green-200 bg-green-50",
                        )}
                      >
                        {isPrimary && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-2 left-4 bg-red-500"
                          >
                            Your Main Platform
                          </Badge>
                        )}
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                platformInfo.color,
                              )}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {platformInfo.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {platformInfo.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div
                              className={cn(
                                "text-3xl font-bold mb-2",
                                isPrimary ? "text-red-700" : "text-green-700",
                              )}
                            >
                              {data.limit}
                            </div>
                            <div className="text-sm text-gray-600">
                              workflows per month
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      💎 Want unlimited workflows on all platforms?
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Pro for unlimited workflow generation across
                      all platforms
                    </p>
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      See Pro features
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                size="lg"
                onClick={handleCompleteOnboarding}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Start generating workflows{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                You can always change your platform preferences later
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
