const result = await response.json();
console.log(result);

if (result.plagiarism === "copied code") {
  setPlagiarism(result.plagiarism);
  setShowPlagiarismModal(true);
  return;
}

let safeCodeAnalysis = {};
try {
  if (result.codeAnalysis && typeof result.codeAnalysis === "object") {
    safeCodeAnalysis = result.codeAnalysis;
  } else {
    safeCodeAnalysis = { error: "Invalid code analysis format" };
  }
} catch (err) {
  console.error("Failed to process code analysis:", err);
  safeCodeAnalysis = { error: "Failed to process code analysis" };
}

localStorage.setItem(
  "codeFeedback",
  JSON.stringify({
    code,
    analysis: safeCodeAnalysis,
    testResults: result.testResults || [],
    compilationError: result.error || null,
    improvementSuggestion: result.improvementSuggestion || null,
  })
); 