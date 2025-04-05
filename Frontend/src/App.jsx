// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/components/LandingPage";
import QuestionPage from "./pages/components/questionPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/question" element={<QuestionPage />} />
      </Routes>
    </Router>
  );
};

export default App;
