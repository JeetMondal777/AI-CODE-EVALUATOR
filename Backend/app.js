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

app.disable("x-powered-by");
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-code-evaluator-frontend.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST"],
}));

app.use(express.json());

console.log("DeepSeek API Key loaded?", !!process.env.DEEPSEEK_API_KEY);

async function checkPlagiarism(code) {
  const prompt = `You are a strict code plagiarism checker.

Code:
${code}

Detect if this code is:
- "copied code" (even if partially from GeeksforGeeks, StackOverflow, GitHub, or AI agent tools like chatGPT, Bard, Deepseek, BlackBox etc and if the code is so good at following best practices then also it is a copied code.)
- "not copied code" (original, self-written, basic print functions, loops, recursion, mathematical operations or basic logical operations etc.)

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
  return reply.includes("not copied code") ? "not copied code" : "copied code";
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
}
`;

  try {
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

    const content = response.data.choices[0].message.content.trim();

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      const jsonString = content.substring(start, end + 1);
      return JSON.parse(jsonString);
    } else {
      throw new Error("JSON block not found in response");
    }
  } catch (err) {
    console.error("Failed to parse code analysis response:", err.message);
    return {
      suggestions: "Could not analyze suggestions.",
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      compilationTime: "Unknown",
      codeQuality: "Needs Improvement",
      acceptable: "No",
    };
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

async function generateImprovementSuggestion(code, language, title) {
  const prompt = `The following code written in "${language}" solves the problem titled "${title}". It passes all test cases. Suggest an improved approach to solve it more efficiently in about 300 words. Don't include any full code but you can provide short example code for better understanding and also explain the improved approach:\n\n${code}.\n\n and also leave some space below after every point explanation to make it more readable`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 500,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Improvement Suggestion Generator",
      },
    }
  );

  return response.data.choices[0].message.content.trim();
}

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

      if (compileErr) {
        return res.json({
          error: compileStderr,
          testResults: [],
          codeAnalysis: analysis,
        });
      }

      const testCase = question.testCases?.[0];
      if (!testCase) {
        return res.status(400).json({ error: "No test case provided." });
      }

      const input = testCase.input;
      const expectedOutput = testCase.output;

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

      let improvementSuggestion = null;
      if (result.passed) {
        improvementSuggestion = await generateImprovementSuggestion(code, language, question.title);
      }

      return res.json({
        output: result.passed ? "✅ Test case passed." : "⚠️ Test case failed.",
        plagiarism: plagiarismResult,
        testResults: [result],
        codeAnalysis: analysis,
        improvementSuggestion,
      });
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Compiler backend is running.");
})

app.listen(PORT, () => {
  console.log(`Compiler backend running on http://localhost:${PORT}`);
});
