import React from "react";
import { Container, Row } from "react-bootstrap";
import "./App.css";

const buttonValues = [
  ["7", "8", "9", "<"],
  ["4", "5", "6", "/"],
  ["1", "2", "3", "*"],
  ["+/-", "0", ".", "-"],
  ["clear","=","%","+"],
];

const Keypad = ({ handleClick }) => {
  return (
    <div className="keypad_container">
      <Container>
        {buttonValues.map((row, rowIndex) => (
          <Row key={rowIndex}>
            {row.map((btnValue) => (
              <button
                key={btnValue}
                className={`btn ${["+", "-", "*", "/", "="].includes(btnValue) ? "btn-color" : ""}`}
                onClick={() => handleClick(btnValue)}
              >
                {btnValue}
              </button>
            ))}
          </Row>
        ))}
      </Container>
    </div>
  );
};

export default Keypad;
