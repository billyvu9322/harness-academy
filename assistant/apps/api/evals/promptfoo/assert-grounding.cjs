function textIncludes(haystack, needle) {
  return String(haystack || '').toLowerCase().includes(String(needle || '').toLowerCase());
}

function citationMatches(citation, needle) {
  const haystack = `${citation?.sourcePath || ''} ${citation?.route || ''} ${citation?.title || ''}`;
  return textIncludes(haystack, needle);
}

module.exports = (output, context = {}) => {
  const vars = context.vars || {};
  const testMetadata = context.test?.metadata || {};
  const metadata = context.metadata || context.providerResponse?.metadata || {};
  const expectedValue = (key, fallback) => {
    if (vars[key] !== undefined) return vars[key];
    if (testMetadata[key] !== undefined) return testMetadata[key];
    if (metadata[key] !== undefined) return metadata[key];
    return fallback;
  };
  const citations = Array.isArray(metadata.citations) ? metadata.citations : [];
  const toolCalls = Array.isArray(metadata.toolCalls) ? metadata.toolCalls : [];
  const expectedBehavior = expectedValue('expectedBehavior', 'grounded');
  const keywords = Array.isArray(expectedValue('expectKeywords', [])) ? expectedValue('expectKeywords', []) : [];
  const minKeywordHits = Number(expectedValue('minKeywordHits', Math.min(1, keywords.length)));

  const keywordHits = keywords.filter((keyword) => textIncludes(output, keyword)).length;
  const keywordPass = keywords.length === 0 || keywordHits >= minKeywordHits;

  const noCitationExpected =
    expectedBehavior === 'refusal' ||
    expectedBehavior === 'uncertain' ||
    expectedValue('expectUncertain', false) === true ||
    expectedValue('expectNoCitation', false) === true;
  const citationRequired =
    expectedBehavior === 'grounded'
      ? expectedValue('expectCitation', true)
      : expectedValue('expectCitation', false);
  const hasCitation = citations.length > 0;
  const expectedDocMatch = expectedValue('expectDocMatch', undefined);
  const expectedDocCited = expectedDocMatch
    ? citations.some((citation) => citationMatches(citation, expectedDocMatch))
    : true;
  const citationPass = noCitationExpected
    ? !hasCitation
    : (!citationRequired || hasCitation) && expectedDocCited;

  const expectedTools = Array.isArray(expectedValue('expectedToolNames', [])) ? expectedValue('expectedToolNames', []) : [];
  const forbiddenTools = Array.isArray(expectedValue('forbiddenToolNames', [])) ? expectedValue('forbiddenToolNames', []) : [];
  const toolPass =
    expectedTools.every((name) => toolCalls.includes(name)) &&
    forbiddenTools.every((name) => !toolCalls.includes(name));

  const pass = keywordPass && citationPass && toolPass;
  const reasons = [
    keywordPass ? null : `keyword hits ${keywordHits}/${keywords.length}`,
    citationPass ? null : noCitationExpected ? 'unexpected citation' : 'missing or wrong citation',
    toolPass ? null : `tool calls failed: ${toolCalls.join(', ')}`,
  ].filter(Boolean);

  return {
    pass,
    score: pass ? 1 : 0,
    reason: reasons.join('; ') || 'passed',
    namedScores: {
      keyword: keywordPass ? 1 : 0,
      citation: citationPass ? 1 : 0,
      tool: toolPass ? 1 : 0,
    },
  };
};
