// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/components/LandingPage";
import QuestionPage from "./pages/components/questionPage";
import CodeFeedback from "./pages/components/CodeFeedback";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/code" element={<CodeFeedback />} />
      </Routes>
    </Router>
  );
};

export default App;
