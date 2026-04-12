import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { quizzes } from './quizzes';
import './App.css';
import { v4 as uuidv4 } from 'uuid'; 

const quizzesData = quizzes;

// --- КОМПОНЕНТ 1: САМ ТЕСТ ---
function Quiz({ data }) {
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(data.timeLimit || 60);
  const [showHomeButton, setShowHomeButton] = useState(false);

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  useEffect(() => {
    if (data && data.questions) {
      const randomizedQuestions = shuffleArray(data.questions).map(q => ({
        ...q,
        options: shuffleArray(q.options) 
      }));
      setShuffledQuestions(randomizedQuestions);
    }
  }, [data]);

  useEffect(() => {
    if (showResult || timeLeft <= 0) {
      if (timeLeft === 0 && !showResult) setShowResult(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  useEffect(() => {
    if (showResult) {
      // Записуємо час завершення
      localStorage.setItem('last_attempt_time', Date.now().toString());
      const buttonTimer = setTimeout(() => setShowHomeButton(true), 20000); 
      return () => clearTimeout(buttonTimer);
    }
  }, [showResult]);

  const handleAnswer = (option) => {
    if (option === shuffledQuestions[currentQuestion].answer) {
      setScore(score + 1);
    }
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < shuffledQuestions.length) {
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

  if (shuffledQuestions.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Підготовка тесту...</div>;
  }

  if (showResult) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <div className="score-section result-card">
        <h2>Результат: {score} з {shuffledQuestions.length}</h2>
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

  const question = shuffledQuestions[currentQuestion];

  return (
    <div className="quiz-section">
      <div className={`timer ${timeLeft < 10 ? 'danger' : ''}`}>
        ⏱ Час: {formatTime(timeLeft)}
      </div>
      <h1>{data.title}</h1>
      <div className="status">Питання {currentQuestion + 1} / {shuffledQuestions.length}</div>
      <div className="question-text">{question.question}</div>
      <div className="answer-options">
        {question.options.map((option) => (
          <button key={option} onClick={() => handleAnswer(option)}>{option}</button>
        ))}
      </div>
    </div>
  );
}

// --- КОМПОНЕНТ 2: ГОЛОВНА СТОРІНКА (ВИБІР ТЕМ) ---
function Home() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkLock = () => {
      const lastAttempt = localStorage.getItem('last_attempt_time');
      if (lastAttempt) {
        const diff = Date.now() - parseInt(lastAttempt, 10);
        if (diff < 15 * 60 * 1000) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 10000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <h1>Оберіть тему тестування</h1>

      {isLocked ? (
        <div className="quiz-card" style={{ border: '1px solid #ff4d4d', padding: '40px', margin: '20px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: '#ff4d4d', marginBottom: '15px' }}>Доступ обмежено</h2>
          <p style={{ textAlign: 'center' }}>Ви вже проходили тестування нещодавно.</p>
          <p style={{ marginTop: '15px', opacity: 0.8, textAlign: 'center' }}>
            Наступна спроба буде доступна через 15 хвилин після попередньої. 
            Будь ласка, зачекайте та повторіть матеріал.
          </p>
        </div>
      ) : (
        <div className="quiz-list" style={{ width: '100%', textAlign: 'center' }}>
          {Object.keys(quizzesData).map((id) => (
            <Link key={id} to={`/${id}`} className="counter" style={{display: 'block', margin: '15px auto', width: '250px', textAlign: 'center'}}>
              {quizzesData[id].title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// --- КОМПОНЕНТ 3: СТОРІНКА ЗАПУСКУ (ЗАХИСТ ВІД "НАЗАД") ---
function QuizPage() {
  const { quizId } = useParams();
  const quiz = quizzesData[quizId];
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const lastAttempt = localStorage.getItem('last_attempt_time');
    if (lastAttempt) {
      const diff = Date.now() - parseInt(lastAttempt, 10);
      if (diff < 15 * 60 * 1000) {
        setIsLocked(true);
      }
    }
  }, []);

  // Якщо користувач спробував хитро зайти через пряме посилання або кнопку "Назад"
  if (isLocked) {
    return (
      <div className="home-section" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="quiz-card" style={{ border: '1px solid #ff4d4d', textAlign: 'center' }}>
          <h2 style={{ color: '#ff4d4d' }}>Доступ закрито</h2>
          <p>Спроба обійти блокування. Наступний тест доступний лише через 15 хвилин.</p>
          <Link to="/" className="counter" style={{ display: 'inline-block', marginTop: '20px' }}>На головну</Link>
        </div>
      </div>
    );
  }

  return quiz ? <Quiz data={quiz} /> : <h2>Тест не знайдено</h2>;
}

// --- ГОЛОВНИЙ КОМПОНЕНТ ---
export default function App() {
  useEffect(() => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem('visitor_id', visitorId);
    }
  }, []);

  return (
    <Router>
      <div className="app-container" style={{ 
          backgroundImage: "url('background.svg')", 
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