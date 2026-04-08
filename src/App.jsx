import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { quizzesData } from './quizzes';

// Компонент самого тесту
function Quiz({ data }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const handleAnswer = (selected) => {
    if (selected === data.questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < data.questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowScore(true);
    }
  };

  if (showScore) {
    return (
      <div className="score-section">
        <h2>Результат: {score} з {data.questions.length}</h2>
        <Link title="На головну" to="/" className="counter">Повернутися до вибору тем</Link>
      </div>
    );
  }

  return (
    <div className="quiz-section">
      <h1>{data.title}</h1>
      <div className="question-count">Питання {currentQuestion + 1} / {data.questions.length}</div>
      <div className="question-text">{data.questions[currentQuestion].question}</div>
      <div className="answer-options">
        {data.questions[currentQuestion].options.map((option) => (
          <button key={option} onClick={() => handleAnswer(option)}>{option}</button>
        ))}
      </div>
    </div>
  );
}

// Сторінка вибору тесту
function Home() {
  return (
    <div className="home-section">
      <h1>Оберіть тему тестування</h1>
      <div className="quiz-list">
        {Object.keys(quizzesData).map((id) => (
          <Link key={id} to={`/${id}`} className="counter" style={{display: 'block', margin: '10px auto', width: '200px'}}>
            {quizzesData[id].title}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Сторінка-обробник маршруту
function QuizPage() {
  const { quizId } = useParams();
  const quiz = quizzesData[quizId];
  return quiz ? <Quiz data={quiz} /> : <h2>Тест не знайдено</h2>;
}

// Головний компонент з роутингом
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:quizId" element={<QuizPage />} />
      </Routes>
    </Router>
  );
}