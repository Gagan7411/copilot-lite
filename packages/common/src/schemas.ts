import { z } from 'zod';

export const DiagnosticSchema = z.object({
  ruleId: z.enum(['R1', 'R2', 'R3', 'R4']),
  message: z.string(),
  start: z.number(),
  end: z.number(),
  severity: z.enum(['info', 'warning', 'error']),
  quickFixable: z.boolean()
});

export const RepoContextSchema = z.object({
  packageJson: z.string().optional(),
  tsconfigJson: z.string().optional(),
  importsIndex: z.record(z.array(z.string())).optional()
});

export const FixRequestSchema = z.object({
  language: z.enum(['js', 'ts']),
  filePath: z.string(),
  code: z.string(),
  diagnostics: z.array(DiagnosticSchema),
  repoContext: RepoContextSchema.optional()
});

export const FixResponseSchema = z.object({
  ok: z.boolean(),
  diff: z.string().optional(),
  fallback: z.boolean().optional(),
  error: z.string().optional()
});

export const LLMFixResponseSchema = z.object({
  diff: z.string(),
  rationale: z.string(),
  risks: z.array(z.string())
});

export const AnalyzeRequestSchema = z.object({
  language: z.enum(['js', 'ts']),
  code: z.string(),
  filePath: z.string().optional()
});

export const AnalyzeResponseSchema = z.object({
  diagnostics: z.array(DiagnosticSchema)
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type RepoContext = z.infer<typeof RepoContextSchema>;
export type FixRequest = z.infer<typeof FixRequestSchema>;
export type FixResponse = z.infer<typeof FixResponseSchema>;
export type LLMFixResponse = z.infer<typeof LLMFixResponseSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
