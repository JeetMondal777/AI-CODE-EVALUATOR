import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [questions, setQuestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/leetcode.json');
        const data = await res.json();
        const formattedQuestions = data.slice(0, 10).map((q, index) => ({
          id: index + 1,
          ...q,
        }));
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      }
    };
    fetchQuestions();
  }, []);

  const handleQuestionClick = (question) => {
    localStorage.setItem('selectedQuestion', JSON.stringify(question));
    navigate('/question');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row relative font-sans">
      {/* Hamburger Icon */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white text-2xl">
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-50 top-0 left-0 h-full w-2/3 max-w-xs bg-[#121212] p-4 border-r border-[#1f1f1f] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-semibold text-gray-200">Menu</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-white text-xl">
            ✕
          </button>
        </div>

        <button className="bg-[#1f1f1f] px-4 py-2 rounded flex items-center gap-2 text-sm w-full mb-6">
          <span>☰</span> Filter
        </button>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Questions</h2>
        <ul className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between text-sm text-white cursor-pointer hover:bg-[#1f1f1f] px-2 py-1 rounded"
              onClick={() => {
                handleQuestionClick(q);
                setSidebarOpen(false); // Close sidebar on mobile after click
              }}
            >
              <span className="truncate w-[180px] sm:w-[200px]">{q.id}. {q.title}</span>
              {q.difficulty && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    q.difficulty === 'Easy'
                      ? 'bg-green-600 text-white'
                      : q.difficulty === 'Medium'
                      ? 'bg-yellow-600 text-black'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {q.difficulty}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center pt-16 px-4 sm:px-6 md:px-10">
        <div className="max-w-3xl w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center md:text-left">
            Kodrr : Smart Code Assignment Evaluator
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mb-6 text-center md:text-left mx-auto md:mx-0">
            Test your coding skills with our AI-powered code evaluation platform
          </p>

          {/* Info Box */}
          <div className="bg-[#121212] p-5 sm:p-6 rounded-lg border border-[#1f1f1f]">
            <h3 className="text-lg sm:text-xl font-bold mb-3">How Our Organisation Works</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Our Smart Code Evaluation System is an AI-powered automated platform designed to assess
              C, C++, and Data Structures programming assignments efficiently, fairly, and securely. Unlike
              traditional evaluation methods, our system provides a comprehensive assessment by incorporating
              plagiarism detection, automated testing, performance analysis, and code quality assessment.
            </p>

            <h4 className="text-md sm:text-lg font-semibold mt-5 mb-2">Features</h4>
            <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5">
              <li>
                <strong>Detailed Quality Assessment:</strong> Evaluates code readability, adherence to coding standards, and DSA-specific correctness.
              </li>
              <li>
                <strong>Time Analysis of Code Completion:</strong> Measures execution time to ensure performance.
              </li>
              <li>
                <strong>Multiple Test Cases:</strong> Validates with edge, normal, and large test cases.
              </li>
              <li>
                <strong>Suggestive Feedback for Better Approaches:</strong> Recommends efficient algorithm improvements.
              </li>
              <li>
                <strong>Time and Space Complexity Analysis:</strong> Estimates efficiency via static and runtime analysis.
              </li>
              <li>
                <strong>Plagiarism Detection:</strong> Compares submissions to ensure originality.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Profile Picture */}
      <div className="absolute top-4 right-4 z-50">
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="Profile"
          className="w-10 h-10 rounded-full border border-gray-600"
        />
      </div>
    </div>
  );
};

export default Home;
