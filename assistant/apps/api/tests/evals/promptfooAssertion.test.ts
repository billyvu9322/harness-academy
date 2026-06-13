import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const assertGrounding = require('../../evals/promptfoo/assert-grounding.cjs') as (
  output: string,
  context: { vars?: Record<string, unknown>; metadata?: Record<string, unknown>; providerResponse?: { metadata?: Record<string, unknown> }; test?: { metadata?: Record<string, unknown> } },
) => { pass: boolean; score: number; reason: string; namedScores: Record<string, number> };

describe('promptfoo assert-grounding', () => {
  it('passes when answer, citation, and tool expectations match', () => {
    const result = assertGrounding('A feature list is a core primitive.', {
      vars: {
        expectKeywords: ['feature list'],
        expectDocMatch: 'feature-list-la-primitive',
        expectedToolNames: ['read_doc_section'],
      },
      metadata: {
        citations: [{ sourcePath: 'docs/feature-list-la-primitive.md', title: 'Feature list' }],
        toolCalls: ['grep_docs', 'read_doc_section'],
      },
    });

    expect(result.pass).toBe(true);
    expect(result.namedScores).toEqual({ keyword: 1, citation: 1, tool: 1 });
  });

  it('fails out-of-corpus cases when the provider fabricates a citation', () => {
    const result = assertGrounding('Không có thông tin trong tài liệu.', {
      vars: {
        expectKeywords: ['không'],
        expectUncertain: true,
        expectNoCitation: true,
      },
      providerResponse: {
        metadata: {
          citations: [{ sourcePath: 'docs/fx.md', title: 'FX' }],
          toolCalls: [],
        },
      },
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toContain('unexpected citation');
  });

  it('reads generated YAML expectations from metadata when vars stay scalar-only', () => {
    const result = assertGrounding('Grounding needs citation support.', {
      vars: {
        question: 'Grounding là gì?',
        language: 'Vietnamese',
      },
      test: {
        metadata: {
          expectKeywords: ['grounding', 'citation'],
          minKeywordHits: 2,
          expectNoCitation: true,
          expectedToolNames: ['read_doc_section'],
        },
      },
      metadata: {
        citations: [{ sourcePath: 'docs/grounding.md', title: 'Grounding' }],
        toolCalls: ['grep_docs'],
      },
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toContain('unexpected citation');
    expect(result.reason).toContain('tool calls failed');
  });

  it('reads expectedBehavior from test metadata in real Promptfoo runtime shape', () => {
    const result = assertGrounding(
      'Mình chỉ hỗ trợ các câu hỏi về harness engineering và nội dung Harness Academy. Bạn đặt một câu hỏi liên quan giúp mình nhé.',
      {
        test: {
          metadata: {
            expectedBehavior: 'refusal',
            expectKeywords: ['harness engineering', 'hỗ trợ'],
            minKeywordHits: 1,
            expectNoCitation: true,
            forbiddenToolNames: ['grep_docs', 'read_doc_section'],
          },
        },
        metadata: {
          citations: [],
          toolCalls: [],
        },
      },
    );

    expect(result.pass).toBe(true);
    expect(result.namedScores).toEqual({ keyword: 1, citation: 1, tool: 1 });
  });

  it('fails refusal cases that fabricate citations in real Promptfoo runtime shape', () => {
    const result = assertGrounding('Mình chỉ hỗ trợ các câu hỏi về harness engineering.', {
      test: {
        expectKeywords: ['grounding', 'citation'],
          metadata: {
            expectedBehavior: 'refusal',
            expectKeywords: ['harness engineering'],
            expectNoCitation: true,
          },
        },
      metadata: {
        citations: [{ sourcePath: 'docs/aws.md', title: 'AWS' }],
        toolCalls: [],
      },
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toContain('unexpected citation');
  });
});
