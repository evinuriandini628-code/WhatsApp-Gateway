import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Zap, Users, Check, ArrowRight, Globe, Code } from 'lucide-react';
import PricingCard from '../components/PricingCard';

const features = [
  {
    icon: MessageSquare,
    title: 'Message at Scale',
    description: 'Send and receive WhatsApp messages programmatically with our reliable REST API.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'End-to-end encryption, JWT authentication, and API key management built in.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Sub-second message delivery with real-time connection status and webhooks.',
  },
  {
    icon: Users,
    title: 'Multi-Session',
    description: 'Connect multiple WhatsApp numbers and manage them from a single dashboard.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Send messages to any WhatsApp user worldwide without geographical restrictions.',
  },
  {
    icon: Code,
    title: 'Developer Friendly',
    description: 'Clean REST API with comprehensive docs, SDKs, and code examples.',
  },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for testing and small projects',
    features: [
      '1 WhatsApp session',
      '100 messages/day',
      '1 API key',
      'Community support',
      'Basic analytics',
    ],
    excluded: ['Priority support', 'Webhooks', 'Custom branding'],
    highlighted: false,
    cta: 'Start Free',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing businesses and teams',
    features: [
      '5 WhatsApp sessions',
      '5,000 messages/day',
      '10 API keys',
      'Priority support',
      'Webhooks',
      'Advanced analytics',
    ],
    excluded: ['Custom branding'],
    highlighted: true,
    cta: 'Get Pro',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For large-scale operations',
    features: [
      'Unlimited sessions',
      '50,000 messages/day',
      'Unlimited API keys',
      'Dedicated support',
      'Webhooks',
      'Custom branding',
      'SLA guarantee',
    ],
    excluded: [],
    highlighted: false,
    cta: 'Contact Sales',
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero Section */}
      <section className="gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              WhatsApp API Gateway
              <br />
              <span className="text-indigo-200">for Modern Businesses</span>
            </h1>
            <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Send and receive WhatsApp messages at scale with our reliable, developer-friendly API platform.
              Connect your WhatsApp number in seconds with pairing code verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary !bg-white !text-indigo-700 hover:!bg-indigo-50 flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#pricing" className="btn-secondary !bg-transparent !text-white !border-white/30 hover:!bg-white/10">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to integrate WhatsApp
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform for sending messages, managing sessions, and scaling your WhatsApp communication.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create your free account and connect your first WhatsApp number in under 5 minutes.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-bold text-white">WA Gateway</span>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <div className="flex items-center justify-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>WhatsApp Gateway Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
