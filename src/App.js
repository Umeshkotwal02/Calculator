import React, { useState, useEffect, useCallback } from "react";
import Keypad from "./Keypad";
import "./App.css";

function App() {
  const [input, setInput] = useState("0");
  const [result, setResult] = useState("");
  const [lastInput, setLastInput] = useState(null);
  const [lastOperator, setLastOperator] = useState(null);
  const [evaluated, setEvaluated] = useState(false);
  const [firstResults, setFirstResults] = useState([]);
  const [secondResults, setSecondResults] = useState([]);
  const [isEdited, setIsEdited] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Function to safely evaluate expressions
  const safeEval = (expr) => {
    return Function('"use strict";return (' + expr + ')')();
  };

  const evaluateExpression = (expression) => {
    try {
      const sanitizedInput = expression.replace(/[^-()\d/*+.]/g, "");
      const evaluatedResult = safeEval(sanitizedInput);

      if (evaluatedResult === Infinity || evaluatedResult === -Infinity || isNaN(evaluatedResult)) {
        setResult("Error 1");
      } else {
        setResult(evaluatedResult.toString());
        return evaluatedResult;
      }
    } catch {
      setResult("Error 2");
    }
    return null;
  };

  const handleClick = (value) => {
    if (value === "clear") {
      setInput("0");
      setResult("");
      setLastInput(null);
      setLastOperator(null);
      setEvaluated(false);
      setFirstResults([]);
      setSecondResults([]);
      setIsEdited(false);
      return;
    }
    if (value === "history") {
      setShowHistory(!showHistory);
      return;
    }

    if (["+", "-", "*", "/"].includes(value)) {
      if (evaluated && !isEdited) {
        setInput(result + value);
        setLastOperator(value);
        setFirstResults([...firstResults, result]);
        setEvaluated(false);
      } else {
        const lastChar = input.slice(-1);

        if (["+", "-", "*", "/"].includes(lastChar)) {
          setInput(input.slice(0, -1) + value);
        } else {
          const evalResult = evaluateExpression(input);
          if (evalResult !== null) {
            setInput(evalResult + value);
            setFirstResults([...firstResults, evalResult]);
            setLastOperator(value);
            setLastInput(evalResult);
          }
        }
      }
      setIsEdited(false);
      return;
    }

    if (value === "=") {
      if (lastOperator && lastInput !== null && !isEdited) {
        const evalExpression = `${input}${lastInput}`;
        const evalResult = evaluateExpression(evalExpression);

        if (evalResult !== null) {
          setInput(evalResult.toString());
          setEvaluated(true);

          if (firstResults.length === 0) {
            setFirstResults([evalResult]);
          } else {
            const newResult = safeEval(`${firstResults[firstResults.length - 1]} ${lastOperator} ${lastInput}`);
            setSecondResults([...secondResults, newResult]);
            setInput(newResult.toString());
            setResult(newResult.toString());
          }

          // Update history
          updateHistory(evalExpression, evalResult.toString());
        } else {
          setResult(input);
        }
      } else {
        if (!evaluated) {
          const evalResult = evaluateExpression(input);
          if (evalResult !== null) {
            setInput(evalResult.toString());
            setResult(evalResult.toString());
            setEvaluated(true);

            if (firstResults.length === 0) {
              setFirstResults([evalResult]);
            } else if (!isEdited) {
              const newResult = safeEval(`${firstResults[firstResults.length - 1]} ${lastOperator} ${lastInput}`);
              setSecondResults([...secondResults, newResult]);
              setInput(newResult.toString());
              setResult(newResult.toString());
            }

            // Update history
            updateHistory(input, evalResult.toString());
          } else {
            setResult("Error 4");
          }
        }
      }

      setIsEdited(false);
      return;
    }

    if (value === "0" && (input === "0" || input.endsWith("+") || input.endsWith("-") || input.endsWith("*") || input.endsWith("/"))) {
      return;
    }
    if (value === ".") {
      const segments = input.split(/[\+\-\*\/]/);
      const currentSegment = segments[segments.length - 1];

      if (currentSegment.includes(".")) {
        return;
      }

      const lastChar = input.slice(-1);
      if (["+", "-", "*", "/"].includes(lastChar)) {
        setInput(input + "0.");
      } else {
        setInput(input + value);
      }

      setIsEdited(true);
      return;
    }

    if (evaluated && !isEdited) {
      setInput(input + value);
      setResult("");
      setEvaluated(false);
      setFirstResults([]);
      setSecondResults([]);
      setIsEdited(true);
    } else {
      setInput(input === "0" && value !== "." ? value : input + value);
      setIsEdited(true);
    }

    if (input.length > 1) {
      const evalResult = evaluateExpression(input + value);
      if (evalResult !== null) {
        setResult(evalResult.toString());
      }
    }
  };

  const updateHistory = (expression, result) => {
    const newEntry = { expression, result };
    const newHistory = [newEntry, ...history].slice(0, 5);
    setHistory(newHistory);
  };

  const handleHistoryClick = (index) => {
    if (index >= 0 && index < history.length) {
      const { expression, result } = history[index];
      setInput(expression);
      setResult(result);
    }
  };

  // Wrap handleKeyPress with useCallback to prevent unnecessary re-renders
  const handleKeyPress = useCallback((event) => {
    const { key } = event;
    if ((key >= "0" && key <= "9") || key === ".") {
      handleClick(key);
    } else if (key === "Enter") {
      handleClick("=");
    } else if (key === "Backspace") {
      setInput(input.length === 1 ? "0" : input.slice(0, -1));
    } else if (key === "Escape") {
      handleClick("clear");
    } else if (["+", "-", "*", "/"].includes(key)) {
      handleClick(key);
    }
  }, [input]); // Added input as a dependency to capture its current state

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]); // Removed input from dependencies to prevent issues with stale closures

  return (
    <div className="app">
      <div className="calculator-history-container">
        <div className="calculator">
          <div className="input_display">{input}</div>
          <div className="result_display">{result}</div>
          <Keypad handleClick={handleClick} />
        </div>
        {showHistory && (
          <div className="history">
            <strong>History:</strong>
            {history.length === 0 ? (
              <p>No history available.</p>
            ) : (
              history.map((entry, index) => (
                <p key={index}>
                  {`${entry.expression} = ${entry.result}`}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default App;