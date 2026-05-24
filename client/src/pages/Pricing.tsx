import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PricingCard from '../components/PricingCard';
import api from '../lib/api';

interface TierInfo {
  tier: string;
  maxNumbers: number;
  maxRequestsPerDay: number;
}

interface TierDisplay {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  excluded: string[];
  highlighted: boolean;
  cta: string;
}

const tierMeta: Record<string, { price: string; period: string; description: string; highlighted: boolean; cta: string }> = {
  free: {
    price: '$0',
    period: '/month',
    description: 'Perfect for testing and small projects',
    highlighted: false,
    cta: 'Current Plan',
  },
  pro: {
    price: '$29',
    period: '/month',
    description: 'For growing businesses and teams',
    highlighted: true,
    cta: 'Upgrade to Pro',
  },
  enterprise: {
    price: '$99',
    period: '/month',
    description: 'For large-scale operations',
    highlighted: false,
    cta: 'Contact Sales',
  },
};

const tierOrder = ['free', 'pro', 'enterprise'];

function buildFeatures(tier: TierInfo): string[] {
  const features: string[] = [];
  features.push(`${tier.maxNumbers} WhatsApp session${tier.maxNumbers !== 1 ? 's' : ''}`);
  features.push(`${tier.maxRequestsPerDay.toLocaleString()} messages/day`);

  if (tier.tier === 'free') {
    features.push('1 API key');
    features.push('Community support');
    features.push('Basic analytics');
  } else if (tier.tier === 'pro') {
    features.push('10 API keys');
    features.push('Priority support');
    features.push('Webhooks');
    features.push('Advanced analytics');
  } else if (tier.tier === 'enterprise') {
    features.push('Unlimited API keys');
    features.push('Dedicated support');
    features.push('Webhooks');
    features.push('Custom branding');
    features.push('SLA guarantee');
  }
  return features;
}

function buildExcluded(tier: TierInfo): string[] {
  if (tier.tier === 'free') return ['Priority support', 'Webhooks', 'Custom branding'];
  if (tier.tier === 'pro') return ['Custom branding'];
  return [];
}

export default function Pricing() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TierDisplay[]>([]);
  const [tierData, setTierData] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await api.get('/tiers');
        const data = res.data.tiers as TierInfo[];
        setTierData(data);

        const sorted = [...data].sort(
          (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
        );

        const displays: TierDisplay[] = sorted.map((t) => {
          const meta = tierMeta[t.tier] || tierMeta.free;
          return {
            name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
            price: meta.price,
            period: meta.period,
            description: meta.description,
            features: buildFeatures(t),
            excluded: buildExcluded(t),
            highlighted: meta.highlighted,
            cta: meta.cta,
          };
        });

        setTiers(displays);
      } catch {
        // Fallback if API fails
        setTiers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const getTierCta = (tierName: string) => {
    const currentTier = user?.tier || 'free';
    if (tierName.toLowerCase() === currentTier) return 'Current Plan';
    return tierMeta[tierName.toLowerCase()]?.cta || 'Upgrade';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Build comparison table data from fetched tiers
  const getTierValue = (tierName: string, field: 'maxNumbers' | 'maxRequestsPerDay'): string => {
    const t = tierData.find((d) => d.tier === tierName);
    if (!t) return '-';
    if (field === 'maxNumbers') return String(t.maxNumbers);
    return t.maxRequestsPerDay.toLocaleString();
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
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('free', 'maxNumbers')}</td>
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('pro', 'maxNumbers')}</td>
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('enterprise', 'maxNumbers')}</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-700">Messages per Day</td>
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('free', 'maxRequestsPerDay')}</td>
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('pro', 'maxRequestsPerDay')}</td>
                <td className="py-3 text-sm text-gray-600 text-center">{getTierValue('enterprise', 'maxRequestsPerDay')}</td>
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
