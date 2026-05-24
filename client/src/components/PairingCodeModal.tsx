import { useState, useEffect, useRef } from 'react';
import { X, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface PairingCodeModalProps {
  onClose: () => void;
}

type ModalStep = 'phone' | 'pairing' | 'connected';

export default function PairingCodeModal({ onClose }: PairingCodeModalProps) {
  const [step, setStep] = useState<ModalStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!phoneNumber.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/whatsapp/connect', { phoneNumber: phoneNumber.trim() });
      setPairingCode(res.data.pairingCode);
      setSessionId(res.data.sessionId);
      setStep('pairing');
      startPolling(res.data.sessionId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sid: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/whatsapp/sessions/${sid}/status`);
        if (res.data.session?.status === 'connected') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStep('connected');
        }
      } catch {
        // Continue polling on error
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'phone' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-7 w-7 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Connect WhatsApp Number</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Enter your phone number with country code (e.g., 14155551234)
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="14155551234"
                className="input-field text-center text-lg font-mono"
                autoFocus
              />
              <button
                onClick={handleConnect}
                disabled={loading || !phoneNumber.trim()}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Get Pairing Code'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'pairing' && (
          <div className="text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Pairing Code</h2>
            <p className="text-gray-600 text-sm mb-6">
              Open WhatsApp on your phone, go to <strong>Linked Devices</strong>, tap <strong>Link a Device</strong>, then enter this code:
            </p>

            <div className="bg-gray-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold font-mono text-indigo-700 tracking-widest select-all">
                {pairingCode}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              <span>Waiting for connection...</span>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Session ID: {sessionId}
            </p>
          </div>
        )}

        {step === 'connected' && (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Connected!</h2>
            <p className="text-gray-600 text-sm mb-6">
              Your WhatsApp number has been successfully connected.
            </p>
            <button onClick={onClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
