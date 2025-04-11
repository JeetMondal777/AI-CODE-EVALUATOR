import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function CodeFeedback() {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("codeFeedback");
    if (stored) setFeedback(JSON.parse(stored));
  }, []);

  if (!feedback) return <p className="text-white p-6">No feedback found</p>;

  const { code, analysis, testResults, improvementSuggestion } = feedback;

  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.length - passedCount;

  const generalSuggestions = analysis?.suggestions
    ? analysis.suggestions.split("\n").filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono flex flex-col">
      {/* Top Section: Code + Suggestions */}
      <div className="h-[70vh] grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Code Panel */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-xl overflow-auto">
          <h2 className="text-xl font-semibold text-white mb-4">Code</h2>
          <pre className="whitespace-pre-wrap text-sm text-yellow-200">
            {code}
          </pre>
        </div>

        {/* Suggestions Panel */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-xl overflow-auto">
          <h2 className="text-xl font-semibold text-yellow-300 mb-4">
            Suggestions
          </h2>

          {generalSuggestions.length ? (
            <ul className="list-disc list-inside space-y-2 text-sm text-yellow-100">
              {generalSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-yellow-100">No suggestions found.</p>
          )}

          {passedCount === testResults.length && improvementSuggestion && (
            <div className="mt-4 p-3 bg-[#292929] rounded-xl border border-gray-700">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <div className="text-yellow-100 text-sm" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-yellow-100 text-sm list-disc ml-4" {...props} />
                  ),
                  code: ({ node, inline, className, children, ...props }) =>
                    inline ? (
                      <code className="bg-gray-700 px-1 rounded text-yellow-100 text-sm" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-800 p-2 rounded overflow-auto text-yellow-100 text-sm">
                        <code {...props}>{children}</code>
                      </pre>
                    ),
                }}
              >
                {improvementSuggestion}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Test Results + Analysis */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Code Analysis</h2>

          <div className="mb-6">
            <p className="text-green-400 text-sm">
              ✅ <strong>{passedCount}</strong> Passed &nbsp; | &nbsp;
              ❌ <strong>{failedCount}</strong> Failed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Case Panel */}
            <div className="space-y-4 max-h-[300px] overflow-auto">
              {testResults.map((t, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${
                    t.passed ? "bg-green-900" : "bg-red-900"
                  }`}
                >
                  <p><strong>Input:</strong> <code>{JSON.stringify(t.input)}</code></p>
                  <p><strong>Expected:</strong> <code>{JSON.stringify(t.expectedOutput)}</code></p>
                  <p><strong>Got:</strong> <code>{JSON.stringify(t.actualOutput)}</code></p>
                  <p>{t.passed ? "✅ Passed" : "❌ Failed"}</p>

                  {!t.passed && t.suggestion && (
                    <div className="mt-3 bg-black bg-opacity-20 p-3 rounded-md border border-white/20">
                      <p className="font-semibold underline mb-1">
                        Fix Suggestion for this case:
                      </p>
                      <p className="text-sm text-white">{t.suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metric Panel */}
            <div className="text-sm space-y-3 text-white">
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
    </div>
  );
}
