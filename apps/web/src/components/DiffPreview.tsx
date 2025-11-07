import { useEditorStore } from '../store';

export default function DiffPreview() {
  const { diffPreview } = useEditorStore();

  if (!diffPreview) return null;

  const lines = diffPreview.split('\n');

  const getLineClass = (line: string) => {
    if (line.startsWith('+++') || line.startsWith('---')) {
      return 'text-gray-400 font-semibold';
    }
    if (line.startsWith('@@')) {
      return 'text-cyan-400 font-semibold';
    }
    if (line.startsWith('+')) {
      return 'bg-green-900/30 text-green-300';
    }
    if (line.startsWith('-')) {
      return 'bg-red-900/30 text-red-300';
    }
    return 'text-gray-300';
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-3/4 max-h-[80vh] overflow-hidden border border-[#3e3e42]">
        <div className="bg-[#2d2d30] px-4 py-3 border-b border-[#3e3e42]">
          <h3 className="text-lg font-semibold text-white">Diff Preview</h3>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <pre className="text-sm font-mono">
            {lines.map((line, idx) => (
              <div key={idx} className={`${getLineClass(line)} py-0.5 px-2`}>
                {line || ' '}
              </div>
            ))}
          </pre>
        </div>

        <div className="bg-[#2d2d30] px-4 py-3 border-t border-[#3e3e42] flex justify-end space-x-2">
          <button
            onClick={() => useEditorStore.getState().setDiffPreview(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
