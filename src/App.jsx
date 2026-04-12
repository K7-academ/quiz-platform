import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { quizzes } from './quizzes';
import './App.css';
import { v4 as uuidv4 } from 'uuid'; // Потрібно встановити: npm install uuid

const quizzesData = quizzes;

function Quiz({ data }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(data.timeLimit || 60);
  const [showHomeButton, setShowHomeButton] = useState(false); // Для затримки кнопки 20с

  // Таймер самого тесту
  useEffect(() => {
    if (showResult || timeLeft <= 0) {
      if (timeLeft === 0 && !showResult) setShowResult(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  // Логіка після завершення тесту
  useEffect(() => {
    if (showResult) {
      // 1. Блокуємо наступну спробу на 15 хвилин (записуємо час фінішу)
      localStorage.setItem('last_attempt_time', Date.now().toString());

      // 2. Робимо паузу 20 секунд перед показом кнопки "До вибору тем"
      const buttonTimer = setTimeout(() => {
        setShowHomeButton(true);
      }, 20000); 

      return () => clearTimeout(buttonTimer);
    }
  }, [showResult]);

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
      <div className="score-section result-card">
        <h2>Результат: {score} з {data.questions.length}</h2>
        <p>Ваша оцінка: {percentage}%</p>
        <p>{percentage >= 70 ? "✅ Тест складено!" : "❌ Спробуйте ще раз"}</p>
        
        <hr style={{ margin: '20px 0', opacity: 0.2 }} />

        {showHomeButton ? (
          <Link to="/" className="counter">До вибору тем</Link>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#aaa' }}>
            ⏳ Повернутися до вибору тем можна буде через 20 сек.
          </p>
        )}
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

function Home() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkLock = () => {
      const lastAttempt = localStorage.getItem('last_attempt_time');
      if (lastAttempt) {
        const diff = Date.now() - parseInt(lastAttempt);
        const lockDuration = 15 * 60 * 1000; // 15 хвилин

        if (diff < lockDuration) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    };

    checkLock();
    // Перевіряємо рідше (раз на 10 секунд), оскільки нам не потрібна секундна точність для таймера
    const interval = setInterval(checkLock, 10000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-section">
      <h1>Оберіть тему тестування</h1>

      {isLocked ? (
        <div className="quiz-card" style={{ border: '1px solid #ff4d4d', padding: '40px' }}>
          <h2 style={{ color: '#ff4d4d' }}>Доступ обмежено</h2>
          <p>Ви вже проходили тестування нещодавно.</p>
          <p style={{ marginTop: '10px' }}>
            Наступна спроба буде доступна через 15 хвилин після попередньої. 
            Будь ласка, зачекайте та повторіть матеріал.
          </p>
        </div>
      ) : (
        <div className="quiz-list">
          {Object.keys(quizzesData).map((id) => (
            <Link 
              key={id} 
              to={`/${id}`} 
              className="counter" 
              style={{display: 'block', margin: '10px auto', width: '250px', textAlign: 'center'}}
            >
              {quizzesData[id].title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizPage() {
  const { quizId } = useParams();
  const quiz = quizzesData[quizId];
  return quiz ? <Quiz data={quiz} /> : <h2>Тест не знайдено</h2>;
}

export default function App() {
  useEffect(() => {
    let visitorId = localStorage.getItem('visitor_id');
    
    if (!visitorId) {
      // Створюємо номер (наприклад, для вашої статистики)
      visitorId = uuidv4();
      localStorage.setItem('visitor_id', visitorId);
      console.log("Присвоєно новий ID:", visitorId);
    } else {
      console.log("Вітаємо знову, ваш ID:", visitorId);
    }
  }, []);

  return (
    <Router>
      <div className="app-container" style={{ 
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