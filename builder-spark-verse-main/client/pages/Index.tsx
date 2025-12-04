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
  CheckCircle2,
  Zap,
  Target,
  Shield,
  Users,
  BarChart3,
  Plug,
  ArrowRight,
  Star,
  Building2,
  Clock,
  Rocket,
  Code2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView, useAnalytics } from "@/hooks/useAnalytics";

export default function Index() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">(
    "signup",
  );

  const { currentUser, userProfile } = useAuth();
  const { track } = useAnalytics();

  // Track page view
  usePageView("landing");

  // Redirect logged in users to appropriate page
  useEffect(() => {
    if (currentUser && userProfile) {
      if (!userProfile.primaryPlatform) {
        window.location.href = "/onboarding";
      }
      // If they have completed onboarding, they can stay on landing page or go to dashboard
    }
  }, [currentUser, userProfile]);

  const demoText =
    "Send Slack notification when new GitHub issue is created with high priority label";

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        if (typingText.length < demoText.length) {
          setTypingText(demoText.slice(0, typingText.length + 1));
        } else {
          setIsTyping(false);
          setTimeout(() => {
            setTypingText("");
            setIsTyping(true);
          }, 3000);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [typingText, isTyping, demoText]);

  const platformLogos = [
    { name: "n8n", color: "bg-red-100 text-red-700" },
    { name: "Zapier", color: "bg-orange-100 text-orange-700" },
    { name: "Make", color: "bg-blue-100 text-blue-700" },
    { name: "Power Automate", color: "bg-purple-100 text-purple-700" },
  ];

  const metrics = [
    { number: "50,000+", label: "Developers trust FlowForge" },
    { number: "2M+", label: "Workflows generated" },
    { number: "99.9%", label: "Uptime guarantee" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Generation",
      description: "From idea to working workflow in under 30 seconds",
    },
    {
      icon: Target,
      title: "Multi-Platform",
      description: "Deploy to n8n, Zapier, Make, and Power Automate",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with end-to-end encryption",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share workflows and collaborate in real-time",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track performance and optimize workflows",
    },
    {
      icon: Plug,
      title: "API Access",
      description: "Integrate FlowForge into your development pipeline",
    },
  ];

  const pricingTiers = [
    {
      name: "Developer",
      price: "Free",
      highlight: false,
      badge: "",
      features: [
        "3 workflows/month on your main platform",
        "10 workflows/month on other platforms",
        "All platforms supported",
        "Community support",
      ],
      cta: "Start for free",
    },
    {
      name: "Pro",
      price: "$19/month",
      highlight: true,
      badge: "Most Popular",
      features: [
        "Unlimited workflows",
        "All platforms",
        "Priority support",
        "Advanced templates",
        "Team collaboration",
      ],
      cta: "Start free trial",
    },
    {
      name: "Enterprise",
      price: "$149/month",
      highlight: false,
      badge: "",
      features: [
        "Everything in Pro",
        "SSO integration",
        "Audit logs",
        "Custom integrations",
        "Dedicated support",
      ],
      cta: "Contact sales",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "DevOps Engineer",
      company: "TechStart Inc",
      avatar: "SC",
      content:
        "FlowForge cut our automation setup time from days to minutes. Game changer for our team.",
      rating: 5,
    },
    {
      name: "Mike Rodriguez",
      role: "Automation Lead",
      company: "DataFlow Corp",
      avatar: "MR",
      content:
        "The AI understands our requirements perfectly. Best workflow tool we've used.",
      rating: 5,
    },
    {
      name: "Emily Park",
      role: "CTO",
      company: "InnovateNow",
      avatar: "EP",
      content:
        "ROI was immediate. We're generating complex workflows that would have taken weeks manually.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlowForge AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#enterprise"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Enterprise
            </a>
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {userProfile?.displayName}
                </span>
                <Button size="sm">Dashboard</Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuthModalTab("login");
                    setShowAuthModal(true);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAuthModalTab("signup");
                    setShowAuthModal(true);
                  }}
                >
                  Start Free Trial
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            Trusted by 50,000+ developers
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            The workflow automation platform{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              trusted by developers
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform any idea into production workflows in seconds. Generate
            automation for n8n, Zapier, Make, and Power Automate with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                track("hero_cta_clicked", {
                  button: "start_building_free",
                  user_state: currentUser ? "logged_in" : "anonymous",
                });

                if (currentUser) {
                  // Redirect to dashboard if logged in
                  window.location.href = "/dashboard";
                } else {
                  setAuthModalTab("signup");
                  setShowAuthModal(true);
                }
              }}
            >
              {currentUser ? "Go to Dashboard" : "Start building for free"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Watch 2-minute demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mb-12">
            <p className="text-sm text-gray-500 mb-4">
              Trusted by developers at
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <span className="text-lg font-semibold">Google</span>
              <span className="text-lg font-semibold">Microsoft</span>
              <span className="text-lg font-semibold">Shopify</span>
              <span className="text-lg font-semibold">Stripe</span>
            </div>
          </div>

          {/* Hero Demo */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-left">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <CardTitle>Generate your workflow</CardTitle>
                <CardDescription>
                  Describe what you want to automate in plain English
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <textarea
                    className="w-full p-4 border rounded-lg bg-gray-50"
                    rows={3}
                    value={typingText}
                    placeholder="Example: Send Slack notification when new GitHub issue is created with high priority label"
                    readOnly
                  />
                  <div className="absolute bottom-4 right-4">
                    <div className="w-2 h-5 bg-blue-600 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {platformLogos.map((platform, idx) => (
                      <Badge
                        key={platform.name}
                        variant="secondary"
                        className={cn(
                          platform.color,
                          activeDemo === idx && "ring-2 ring-blue-500",
                        )}
                      >
                        {platform.name}
                      </Badge>
                    ))}
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Generate <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Metrics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-16">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.number}
                </div>
                <div className="text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop wasting hours building workflows manually
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800">
                  Without FlowForge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-red-600 mt-0.5">❌</div>
                  <span className="text-red-800">
                    Hours spent learning platform syntax
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-red-600 mt-0.5">❌</div>
                  <span className="text-red-800">
                    Trial and error workflow building
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-red-600 mt-0.5">❌</div>
                  <span className="text-red-800">
                    Debugging complex automation logic
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-red-600 mt-0.5">❌</div>
                  <span className="text-red-800">
                    Managing multiple platform differences
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-800">With FlowForge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-green-800">
                    30-second workflow generation
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-green-800">
                    Production-ready code every time
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-green-800">
                    Works across all major platforms
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-green-800">
                    AI-optimized for performance
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to scale automation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to accelerate your workflow automation
              across all major platforms
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple pricing that scales with you
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready to scale
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, idx) => (
              <Card
                key={idx}
                className={cn(
                  "relative",
                  tier.highlight &&
                    "border-2 border-blue-500 shadow-xl scale-105",
                )}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 mt-4">
                    {tier.price}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIdx) => (
                      <li
                        key={featureIdx}
                        className="flex items-start space-x-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full",
                      tier.highlight
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : "variant-outline",
                    )}
                    variant={tier.highlight ? "default" : "outline"}
                    onClick={() => {
                      track("pricing_cta_clicked", {
                        plan: tier.name.toLowerCase(),
                        price: tier.price,
                        user_state: currentUser ? "logged_in" : "anonymous",
                      });

                      if (tier.name === "Enterprise") {
                        // Handle enterprise contact
                        window.location.href = "mailto:enterprise@flowforge.ai";
                      } else if (currentUser) {
                        // Redirect to dashboard/billing if logged in
                        window.location.href = "/dashboard";
                      } else {
                        setAuthModalTab("signup");
                        setShowAuthModal(true);
                      }
                    }}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by enterprise teams worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced security, compliance, and support for growing businesses
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                title: "Single Sign-On",
                description: "SAML, OAuth, Active Directory integration",
                icon: Shield,
              },
              {
                title: "Advanced Security",
                description: "SOC 2, HIPAA, GDPR compliant",
                icon: Building2,
              },
              {
                title: "Dedicated Support",
                description: "24/7 support with dedicated success manager",
                icon: Users,
              },
              {
                title: "Custom Deployment",
                description: "On-premise, private cloud, or hybrid",
                icon: Code2,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Schedule enterprise demo
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by developers and businesses worldwide
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How accurate are the generated workflows?",
                answer:
                  "Our AI generates production-ready workflows with 95%+ accuracy. Each workflow is optimized for the target platform and includes proper error handling.",
              },
              {
                question: "Can I customize the generated workflows?",
                answer:
                  "Absolutely! Generated workflows can be exported and customized in your platform of choice. Our code follows best practices and is fully editable.",
              },
              {
                question: "What platforms do you support?",
                answer:
                  "We support n8n, Zapier, Make (Integromat), and Microsoft Power Automate, with more platforms coming soon.",
              },
              {
                question: "Is there a limit to workflow complexity?",
                answer:
                  "FlowForge can handle workflows of any complexity, from simple 2-step automations to complex multi-branch workflows with conditions and loops.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-left text-lg">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to 10x your automation workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 50,000+ developers who've already transformed their automation
            process
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 mb-4"
            onClick={() => {
              if (currentUser) {
                window.location.href = "/dashboard";
              } else {
                setAuthModalTab("signup");
                setShowAuthModal(true);
              }
            }}
          >
            {currentUser ? "Go to Dashboard" : "Start building for free"}{" "}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-sm opacity-75">
            14-day money-back guarantee • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">FlowForge AI</span>
              </div>
              <p className="text-gray-400">
                The world's leading AI-powered workflow automation generator.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Enterprise
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FlowForge AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}
