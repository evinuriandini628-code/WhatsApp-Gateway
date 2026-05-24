import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import SessionCard from '../components/SessionCard';
import PairingCodeModal from '../components/PairingCodeModal';

interface Session {
  id: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  lastActive?: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/whatsapp/sessions');
      setSessions(res.data.sessions || []);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDisconnect = async (sessionId: string) => {
    try {
      await api.delete(`/whatsapp/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // Handle error
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    fetchSessions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sessions</h1>
          <p className="text-gray-600 mt-1">Manage your connected WhatsApp numbers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Connect New Number
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Connect your first WhatsApp number to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Connect Number
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}

      {showModal && <PairingCodeModal onClose={handleModalClose} />}
    </div>
  );
}
