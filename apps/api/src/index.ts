import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import {
  FixRequestSchema,
  AnalyzeRequestSchema,
  type FixResponse,
  type AnalyzeResponse
} from '@codefixer/common';
import { analyze, generateRuleBasedFix } from '@codefixer/analyzer';
import { createUnifiedDiff, validatePatch } from '@codefixer/diff';
import { createLLMProvider } from './llm.js';

config();

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
});

fastify.post<{ Body: unknown }>('/api/analyze', async (request, reply) => {
  try {
    const body = AnalyzeRequestSchema.parse(request.body);

    const diagnostics = analyze({
      language: body.language,
      code: body.code,
      filePath: body.filePath
    });

    const response: AnalyzeResponse = {
      diagnostics
    };

    return reply.send(response);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: 'Invalid request' });
  }
});

fastify.post<{ Body: unknown }>('/api/fix', async (request, reply) => {
  try {
    const body = FixRequestSchema.parse(request.body);

    const llmProvider = process.env.LLM_PROVIDER || 'ollama';
    const provider = createLLMProvider(llmProvider);

    let diff = '';
    let fallback = false;

    if (provider) {
      try {
        const result = await provider.generateFix(
          body.code,
          body.language,
          body.filePath,
          body.diagnostics,
          body.repoContext
        );

        diff = result.diff;

        if (!validatePatch(body.code, diff)) {
          throw new Error('Generated patch is invalid');
        }
      } catch (error) {
        fastify.log.error({ error }, 'LLM generation failed');

        const r1Diagnostic = body.diagnostics.find(d => d.ruleId === 'R1');
        if (r1Diagnostic) {
          const ruleFix = generateRuleBasedFix(body.code, r1Diagnostic);
          if (ruleFix) {
            diff = ruleFix;
            fallback = true;
          }
        }

        if (!diff) {
          throw error;
        }
      }
    } else {
      const r1Diagnostic = body.diagnostics.find(d => d.ruleId === 'R1');
      if (r1Diagnostic) {
        const ruleFix = generateRuleBasedFix(body.code, r1Diagnostic);
        if (ruleFix) {
          diff = ruleFix;
          fallback = true;
        }
      }

      if (!diff) {
        return reply.status(500).send({
          ok: false,
          error: 'LLM provider not configured'
        });
      }
    }

    const response: FixResponse = {
      ok: true,
      diff,
      fallback
    };

    return reply.send(response);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to generate fix'
    });
  }
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
