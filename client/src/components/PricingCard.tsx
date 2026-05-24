import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  excluded: string[];
  highlighted: boolean;
  cta: string;
  isCurrentTier?: boolean;
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  excluded,
  highlighted,
  cta,
  isCurrentTier,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl p-8 flex flex-col ${
        highlighted
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-2xl scale-105 relative'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <p className={`text-sm mt-1 ${highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>

      <div className="mb-6">
        <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {price}
        </span>
        <span className={`text-sm ${highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>
          {period}
        </span>
      </div>

      <div className="flex-1 space-y-3 mb-8">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <Check className={`h-5 w-5 flex-shrink-0 ${highlighted ? 'text-indigo-200' : 'text-green-500'}`} />
            <span className={`text-sm ${highlighted ? 'text-indigo-50' : 'text-gray-700'}`}>{feature}</span>
          </div>
        ))}
        {excluded.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <X className={`h-5 w-5 flex-shrink-0 ${highlighted ? 'text-indigo-300' : 'text-gray-300'}`} />
            <span className={`text-sm ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{feature}</span>
          </div>
        ))}
      </div>

      {isCurrentTier ? (
        <button
          disabled
          className={`w-full py-3 px-6 rounded-lg font-semibold text-center ${
            highlighted
              ? 'bg-white/20 text-white cursor-not-allowed'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        >
          Current Plan
        </button>
      ) : (
        <Link
          to="/register"
          className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 ${
            highlighted
              ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
