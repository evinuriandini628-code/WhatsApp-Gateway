import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Key, Check } from 'lucide-react';
import api from '../lib/api';

interface ApiKey {
  id: string;
  key?: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/keys');
      setKeys(res.data.keys || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/keys', { name: newKeyName });
      const created: ApiKey = {
        id: res.data.id,
        key: res.data.key,
        name: res.data.name,
        createdAt: res.data.createdAt,
      };
      setNewlyCreatedKey(created);
      setKeys((prev) => [...prev, { id: created.id, name: created.name, createdAt: created.createdAt }]);
      setNewKeyName('');
      setShowCreate(false);
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await api.delete(`/keys/${keyId}`);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      if (newlyCreatedKey?.id === keyId) {
        setNewlyCreatedKey(null);
      }
    } catch {
      // Handle error
    }
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-1">Manage your API keys for programmatic access</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Generate Key
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New API Key</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production, Testing)"
              className="input-field flex-1"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Generate'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {newlyCreatedKey && newlyCreatedKey.key && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">API Key Created</h3>
          <p className="text-sm text-green-700 mb-3">
            Copy your API key now. You will not be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded-lg border border-green-200 font-mono text-sm break-all">
              {newlyCreatedKey.key}
            </code>
            <button
              onClick={() => handleCopy(newlyCreatedKey.key!, newlyCreatedKey.id)}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copiedId === newlyCreatedKey.id ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <button
            onClick={() => setNewlyCreatedKey(null)}
            className="mt-3 text-sm text-green-700 hover:text-green-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No API keys yet</h3>
          <p className="text-gray-600 mb-6">Generate your first API key to start using the API</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Generate Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{key.name || 'Unnamed Key'}</p>
                  <p className="text-xs text-gray-400">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` | Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revoke key"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
