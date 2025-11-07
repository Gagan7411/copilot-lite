import { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../store';
import { analyzeCode } from '../api';

let debounceTimer: ReturnType<typeof setTimeout>;

export default function Editor() {
  const { code, language, filePath, setCode, setDiagnostics, setIsAnalyzing } = useEditorStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => {
      const model = editor.getModel();
      if (model) {
        editor.trigger('', 'editor.action.quickFix', {});
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performAnalysis(newCode);
    }, 500);
  };

  const performAnalysis = async (codeToAnalyze: string) => {
    if (!codeToAnalyze.trim()) {
      setDiagnostics([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeCode({
        language,
        code: codeToAnalyze,
        filePath
      });

      setDiagnostics(response.diagnostics);

      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const markers = response.diagnostics.map(d => ({
            startLineNumber: model.getPositionAt(d.start).lineNumber,
            startColumn: model.getPositionAt(d.start).column,
            endLineNumber: model.getPositionAt(d.end).lineNumber,
            endColumn: model.getPositionAt(d.end).column,
            message: d.message,
            severity: d.severity === 'error'
              ? monaco.MarkerSeverity.Error
              : d.severity === 'warning'
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
            source: d.ruleId
          }));

          monaco.editor.setModelMarkers(model, 'codefixer', markers);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (code) {
      performAnalysis(code);
    }
  }, [language]);

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        language={language === 'ts' ? 'typescript' : 'javascript'}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          quickSuggestions: true,
          fixedOverflowWidgets: true
        }}
      />
    </div>
  );
}
