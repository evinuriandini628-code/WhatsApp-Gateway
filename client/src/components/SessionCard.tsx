import { Smartphone, Trash2, Wifi, WifiOff } from 'lucide-react';

interface Session {
  id: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  lastActive?: string;
}

interface SessionCardProps {
  session: Session;
  onDisconnect: (id: string) => void;
}

export default function SessionCard({ session, onDisconnect }: SessionCardProps) {
  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Wifi }> = {
    connected: { color: 'text-green-700', bg: 'bg-green-100', label: 'Connected', icon: Wifi },
    connecting: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Connecting', icon: Wifi },
    disconnected: { color: 'text-red-700', bg: 'bg-red-100', label: 'Disconnected', icon: WifiOff },
  };

  const status = statusConfig[session.status] || statusConfig.disconnected;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{session.phoneNumber}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              <status.icon className="h-3 w-3" />
              {status.label}
            </span>
            {session.createdAt && (
              <span className="text-xs text-gray-400">
                Connected {new Date(session.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDisconnect(session.id)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Disconnect session"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
