import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { quizzes } from './quizzes';
import './App.css';
import { v4 as uuidv4 } from 'uuid'; 

const quizzesData = quizzes;

// ВСТАВТЕ СЮДИ ВАШ URL, ЯКИЙ ВИ ОТРИМАЛИ ВІД GOOGLE APPS SCRIPT
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzSDN2xZAGsN8YuTWhuynRO5yeJUIOQ_HDhBHFYkrhjzhcIe_X-4jY3gDOWI08_zvZ6/exec"; 

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

  // Логіка блокування, збереження результатів та АВТОМАТИЧНОЇ ВІДПРАВКИ
  useEffect(() => {
    if (showResult) {
      const now = Date.now();
      localStorage.setItem('last_attempt_time', now.toString());
      
      const visitorId = localStorage.getItem('visitor_id') || 'Unknown';
      const percentage = Math.round((score / shuffledQuestions.length) * 100);
      
      const resultEntry = {
        id: now,
        date: new Date().toISOString(),
        visitorId,
        quizTitle: data.title,
        score,
        total: shuffledQuestions.length,
        percentage,
        passed: percentage >= 70
      };

      // 1. Зберігаємо локально (про всяк випадок)
      const localResults = JSON.parse(localStorage.getItem('test_results') || '[]');
      localResults.push(resultEntry);
      localStorage.setItem('test_results', JSON.stringify(localResults));

      // 2. АВТОМАТИЧНО ВІДПРАВЛЯЄМО НА СЕРВЕР (Google Script)
      if (WEBHOOK_URL && WEBHOOK_URL !== "ТУТ_БУДЕ_ВАШ_URL_ВІД_GOOGLE_APPS_SCRIPT") {
        fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "submitResult", // Позначаємо, що це прийшов результат від учня
            ...resultEntry
          }),
        }).catch(err => console.error("Помилка фонової відправки:", err));
      }

      const buttonTimer = setTimeout(() => setShowHomeButton(true), 20000); 
      return () => clearTimeout(buttonTimer);
    }
  }, [showResult, score, shuffledQuestions.length, data.title]);

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

// --- КОМПОНЕНТ 4: ЗВІТ ДЛЯ АДМІНІСТРАТОРА ---
function AdminReport() {
  const [results, setResults] = useState([]);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' або 'detailed'
  const [sendingId, setSendingId] = useState(null);
  
  // ЗАХИСТ ПАРОЛЕМ
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('test_results') || '[]');
    saved.sort((a, b) => b.id - a.id);
    setResults(saved);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin777") { // ВСТАВТЕ СЮДИ ВАШ ПАРОЛЬ
      setIsAuthenticated(true);
    } else {
      alert("Невірний пароль!");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="quiz-card" style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>Вхід для адміністратора</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Введіть пароль" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px', 
              borderRadius: '8px', 
              border: '1px solid #444', 
              background: '#222', 
              color: 'white',
              textAlign: 'center'
            }}
          />
          <button type="submit" className="counter" style={{ width: '100%' }}>Увійти</button>
        </form>
        <Link to="/" style={{ display: 'block', marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>На головну</Link>
      </div>
    );
  }

  const clearResults = () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі результати?')) {
      localStorage.removeItem('test_results');
      setResults([]);
    }
  };

  // Групування результатів
  const getSummary = () => {
    const grouped = {};
    results.forEach(r => {
      const dateObj = new Date(r.date);
      const dateStr = dateObj.toLocaleDateString('uk-UA');
      
      const key = `${dateStr}_${r.quizTitle}`;
      if (!grouped[key]) {
        grouped[key] = {
          dateStr: dateStr,
          topic: r.quizTitle,
          count: 0,
          totalPercentage: 0,
          passCount: 0,
          details: []
        };
      }
      grouped[key].count += 1;
      grouped[key].totalPercentage += r.percentage;
      if (r.passed) grouped[key].passCount += 1;
      grouped[key].details.push(r);
    });

    return Object.values(grouped).map(g => ({
      ...g,
      avgPercentage: Math.round(g.totalPercentage / g.count)
    }));
  };

  const sendWebhookReport = async (group, idx) => {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("ТУТ_БУДЕ_ВАШ_URL")) {
      alert("Будь ласка, спочатку налаштуйте WEBHOOK_URL.");
      return;
    }

    setSendingId(idx);
    // ... решта логіки залишається для ручної відправки за потреби
    const subject = `Звіт з тестування: ${group.topic} за ${group.dateStr}`;
    // (Я залишу fetch тут також, щоб ви могли відправити звіт вручну раніше, ніж спрацює авто-таймер)
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "sendSummary", // Позначаємо, що хочемо негайний звіт по цій темі
          topic: group.topic,
          dateStr: group.dateStr
        }),
      });
      if (response.ok) alert("Запит на відправку звіту надіслано!");
    } catch (error) {
      alert("Помилка з'єднання.");
    } finally {
      setSendingId(null);
    }
  };

  const summaryData = getSummary();

  return (
    <div className="home-section" style={{ width: '90%', maxWidth: '900px', background: 'rgba(26, 26, 26, 0.95)', padding: '30px', borderRadius: '15px' }}>
      <h2 style={{ marginBottom: '20px' }}>Звіт про результати тестувань (Адміністратор)</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setViewMode('summary')}
          style={{ 
            background: viewMode === 'summary' ? '#4caf50' : '#444', 
            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' 
          }}
        >
          Узагальнена статистика
        </button>
        <button 
          onClick={() => setViewMode('detailed')}
          style={{ 
            background: viewMode === 'detailed' ? '#4caf50' : '#444', 
            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' 
          }}
        >
          Детальна статистика
        </button>
        <div style={{ flex: 1 }}></div>
        <button onClick={clearResults} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          Очистити результати
        </button>
      </div>
      
      {results.length === 0 ? (
        <p>Немає результатів для відображення.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {viewMode === 'summary' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th style={{ padding: '10px' }}>Дата</th>
                  <th style={{ padding: '10px' }}>Тема</th>
                  <th style={{ padding: '10px' }}>Учасників</th>
                  <th style={{ padding: '10px' }}>Сер. бал</th>
                  <th style={{ padding: '10px' }}>Успішність</th>
                  <th style={{ padding: '10px' }}>Дія</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((g, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px' }}>{g.dateStr}</td>
                    <td style={{ padding: '10px' }}>{g.topic}</td>
                    <td style={{ padding: '10px' }}>{g.count}</td>
                    <td style={{ padding: '10px' }}>{g.avgPercentage}%</td>
                    <td style={{ padding: '10px' }}>{g.passCount} з {g.count} ({Math.round((g.passCount / g.count) * 100)}%)</td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        onClick={() => sendWebhookReport(g, idx)}
                        disabled={sendingId === idx}
                        style={{ 
                          background: sendingId === idx ? '#888' : '#2196F3', 
                          color: 'white', border: 'none', padding: '5px 10px', 
                          borderRadius: '3px', cursor: sendingId === idx ? 'not-allowed' : 'pointer', 
                          fontSize: '0.9rem' 
                        }}
                      >
                        {sendingId === idx ? 'Відправляється...' : 'Відправити звіт'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th style={{ padding: '10px' }}>Дата та час</th>
                  <th style={{ padding: '10px' }}>ID Користувача</th>
                  <th style={{ padding: '10px' }}>Тема</th>
                  <th style={{ padding: '10px' }}>Результат</th>
                  <th style={{ padding: '10px' }}>Відсоток</th>
                  <th style={{ padding: '10px' }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px' }}>{new Date(r.date).toLocaleString('uk-UA')}</td>
                    <td style={{ padding: '10px' }} title={r.visitorId}>{r.visitorId.substring(0, 8)}...</td>
                    <td style={{ padding: '10px' }}>{r.quizTitle}</td>
                    <td style={{ padding: '10px' }}>{r.score} / {r.total}</td>
                    <td style={{ padding: '10px' }}>{r.percentage}%</td>
                    <td style={{ padding: '10px', color: r.passed ? '#4caf50' : '#ff4d4d', fontWeight: 'bold' }}>
                      {r.passed ? 'Складено' : 'Не складено'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <div style={{ marginTop: '30px' }}>
        <Link to="/" className="counter">На головну</Link>
      </div>
    </div>
  );
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
          <Route path="/admin" element={<AdminReport />} />
          <Route path="/:quizId" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}