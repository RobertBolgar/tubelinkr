import { useState } from 'react';
import { X } from 'lucide-react';

interface AddPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (placement: { name: string; type: string; source_code: string }) => void;
}

export function AddPlacementModal({ isOpen, onClose, onAdd }: AddPlacementModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('description');
  const [sourceCode, setSourceCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const placementTypes = [
    { value: 'description', label: 'Description' },
    { value: 'pinned', label: 'Pinned Comment' },
    { value: 'bio', label: 'Bio' },
    { value: 'short', label: 'Short' },
    { value: 'video', label: 'Video' },
    { value: 'other', label: 'Other' },
  ];

  const generateSourceCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `${type.charAt(0)}_${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Placement name is required');
      return;
    }

    if (name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    if (!sourceCode.trim()) {
      setError('Source code is required');
      return;
    }

    setLoading(true);

    try {
      await onAdd({ name: name.trim(), type, source_code: sourceCode.trim() });
      setName('');
      setSourceCode('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add placement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Track a new placement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Where did you use this link?
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              placeholder="e.g. YouTube description, pinned comment, bio"
              maxLength={50}
            />
            <p className="mt-1 text-xs text-gray-500">Custom label to identify where you placed this link</p>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Placement type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setSourceCode(generateSourceCode());
              }}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              {placementTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sourceCode" className="block text-sm font-medium text-gray-300 mb-2">
              Tracking code
            </label>
            <input
              id="sourceCode"
              type="text"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              placeholder="Auto-generated or custom"
            />
            <p className="mt-1 text-xs text-gray-500">Unique identifier for tracking (auto-generated)</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Track placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
