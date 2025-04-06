import React, { useEffect, useState } from "react";

export default function CodeFeedback() {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("codeFeedback");
    if (stored) setFeedback(JSON.parse(stored));
  }, []);

  if (!feedback) return <p className="text-white p-6">No feedback found</p>;

  const { code, analysis, testResults } = feedback;

  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.length - passedCount;

  const generalSuggestions = analysis?.suggestions
    ? analysis.suggestions.split("\n").filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Code Panel */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-xl font-bold mb-2">Code</h2>
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>

        {/* General Suggestions */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-xl font-bold mb-2">General Suggestions</h2>
          {generalSuggestions.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {generalSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>No suggestions found.</p>
          )}
        </div>
      </div>

      {/* Test Case Results + Fix Suggestions */}
      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Test Case Results</h2>
        <p className="mb-4">
          ✅ <strong>{passedCount}</strong> Passed | ❌{" "}
          <strong>{failedCount}</strong> Failed
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test Results */}
          <div>
            {testResults.map((t, i) => (
              <div
                key={i}
                className={`mb-4 p-4 rounded-xl ${
                  t.passed ? "bg-green-800" : "bg-red-800"
                }`}
              >
                <p>
                  <strong>Input:</strong>{" "}
                  <code>{JSON.stringify(t.input)}</code>
                </p>
                <p>
                  <strong>Expected:</strong>{" "}
                  <code>{JSON.stringify(t.expectedOutput)}</code>
                </p>
                <p>
                  <strong>Got:</strong>{" "}
                  <code>{JSON.stringify(t.actualOutput)}</code>
                </p>
                <p>{t.passed ? "✅ Passed" : "❌ Failed"}</p>

                {!t.passed && t.suggestion && (
                  <div className="mt-3 bg-black bg-opacity-20 p-3 rounded-md border border-white/20">
                    <p className="font-semibold underline mb-1">
                      Fix Suggestion for this case:
                    </p>
                    <p className="text-sm">{t.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Analysis Panel */}
          <div>
            <p>
              <strong>Code Quality:</strong>{" "}
              <span className="text-green-400">{analysis?.codeQuality}</span>
            </p>
            <p>
              <strong>Compilation Time:</strong>{" "}
              <span className="text-green-400">{analysis?.compilationTime}</span>
            </p>
            <p>
              <strong>Space Complexity:</strong>{" "}
              <span className="text-green-400">{analysis?.spaceComplexity}</span>
            </p>
            <p>
              <strong>Time Complexity:</strong>{" "}
              <span className="text-green-400">{analysis?.timeComplexity}</span>
            </p>
            <p>
              <strong>Acceptable:</strong>{" "}
              <span className="text-green-400">{analysis?.acceptable}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
