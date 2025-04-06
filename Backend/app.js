const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const os = require("os");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log("DeepSeek API Key loaded?", !!process.env.DEEPSEEK_API_KEY);

async function checkPlagiarism(code) {
  const prompt = `You are a strict code plagiarism checker.

Code:
${code}

Detect if this code is:
- "copied code" (even if partially from GeeksforGeeks, StackOverflow, GitHub, or AI tools)
- "not copied code" (original, self-written, basic print functions, loops, reursion, mathematical operations or basic logical operations or basic beginner friendly code etc.)

Respond only with one of the following:
- copied code
- not copied code`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Compiler Plagiarism Checker",
      },
    }
  );

  const reply = response.data.choices[0].message.content.toLowerCase();
  if (reply.includes("not copied code")){
    return "not copied code";
  }else{
    return "copied code";
  }
  // return "unknown";
}

async function analyzeCode(code, question) {
  const prompt = `
Analyze the following C/C++ code for the problem:

Title: ${question.title}
Description: ${question.description}
Examples:
Input: ${JSON.stringify(question.exampleInput)}
Expected Output: ${JSON.stringify(question.exampleOutput)}

Code:
${code}

Respond with:
- Suggestions (if any) to fix and pass test cases
- Time complexity
- Space complexity
- Compilation speed (Slow/Medium/Fast)
- Code quality (Acceptable/Needs Improvement/Excellent)
- Is the current code acceptable?

Only return a JSON object like this:
{
  "suggestions": "...",
  "timeComplexity": "...",
  "spaceComplexity": "...",
  "compilationTime": "...",
  "codeQuality": "...",
  "acceptable": "Yes/No"
}`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 700,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Compiler Analyzer",
      },
    }
  );

  try {
    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    return { error: "Failed to parse code analysis" };
  }
}

async function generateFixSuggestion(code, input, expectedOutput) {
  const prompt = `You are a helpful C/C++ expert.

Given this C/C++ code:

${code}

It failed the following test case:
Input: ${input}
Expected Output: ${expectedOutput}

Suggest what changes or logic improvements are needed in the code to pass this test case.

Respond with only the suggestion.`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Fix Suggestion Generator",
      },
    }
  );

  return response.data.choices[0].message.content.trim();
}

// ... (same imports as before)

app.post("/compile", async (req, res) => {
  const { code, language, question } = req.body;

  if (!code || !language || !question) {
    return res.status(400).json({ error: "Missing code, language, or question" });
  }

  const extension = language === "cpp" ? "cpp" : "c";
  const fileName = `main.${extension}`;
  const filePath = path.join(__dirname, fileName);
  const outputFile = os.platform() === "win32" ? "a.exe" : "a.out";
  const outputPath = path.join(__dirname, outputFile);
  const execPath = os.platform() === "win32" ? `"${outputPath}"` : `./${outputFile}`;

  try {
    fs.writeFileSync(filePath, code);
    const compileCommand = `gcc -Wall -Werror -o "${outputPath}" "${filePath}"`;

    exec(compileCommand, async (compileErr, _, compileStderr) => {
      const analysis = await analyzeCode(code, question);

      // Step 1: Return early on compilation error
      if (compileErr) {
        return res.json({
          error: compileStderr,
          testResults: [],
          codeAnalysis: analysis,
        });
      }

      // Step 2: Run test cases
      const testResults = [];
      const testCases = question.testCases || [];

      for (const testCase of testCases) {
        const input = testCase.input;
        const expectedOutput = [testCase.output];

        const runCommand =
          os.platform() === "win32"
            ? `echo "${input}" | cmd /c ${execPath}`
            : `echo "${input}" | ${execPath}`;

        const result = await new Promise((resolve) => {
          exec(runCommand, async (err, stdout) => {
            let actual = String(stdout).trim();
            let expected = String(expectedOutput).trim();
            let passed = false;

            try {
              const parsedActual = JSON.parse(actual);
              const parsedExpected = JSON.parse(`[${expected}]`);
              passed =
                Array.isArray(parsedActual) &&
                Array.isArray(parsedExpected) &&
                parsedActual.length === parsedExpected.length &&
                parsedActual.every((val, i) => val === parsedExpected[i]);
            } catch {
              passed = actual === expected;
            }

            let suggestion = null;
            if (!passed) {
              suggestion = await generateFixSuggestion(code, input, expectedOutput);
            }

            resolve({
              input,
              expectedOutput: String(expectedOutput),
              actualOutput: stdout.trim(),
              passed,
              suggestion,
            });
          });
        });

        testResults.push(result);
      }

      // Step 3: Only check plagiarism if compilation was successful AND not in dev
      let plagiarismResult = "not checked";
      if (process.env.NODE_ENV !== "development") {
        try {
          plagiarismResult = await checkPlagiarism(code);
          if (plagiarismResult === "copied code") {
            return res.json({
              error: "Code detected as plagiarized or copied.",
              plagiarism: plagiarismResult,
            });
          }
        } catch (err) {
          console.error("Plagiarism check failed:", err.message);
        }
      }

      // Step 4: Final response
      return res.json({
        output: testResults.every((t) => t.passed)
          ? "✅ All test cases passed."
          : "⚠️ Some test cases failed.",
        plagiarism: plagiarismResult,
        testResults,
        codeAnalysis: analysis,
      });
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Compiler backend running on http://localhost:${PORT}`);
});
