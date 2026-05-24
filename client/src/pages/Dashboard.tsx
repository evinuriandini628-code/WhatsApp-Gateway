import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Smartphone, Key, MessageSquare, TrendingUp } from 'lucide-react';
import api from '../lib/api';

interface SessionInfo {
  id: string;
  phoneNumber: string;
  status: string;
}

interface KeyInfo {
  id: string;
  name: string;
}

interface TierInfo {
  tier: string;
  maxNumbers: number;
  maxRequestsPerDay: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [tierLimits, setTierLimits] = useState<Record<string, { sessions: number; messages: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, keysRes, tiersRes] = await Promise.all([
          api.get('/whatsapp/sessions'),
          api.get('/keys'),
          api.get('/tiers'),
        ]);
        setSessions(sessionsRes.data.sessions || []);
        setKeys(keysRes.data.keys || []);

        const tiers = tiersRes.data.tiers as TierInfo[];
        const limitsMap: Record<string, { sessions: number; messages: number }> = {};
        for (const t of tiers) {
          limitsMap[t.tier] = {
            sessions: t.maxNumbers,
            messages: t.maxRequestsPerDay,
          };
        }
        setTierLimits(limitsMap);
      } catch {
        // Silently handle errors for dashboard stats
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentTier = user?.tier || 'free';
  const limits = tierLimits[currentTier] || { sessions: 1, messages: 100 };

  const stats = [
    {
      icon: Smartphone,
      label: 'Active Sessions',
      value: sessions.filter(s => s.status === 'connected').length,
      limit: `/ ${limits.sessions}`,
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: Key,
      label: 'API Keys',
      value: keys.length,
      limit: '',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: MessageSquare,
      label: 'Messages Today',
      value: 0,
      limit: `/ ${limits.messages.toLocaleString()}`,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: TrendingUp,
      label: 'Current Tier',
      value: user?.tier || 'free',
      limit: '',
      color: 'bg-indigo-100 text-indigo-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {stat.value}
                  {stat.limit && <span className="text-sm font-normal text-gray-400 ml-1">{stat.limit}</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">1</div>
            <span className="text-gray-700">Connect your WhatsApp number in the Sessions page</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">2</div>
            <span className="text-gray-700">Generate an API key in the API Keys page</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">3</div>
            <span className="text-gray-700">Start sending messages via the REST API</span>
          </div>
        </div>
      </div>
    </div>
  );
}
