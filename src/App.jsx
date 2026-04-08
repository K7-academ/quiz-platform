import { useState } from 'react'
import './App.css'

// 1. Ваша база питань (потім її можна винести в окремий JSON-файл)
const questions = [
  {
    id: 1,
    question: "Яка команда використовується для створення нового Vite проєкту?",
    options: ["npm start", "npm create vite", "git init", "node run"],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Чи підтримує GitHub Pages серверний Python?",
    options: ["Так", "Ні", "Тільки в платній версії", "Тільки через API"],
    correctAnswer: 1
  }
];

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Функція обробки кліку на відповідь
  const handleAnswerClick = (index) => {
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="app-container">
      {showResult ? (
        <div className="result-card">
          <h2>Тест завершено!</h2>
          <p>Ви набрали {score} з {questions.length} балів.</p>
          <button onClick={() => window.location.reload()}>Пройти знову</button>
        </div>
      ) : (
        <div className="quiz-card">
          <div className="status">Питання {currentQuestion + 1} / {questions.length}</div>
          <h1>{questions[currentQuestion].question}</h1>
          <div className="options-grid">
            {questions[currentQuestion].options.map((option, index) => (
              <button key={index} onClick={() => handleAnswerClick(index)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App