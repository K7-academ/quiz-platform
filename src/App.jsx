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
  
  // НОВИЙ СТАН: для збереження історії відповідей користувача
  const [userAnswers, setUserAnswers] = useState([]);

  // Функція перемішування (алгоритм Фішера-Єйтса)
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

  // Таймер самого тесту
  useEffect(() => {
    if (showResult || timeLeft <= 0) {
      if (timeLeft === 0 && !showResult) setShowResult(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  // Логіка блокування та появи кнопки
  useEffect(() => {
    if (showResult) {
      localStorage.setItem('last_attempt_time', Date.now().toString());
      const buttonTimer = setTimeout(() => setShowHomeButton(true), 20000); 
      return () => clearTimeout(buttonTimer);
    }
  }, [showResult]);

  // ОНОВЛЕНА ЛОГІКА ОБРОБКИ ВІДПОВІДІ
  const handleAnswer = (option) => {
    const currentQ = shuffledQuestions[currentQuestion];
    const isCorrect = option === currentQ.answer;

    if (isCorrect) {
      setScore(score + 1);
    }

    // Записуємо вибір користувача в історію
    setUserAnswers(prev => [...prev, {
      questionText: currentQ.question,
      userChoice: option,
      correctAnswer: currentQ.answer,
      isCorrect: isCorrect
    }]);

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

  // ОНОВЛЕНИЙ ЕКРАН РЕЗУЛЬТАТІВ
  if (showResult) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    
    // Фільтруємо лише неправильні відповіді
    const incorrectAnswers = userAnswers.filter(ans => !ans.isCorrect);

    return (
      <div className="score-section result-card" style={{ maxWidth: '600px', width: '100%' }}>
        <h2>Результат: {score} з {shuffledQuestions.length}</h2>
        <p>Ваша оцінка: {percentage}%</p>
        <p>{percentage >= 70 ? "✅ Тест складено!" : "❌ Спробуйте ще раз"}</p>
        
        {/* БЛОК АНАЛІЗУ ПОМИЛОК */}
        {incorrectAnswers.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'left', 
            background: 'rgba(0, 0, 0, 0.3)', 
            padding: '15px', 
            borderRadius: '10px',
            maxHeight: '300px', // Обмеження висоти
            overflowY: 'auto',  // Прокрутка, якщо помилок багато
            border: '1px solid rgba(255, 77, 77, 0.3)'
          }}>
            <h3 style={{ color: '#ff4d4d', fontSize: '1.2rem', marginBottom: '15px', textAlign: 'center' }}>
              Аналіз помилок
            </h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {incorrectAnswers.map((item, index) => (
                <li key={index} style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '8px' }}>
                    {index + 1}. {item.questionText}
                  </p>
                  <p style={{ color: '#ff4d4d', margin: '4px 0', fontSize: '0.9rem' }}>
                    ❌ Ваша відповідь: {item.userChoice}
                  </p>
                  <p style={{ color: '#4caf50', margin: '4px 0', fontSize: '0.9rem' }}>
                    ✅ Правильно: {item.correctAnswer}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {incorrectAnswers.length === 0 && percentage === 100 && (
          <p style={{ color: '#4caf50', marginTop: '15px' }}>Бездоганна робота! Помилок немає.</p>
        )}

        <hr style={{ margin: '20px 0', opacity: 0.2 }} />

        {showHomeButton ? (
          <Link to="/" className="counter">До вибору тем</Link>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#aaa', fontSize: '0.9rem' }}>
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
        if (diff < 15 * 60 * 1000) { // 15 хвилин
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

  // 1. ВАРІАНТ ДЛЯ ЗАБЛОКОВАНОГО ЕКРАНУ
  // Повертаємо ТІЛЬКИ картку. app-container відцентрує її ідеально.
  if (isLocked) {
    return (
      <div className="quiz-card" style={{ 
        border: '1px solid #ff4d4d', 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        background: 'rgba(26, 26, 26, 0.95)', // Напівпрозорий темний фон
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: '#ff4d4d', marginBottom: '15px' }}>Доступ обмежено</h2>
        <p>Ви вже проходили тестування нещодавно.</p>
        <p style={{ marginTop: '15px', opacity: 0.8, lineHeight: '1.5' }}>
          Наступна спроба буде доступна через 15 хвилин після попередньої.<br/>
          Будь ласка, зачекайте та повторіть матеріал.
        </p>
      </div>
    );
  }

  // 2. ВАРІАНТ ДЛЯ ВІДКРИТОГО ДОСТУПУ (Зі списком тем)
  return (
    <div className="home-section" style={{ textAlign: 'center', width: '100%' }}>
      <h1>Оберіть тему тестування</h1>
      <div className="quiz-list">
        {Object.keys(quizzesData).map((id) => (
          <Link 
            key={id} 
            to={`/${id}`} 
            className="counter" 
            style={{display: 'block', margin: '15px auto', width: '250px', textAlign: 'center'}}
          >
            {quizzesData[id].title}
          </Link>
        ))}
      </div>
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