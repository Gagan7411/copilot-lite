import { useEditorStore } from '../store';
import type { Diagnostic } from '@codefixer/common';

export default function DiagnosticsPanel() {
  const { diagnostics } = useEditorStore();

  const groupedDiagnostics = diagnostics.reduce((acc, diag) => {
    if (!acc[diag.ruleId]) {
      acc[diag.ruleId] = [];
    }
    acc[diag.ruleId].push(diag);
    return acc;
  }, {} as Record<string, Diagnostic[]>);

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const ruleDescription = (ruleId: string) => {
    switch (ruleId) {
      case 'R1':
        return 'Unused imports/variables';
      case 'R2':
        return 'Missing imports';
      case 'R3':
        return 'Possible null/undefined access';
      case 'R4':
        return 'Async/await misuse';
      default:
        return ruleId;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#252526] border-l border-[#3e3e42]">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Issues</h2>

        {diagnostics.length === 0 ? (
          <p className="text-gray-400 text-sm">No issues found</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedDiagnostics).map(([ruleId, diags]) => (
              <div key={ruleId} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">
                  [{ruleId}] {ruleDescription(ruleId)}
                </h3>
                <div className="space-y-2">
                  {diags.map((diag, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#1e1e1e] rounded border border-[#3e3e42] hover:border-[#007acc] cursor-pointer transition-colors"
                    >
                      <div className={`text-xs font-medium ${severityColor(diag.severity)}`}>
                        {diag.severity.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-200 mt-1">{diag.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Position: {diag.start}-{diag.end}
                      </div>
                      {diag.quickFixable && (
                        <div className="text-xs text-green-400 mt-1">Quick fix available</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
