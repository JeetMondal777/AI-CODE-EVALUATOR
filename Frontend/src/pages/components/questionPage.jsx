import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function QuestionPage() {
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState(null);
  const [output, setOutput] = useState("");
  const [plagiarism, setPlagiarism] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("selectedQuestion");
    if (stored) setQuestion(JSON.parse(stored));

    setCode(`#include <stdio.h>\nint main() {\n  printf("Hello from GCC!\\n");\n  return 0;\n}`);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setOutput("");
    setPlagiarism("");
    setShowPlagiarismModal(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "c", question }),
      });
      console.log(response);
      
      const result = await response.json();
      console.log(result);
      

      if (result.plagiarism === "copied code") {
        setPlagiarism(result.plagiarism);
        setShowPlagiarismModal(true);
        return;
      }

      let safeCodeAnalysis = {};
      try {
        if (typeof result.codeAnalysis === "string") {
          // Try parsing if it's a JSON string
          safeCodeAnalysis = JSON.parse(result.codeAnalysis);
        } else if (typeof result.codeAnalysis === "object" && result.codeAnalysis !== null) {
          safeCodeAnalysis = result.codeAnalysis;
        } else {
          safeCodeAnalysis = { error: "Invalid format for code analysis" };
        }
      } catch (err) {
        console.error("Failed to parse code analysis:", err);
        safeCodeAnalysis = { error: "Failed to parse code analysis" };
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
      

      if (!result.error) {
        navigate("/code");
      } else {
        setOutput(result.error);
      }
    } catch (err) {
      setOutput("⚠️ Failed to connect to the compiler backend.");
      console.error("Compiler connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatData = (data) => {
    if (typeof data === "object") {
      return <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
    } else {
      return <code>{String(data)}</code>;
    }
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans relative">
      {showPlagiarismModal && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#121212] p-8 rounded-2xl shadow-lg border border-zinc-700 text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Code Plagiarized</h2>
            <p className="text-zinc-300 mb-6">The submitted code contains plagiarized content.</p>
            <button
              onClick={() => setShowPlagiarismModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl"
            >
              Redo
            </button>
          </div>
        </div>
      )}

      {/* Question Panel */}
      <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-zinc-700 shadow-md">
        <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
        <h2 className="text-xl font-semibold mb-2 text-purple-400">Description</h2>
        <p className="mb-4 text-zinc-300 leading-relaxed">{question.description}</p>
        <h2 className="text-xl font-semibold mb-2 text-purple-400">Example</h2>
        <div className="bg-[#2a2a2a] p-4 rounded-xl text-sm text-zinc-200 space-y-3">
          <div>
            <p className="font-semibold">Input:</p>
            {formatData(question.exampleInput)}
          </div>
          <div>
            <p className="font-semibold">Output:</p>
            {formatData(question.exampleOutput)}
          </div>
          {question.explanation && (
            <div>
              <p className="font-semibold">Explanation:</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Editor Panel */}
      <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-zinc-700 flex flex-col">
        <textarea
          className="flex-grow bg-[#0f0f0f] text-green-400 font-mono p-4 rounded-xl resize-none outline-none border border-zinc-600"
          rows={20}
          placeholder="// Write your C/C++ solution here"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 py-2 px-6 rounded-xl self-end font-semibold transition-colors ${
            loading ? "bg-purple-800 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {loading ? "Compiling..." : "Submit"}
        </button>

        {output && (
          <div className="mt-4 bg-black p-4 rounded-xl text-sm text-white whitespace-pre-wrap border border-zinc-700">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
