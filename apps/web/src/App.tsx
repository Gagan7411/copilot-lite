import { useEffect } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import DiffPreview from './components/DiffPreview';
import { useEditorStore } from './store';
import { EXAMPLE_CODE } from './examples';

export default function App() {
  const { setCode, setLanguage, setFilePath } = useEditorStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('example') === 'demo') {
      setCode(EXAMPLE_CODE);
      setLanguage('js');
      setFilePath('app.js');
    }
  }, []);

  const handleLoadExample = () => {
    setCode(EXAMPLE_CODE);
    setLanguage('js');
    setFilePath('app.js');
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <Editor />
        </div>

        <div className="w-96">
          <DiagnosticsPanel />
        </div>
      </div>

      <div className="bg-[#2d2d30] border-t border-[#3e3e42] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLoadExample}
            className="px-3 py-1 bg-[#007acc] text-white rounded hover:bg-[#005a9e] text-xs font-medium transition-colors"
          >
            Load Example
          </button>
          <span className="text-xs text-gray-400">
            Press Ctrl/Cmd + . for quick fixes
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Monaco Editor</span>
          <span>•</span>
          <span>Dark Theme</span>
        </div>
      </div>

      <DiffPreview />
    </div>
  );
}
