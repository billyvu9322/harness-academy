function textIncludes(haystack, needle) {
  return String(haystack || '').toLowerCase().includes(String(needle || '').toLowerCase());
}

function citationMatches(citation, needle) {
  const haystack = `${citation?.sourcePath || ''} ${citation?.route || ''} ${citation?.title || ''}`;
  return textIncludes(haystack, needle);
}

module.exports = (output, context = {}) => {
  const vars = context.vars || {};
  const metadata = context.metadata || context.providerResponse?.metadata || {};
  const citations = Array.isArray(metadata.citations) ? metadata.citations : [];
  const toolCalls = Array.isArray(metadata.toolCalls) ? metadata.toolCalls : [];
  const keywords = Array.isArray(vars.expectKeywords) ? vars.expectKeywords : [];
  const minKeywordHits = Number(vars.minKeywordHits ?? Math.min(1, keywords.length));

  const keywordHits = keywords.filter((keyword) => textIncludes(output, keyword)).length;
  const keywordPass = keywords.length === 0 || keywordHits >= minKeywordHits;

  const noCitationExpected = vars.expectUncertain === true || vars.expectNoCitation === true;
  const citationRequired = vars.expectCitation ?? !noCitationExpected;
  const hasCitation = citations.length > 0;
  const expectedDocCited = vars.expectDocMatch
    ? citations.some((citation) => citationMatches(citation, vars.expectDocMatch))
    : true;
  const citationPass = noCitationExpected
    ? !hasCitation
    : (!citationRequired || hasCitation) && expectedDocCited;

  const expectedTools = Array.isArray(vars.expectedToolNames) ? vars.expectedToolNames : [];
  const forbiddenTools = Array.isArray(vars.forbiddenToolNames) ? vars.forbiddenToolNames : [];
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
