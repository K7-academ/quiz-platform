import React, { useState, useEffect } from 'react'; // Об'єднали імпорти
import { HashRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { quizzes } from './quizzes';
import './App.css';

const quizzesData = quizzes;

function Quiz({ data }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(data.timeLimit || 60); // Додав дефолтні 60 сек, якщо забудеш вказати в quizzes.js

  useEffect(() => {
    if (showResult || timeLeft <= 0) {
      if (timeLeft === 0) setShowResult(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  const handleAnswer = (option) => {
    if (option === data.questions[currentQuestion].answer) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < data.questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowResult(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (showResult) {
    const percentage = Math.round((score / data.questions.length) * 100);
    return (
      <div className="score-section">
        <h2>Результат: {score} з {data.questions.length}</h2>
        <p>Ваша оцінка: {percentage}%</p>
        <p>{percentage >= 70 ? "✅ Тест складено!" : "❌ Спробуйте ще раз"}</p>
        <Link to="/" className="counter">До вибору тем</Link>
      </div>
    );
  }

  const question = data.questions[currentQuestion];

  return (
    <div className="quiz-section">
      <div className={`timer ${timeLeft < 10 ? 'danger' : ''}`}>
        ⏱ Час: {formatTime(timeLeft)}
      </div>
      <h1>{data.title}</h1>
      <div className="status">
        Питання {currentQuestion + 1} / {data.questions.length}
      </div>
      <div className="question-text">{question.question}</div>
      <div className="answer-options">
        {question.options.map((option) => (
          <button key={option} onClick={() => handleAnswer(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// Функції Home, QuizPage та App залишаються без змін (як у тебе)
function Home() {
  return (
    <div className="home-section">
      <h1>Оберіть тему тестування</h1>
      <div className="quiz-list">
        {Object.keys(quizzesData).map((id) => (
          <Link key={id} to={`/${id}`} className="counter" style={{display: 'block', margin: '10px auto', width: '250px', textAlign: 'center'}}>
            {quizzesData[id].title}
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuizPage() {
  const { quizId } = useParams();
  const quiz = quizzesData[quizId];
  return quiz ? <Quiz data={quiz} /> : <h2>Тест не знайдено</h2>;
}

export default function App() {
  return (
    <Router>
      <div className="app-container" style={{ 
          /* Прибираємо крапку, щоб звертатися від кореня сервера */
          backgroundImage: "url('./background.svg')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:quizId" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}