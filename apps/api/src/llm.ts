import OpenAI from 'openai';
import type { Diagnostic, RepoContext } from '@codefixer/common';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface LLMProvider {
  generateFix(
    code: string,
    language: string,
    filePath: string,
    diagnostics: Diagnostic[],
    repoContext?: RepoContext
  ): Promise<{ diff: string; rationale: string; risks: string[] }>;
}

export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://codefixer.dev',
        'X-Title': 'CodeFixer'
      }
    });
  }

  async generateFix(
    code: string,
    language: string,
    filePath: string,
    diagnostics: Diagnostic[],
    repoContext?: RepoContext
  ): Promise<{ diff: string; rationale: string; risks: string[] }> {
    const systemPrompt = `You are a precise code fixer. Output ONLY a minimal unified diff for the provided file. Do not reformat unrelated code. Respect project context (imports, tsconfig). If fix is risky, prefer a minimal null-check or import fix.

Your response must be valid JSON with the following structure:
{
  "diff": "unified diff string",
  "rationale": "short explanation",
  "risks": ["risk1", "risk2"]
}`;

    const diagnosticsText = diagnostics
      .map(d => `- [${d.ruleId}] ${d.message} (position ${d.start}-${d.end})`)
      .join('\n');

    const contextText = repoContext
      ? `
Project Context:
${repoContext.packageJson ? `Dependencies: ${JSON.parse(repoContext.packageJson).dependencies ? Object.keys(JSON.parse(repoContext.packageJson).dependencies).join(', ') : 'none'}` : ''}
${repoContext.tsconfigJson ? 'TypeScript enabled' : ''}
`
      : '';

    const userPrompt = `Language: ${language}
File: ${filePath}

Original Code:
\`\`\`${language}
${code}
\`\`\`

Diagnostics:
${diagnosticsText}

${contextText}

Generate a minimal unified diff to fix these issues. Return ONLY valid JSON.`;

    const response = await this.client.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        diff: parsed.diff || '',
        rationale: parsed.rationale || 'Fix applied',
        risks: parsed.risks || []
      };
    } catch (error) {
      throw new Error('Invalid JSON response from LLM');
    }
  }
}

export class OllamaProvider implements LLMProvider {
  private client: OpenAI;

  constructor(baseURL: string) {
    this.client = new OpenAI({
      baseURL: `${baseURL}/v1`,
      apiKey: 'ollama'
    });
  }

  async generateFix(
    code: string,
    language: string,
    filePath: string,
    diagnostics: Diagnostic[],
    repoContext?: RepoContext
  ): Promise<{ diff: string; rationale: string; risks: string[] }> {
    const systemPrompt = `You are a precise code fixer. Output ONLY a minimal unified diff for the provided file. Do not reformat unrelated code. Respect project context (imports, tsconfig). If fix is risky, prefer a minimal null-check or import fix.

Your response must be valid JSON with the following structure:
{
  "diff": "unified diff string",
  "rationale": "short explanation",
  "risks": ["risk1", "risk2"]
}`;

    const diagnosticsText = diagnostics
      .map(d => `- [${d.ruleId}] ${d.message} (position ${d.start}-${d.end})`)
      .join('\n');

    const contextText = repoContext
      ? `
Project Context:
${repoContext.packageJson ? `Dependencies: ${JSON.parse(repoContext.packageJson).dependencies ? Object.keys(JSON.parse(repoContext.packageJson).dependencies).join(', ') : 'none'}` : ''}
${repoContext.tsconfigJson ? 'TypeScript enabled' : ''}
`
      : '';

    const userPrompt = `Language: ${language}
File: ${filePath}

Original Code:
\`\`\`${language}
${code}
\`\`\`

Diagnostics:
${diagnosticsText}

${contextText}

Generate a minimal unified diff to fix these issues. Return ONLY valid JSON.`;

    const response = await this.client.chat.completions.create({
      model: 'qwen2.5-coder',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        diff: parsed.diff || '',
        rationale: parsed.rationale || 'Fix applied',
        risks: parsed.risks || []
      };
    } catch (error) {
      throw new Error('Invalid JSON response from LLM');
    }
  }
}

export function createLLMProvider(provider: string): LLMProvider | null {
  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new OpenRouterProvider(apiKey);
  } else if (provider === 'ollama') {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    return new OllamaProvider(baseURL);
  }
  return null;
}
