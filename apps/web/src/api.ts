import type { AnalyzeRequest, AnalyzeResponse, FixRequest, FixResponse } from '@codefixer/common';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export async function analyzeCode(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  return response.json();
}

export async function requestFix(request: FixRequest): Promise<FixResponse> {
  const response = await fetch(`${API_BASE}/api/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Fix generation failed');
  }

  return response.json();
}
