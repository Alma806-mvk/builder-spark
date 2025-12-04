import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Crown,
  Check,
  Zap,
  Shield,
  Users,
  Building2,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { stripeClientService, PricingPlan } from "@/services/stripeClient";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "pro" | "enterprise";
  urgency?: string;
  discount?: number;
  trigger?: "primary_platform_limit" | "secondary_platform_limit" | "general";
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = "pro",
  urgency,
  discount = 0,
  trigger = "general",
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "enterprise">(
    defaultPlan,
  );
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState<{
    pro: PricingPlan;
    enterprise: PricingPlan;
  } | null>(null);

  const { userProfile } = useAuth();

  // Load pricing on mount
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricingData = await stripeClientService.getPricing();
        setPricing(pricingData);
      } catch (error) {
        console.error("Failed to load pricing:", error);
        setError("Failed to load pricing information");
      }
    };

    if (isOpen) {
      loadPricing();
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    if (!userProfile || !pricing) return;

    setIsLoading(true);
    setError("");

    try {
      await stripeClientService.redirectToCheckout({
        plan: selectedPlan,
        interval: isYearly ? "yearly" : "monthly",
        userId: userProfile.uid,
        userEmail: userProfile.email,
        discountPercent: discount,
      });

      // Track conversion attempt
      stripeClientService.trackConversion("upgrade_initiated", {
        plan: selectedPlan,
        interval: isYearly ? "yearly" : "monthly",
        trigger,
        discount,
        userId: userProfile.uid,
      });
    } catch (error) {
      console.error("Upgrade error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start upgrade process",
      );
      setIsLoading(false);
    }
  };

  const getDiscountedPrice = (originalPrice: number) => {
    if (discount <= 0) return originalPrice;
    return stripeClientService.calculateDiscountedPrice(
      originalPrice,
      discount,
    );
  };

  const formatPrice = (price: number) => {
    return stripeClientService.formatPrice(price * 100);
  };

  if (!pricing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentPlan = pricing[selectedPlan];
  const currentPrice = isYearly
    ? currentPlan.yearly.price
    : currentPlan.monthly.price;
  const discountedPrice =
    discount > 0 ? getDiscountedPrice(currentPrice) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Crown className="w-6 h-6 text-blue-600" />
            <span>
              Upgrade to FlowForge AI{" "}
              {selectedPlan === "pro" ? "Pro" : "Enterprise"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {trigger === "primary_platform_limit"
              ? "You've hit your workflow limit! Upgrade for unlimited access to your main platform."
              : trigger === "secondary_platform_limit"
                ? "Loving the platform? Upgrade for unlimited workflows everywhere!"
                : "Unlock the full power of AI-powered workflow automation"}
          </DialogDescription>
        </DialogHeader>

        {urgency && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 font-medium">
              {urgency}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Plan Selection */}
        <Tabs
          value={selectedPlan}
          onValueChange={(value) =>
            setSelectedPlan(value as "pro" | "enterprise")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pro" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Pro</span>
            </TabsTrigger>
            <TabsTrigger
              value="enterprise"
              className="flex items-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Enterprise</span>
            </TabsTrigger>
          </TabsList>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 my-6">
            <Label
              htmlFor="billing-toggle"
              className={cn(!isYearly && "font-semibold")}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label
              htmlFor="billing-toggle"
              className={cn(isYearly && "font-semibold")}
            >
              Yearly
              <Badge
                variant="secondary"
                className="ml-2 bg-green-100 text-green-800"
              >
                Save 20%
              </Badge>
            </Label>
          </div>

          <TabsContent value="pro">
            <Card className="border-2 border-blue-200">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>

                <div className="mt-4">
                  {discountedPrice && discount > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(currentPrice)}
                        {isYearly ? "/year" : "/month"}
                      </div>
                      <div className="text-4xl font-bold text-green-600">
                        {formatPrice(discountedPrice.discountedPrice)}
                        <span className="text-lg text-gray-600">
                          {isYearly ? "/year" : "/month"}
                        </span>
                      </div>
                      <Badge variant="destructive" className="bg-red-500">
                        Save {formatPrice(discountedPrice.savings)} ({discount}%
                        off)
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(currentPrice)}
                      <span className="text-lg text-gray-600">
                        {isYearly ? "/year" : "/month"}
                      </span>
                    </div>
                  )}

                  {isYearly && (
                    <div className="text-sm text-green-600 mt-2">
                      Save{" "}
                      {formatPrice(
                        currentPlan.monthly.price * 12 -
                          currentPlan.yearly.price,
                      )}{" "}
                      compared to monthly
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {currentPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise">
            <Card className="border-2 border-purple-200">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Enterprise Plan</CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>

                <div className="mt-4">
                  {discountedPrice && discount > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(currentPrice)}
                        {isYearly ? "/year" : "/month"}
                      </div>
                      <div className="text-4xl font-bold text-green-600">
                        {formatPrice(discountedPrice.discountedPrice)}
                        <span className="text-lg text-gray-600">
                          {isYearly ? "/year" : "/month"}
                        </span>
                      </div>
                      <Badge variant="destructive" className="bg-red-500">
                        Save {formatPrice(discountedPrice.savings)} ({discount}%
                        off)
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(currentPrice)}
                      <span className="text-lg text-gray-600">
                        {isYearly ? "/year" : "/month"}
                      </span>
                    </div>
                  )}

                  {isYearly && (
                    <div className="text-sm text-green-600 mt-2">
                      Save{" "}
                      {formatPrice(
                        currentPlan.monthly.price * 12 -
                          currentPlan.yearly.price,
                      )}{" "}
                      compared to monthly
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {currentPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className={cn(
              "flex-1",
              selectedPlan === "pro"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to {selectedPlan === "pro" ? "Pro" : "Enterprise"}
              </>
            )}
          </Button>
        </div>

        {/* Guarantee */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>14-day money-back guarantee • Cancel anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
