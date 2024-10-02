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

  const safeEval = (expr) => Function('"use strict";return (' + expr + ')')();
  const evaluateExpression = (expression) => {
    try {
      const sanitizedInput = expression.replace(/[^-()\d*\/+.%]/g, "");
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
    if (value === "clear") return setInput("0"), setResult(""), setLastInput(null), setLastOperator(null), setEvaluated(false), setFirstResults([]), setSecondResults([]), setIsEdited(false);
    if (value === "	⌫") return setInput((prevInput) => (prevInput.length === 1 ? "0" : prevInput.slice(0, -1)));
    if (value === "+/-") {
      setInput((prevInput) => {
        if (prevInput === "0") return prevInput; const operators = ["+", "-", "*", "/"]; let lastOperatorIndex = -1;

        operators.forEach((op) => {
          const index = prevInput.lastIndexOf(op);
          if (index > lastOperatorIndex) {
            lastOperatorIndex = index;
          }
        });

        if (lastOperatorIndex === -1) {
          const newInput = prevInput.startsWith("-") ? prevInput.slice(1) : `-${prevInput}`;
          setResult(evaluateExpression(newInput));
          return newInput;
        }

        const firstPart = prevInput.slice(0, lastOperatorIndex + 1);
        const secondPart = prevInput.slice(lastOperatorIndex + 1);

        let newInput;
        if (secondPart.startsWith("-")) {
          newInput = `${firstPart}${secondPart.slice(1)}`;
        } else {
          newInput = `${firstPart}(-${secondPart})`;
        }
        setResult(evaluateExpression(newInput));
        return newInput;
      });

      return;
    }


    if (value === "%") {
      const operators = ["+", "-", "*", "/"];
      const lastChar = input.slice(-1);

      // no oprtr, int % /100
      if (!operators.some((op) => input.includes(op))) {
        const percentageValue = parseFloat(input) / 100;
        setInput(percentageValue.toString());
        setResult(percentageValue.toString());
        setEvaluated(true);
        return;
      }
      if (lastOperator && lastInput !== null) {
        const previousValue = parseFloat(input);
        const currentValue = parseFloat(lastInput);
        let newValue;
        const [firstValue, secondValue] = input.split(lastOperator);
        console.log("first", firstValue, "oper", lastOperator, "sec", secondValue);
        if (lastOperator === "+") {
          newValue = previousValue + (previousValue * (secondValue / 100));
          console.log(newValue, previousValue, "+", previousValue, "*", currentValue, "/ 100");
        } else if (lastOperator === "-") {
          newValue = previousValue - (previousValue * (secondValue / 100));
        } else if (lastOperator === "*") {
          newValue = previousValue * (secondValue / 100);
        } else if (lastOperator === "/") {
          newValue = previousValue / (secondValue / 100);
        }

        setInput(newValue.toString());
        setResult(newValue.toString());
        setLastInput(newValue.toString());
        setEvaluated(true);
        const expression = `${previousValue} ${lastOperator} ${secondValue}%`;
        updateHistory(expression, newValue.toString());
        console.log("New Value:", newValue);
        return;
      }
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
      if (lastOperator && lastInput !== null && !isEdited || '') {
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
    if (value === "0" && (input === "0" || ["+", "-", "*", "/", "%"].includes(input.slice(-1))))
      return;

    if (value === ".") {
      const segments = input.split(/[\+\-\*\/\%]/);
      const currentSegment = segments[segments.length - 1];

      if (currentSegment.includes(".")) {
        return;
      }
      const lastChar = input.slice(-1);
      if (["+", "-", "*", "/", "%"].includes(lastChar)) {
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

    if (input === "0" && value !== ".") {
      setInput(value);
      setIsEdited(true);
      return;
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

  const handleHistoryClear = () => {
    setHistory([]);
  };

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
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
      handleClick(key);
    }
  }, [input]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="app">
      <div className="calculator-history-container">
        <div className="calculator">
          <div className="input_display">{input}</div>
          <div className="result_display">{result}</div>
          <Keypad handleClick={handleClick} />
        </div>

        <div className="history">
          <strong>History :
            <button onClick={() => handleHistoryClear()}>clear</button>
          </strong>
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
      </div>
    </div>
  );
}
export default App;