import { create } from 'zustand';
import type { Diagnostic } from '@codefixer/common';

interface EditorState {
  code: string;
  language: 'js' | 'ts';
  filePath: string;
  diagnostics: Diagnostic[];
  isAnalyzing: boolean;
  isFixing: boolean;
  diffPreview: string | null;
  undoStack: string[];

  setCode: (code: string) => void;
  setLanguage: (language: 'js' | 'ts') => void;
  setFilePath: (filePath: string) => void;
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setIsFixing: (isFixing: boolean) => void;
  setDiffPreview: (diff: string | null) => void;
  pushToUndoStack: (code: string) => void;
  undo: () => void;
  applyDiff: (newCode: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  code: '',
  language: 'js',
  filePath: 'example.js',
  diagnostics: [],
  isAnalyzing: false,
  isFixing: false,
  diffPreview: null,
  undoStack: [],

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setFilePath: (filePath) => set({ filePath }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setIsFixing: (isFixing) => set({ isFixing }),
  setDiffPreview: (diffPreview) => set({ diffPreview }),

  pushToUndoStack: (code) => {
    const { undoStack } = get();
    set({ undoStack: [...undoStack, code] });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length > 0) {
      const newStack = [...undoStack];
      const previousCode = newStack.pop()!;
      set({ code: previousCode, undoStack: newStack });
    }
  },

  applyDiff: (newCode) => {
    const { code } = get();
    get().pushToUndoStack(code);
    set({ code: newCode, diffPreview: null });
  }
}));
