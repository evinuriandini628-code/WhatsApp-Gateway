import { useAuth } from '../contexts/AuthContext';
import PricingCard from '../components/PricingCard';

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
    cta: 'Current Plan',
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
    cta: 'Upgrade to Pro',
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

export default function Pricing() {
  const { user } = useAuth();

  const getTierCta = (tierName: string) => {
    const currentTier = user?.tier || 'free';
    if (tierName.toLowerCase() === currentTier) return 'Current Plan';
    return tiers.find(t => t.name === tierName)?.cta || 'Upgrade';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pricing & Plans</h1>
        <p className="text-gray-600 mt-1">
          You are currently on the <span className="font-medium capitalize text-indigo-600">{user?.tier}</span> plan
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.name}
            {...tier}
            cta={getTierCta(tier.name)}
            isCurrentTier={tier.name.toLowerCase() === (user?.tier || 'free')}
          />
        ))}
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-4 text-sm font-medium text-gray-500">Feature</th>
                <th className="pb-4 text-sm font-medium text-gray-500 text-center">Free</th>
                <th className="pb-4 text-sm font-medium text-gray-500 text-center">Pro</th>
                <th className="pb-4 text-sm font-medium text-gray-500 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 text-sm text-gray-700">WhatsApp Sessions</td>
                <td className="py-3 text-sm text-gray-600 text-center">1</td>
                <td className="py-3 text-sm text-gray-600 text-center">5</td>
                <td className="py-3 text-sm text-gray-600 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Messages per Day</td>
                <td className="py-3 text-sm text-gray-600 text-center">100</td>
                <td className="py-3 text-sm text-gray-600 text-center">5,000</td>
                <td className="py-3 text-sm text-gray-600 text-center">50,000</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">API Keys</td>
                <td className="py-3 text-sm text-gray-600 text-center">1</td>
                <td className="py-3 text-sm text-gray-600 text-center">10</td>
                <td className="py-3 text-sm text-gray-600 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Webhooks</td>
                <td className="py-3 text-sm text-gray-600 text-center">-</td>
                <td className="py-3 text-sm text-indigo-600 text-center font-medium">Yes</td>
                <td className="py-3 text-sm text-indigo-600 text-center font-medium">Yes</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Priority Support</td>
                <td className="py-3 text-sm text-gray-600 text-center">-</td>
                <td className="py-3 text-sm text-indigo-600 text-center font-medium">Yes</td>
                <td className="py-3 text-sm text-indigo-600 text-center font-medium">Yes</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">SLA Guarantee</td>
                <td className="py-3 text-sm text-gray-600 text-center">-</td>
                <td className="py-3 text-sm text-gray-600 text-center">-</td>
                <td className="py-3 text-sm text-indigo-600 text-center font-medium">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
