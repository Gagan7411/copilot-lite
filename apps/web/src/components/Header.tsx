import { useEditorStore } from '../store';
import { requestFix } from '../api';
import { applyPatch } from 'diff';

export default function Header() {
  const {
    code,
    language,
    filePath,
    diagnostics,
    isFixing,
    setIsFixing,
    setDiffPreview,
    diffPreview,
    applyDiff,
    undo,
    undoStack
  } = useEditorStore();

  const handleAskAIFix = async () => {
    if (diagnostics.length === 0) {
      alert('No issues to fix');
      return;
    }

    setIsFixing(true);
    try {
      const response = await requestFix({
        language,
        filePath,
        code,
        diagnostics
      });

      if (response.ok && response.diff) {
        setDiffPreview(response.diff);
      } else {
        alert(response.error || 'Failed to generate fix');
      }
    } catch (error) {
      console.error('Fix request error:', error);
      alert('Failed to request fix from AI');
    } finally {
      setIsFixing(false);
    }
  };

  const handleApplyFix = () => {
    if (!diffPreview) return;

    const result = applyPatch(code, diffPreview);
    if (result === false || result === code) {
      alert('Failed to apply patch');
      return;
    }

    applyDiff(result);
  };

  const handleUndo = () => {
    undo();
  };

  return (
    <header className="bg-[#2d2d30] border-b border-[#3e3e42] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">CodeFixer</h1>
          <span className="text-xs text-gray-400">CoPilot-Lite Inline AI Fix Assistant</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAskAIFix}
            disabled={isFixing || diagnostics.length === 0}
            className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005a9e] disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {isFixing ? 'Asking AI...' : 'Ask AI Fix'}
          </button>

          {diffPreview && (
            <>
              <button
                onClick={handleApplyFix}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors"
              >
                Apply Fix
              </button>
              <button
                onClick={() => setDiffPreview(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Undo (Ctrl+Z)
          </button>

          <div className="flex items-center space-x-2 ml-4">
            <span className="text-xs text-gray-400">Issues:</span>
            <span className="text-sm font-semibold text-white">{diagnostics.length}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
