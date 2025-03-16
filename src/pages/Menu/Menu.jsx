import React, { useState } from "react";
import './Menu.css';
import ConnectionPopup from "../ConnexionPopup/ConnectionPopup.jsx";

const Menu = ({ onStart, onInitiateConnection, isConnected, players }) => {
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerNames, setPlayerNames] = useState(['']);
  const [showPopup, setShowPopup] = useState(false);

  const handlePlayerChange = (index, name) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  const handleStartConnection = () => {
    onInitiateConnection(numPlayers, playerNames);
    setShowPopup(true);
  };

  const handleGameSelectionStart = () => {
    setShowPopup(false);
    onStart();
  };

  return (
    <div className="menu-container">
      <h1 className="title">
        <span className="word">
          <span>T</span><span>O</span><span>T</span><span>A</span><span>L</span><span>L</span><span>Y</span>
        </span>
        <span className="word">
          <span>N</span><span>O</span><span>T</span>
        </span>
        <span className="word">
          <span>M</span><span>A</span><span>R</span><span>I</span><span>O</span>
        </span>
        <span className="word">
          <span>P</span><span>A</span><span>R</span><span>T</span><span>Y</span>
        </span>
      </h1>

      <div className="selection-container">
        <label>Number of Players:</label>
        <select
          value={numPlayers}
          onChange={(e) => {
            const num = parseInt(e.target.value);
            setNumPlayers(num);
            setPlayerNames(Array(num).fill('')); 
          }}
          className="dropdown"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </div>

      {playerNames.map((name, index) => (
        <input
          key={index}
          type="text"
          placeholder={`Player ${index + 1} Name`}
          value={name}
          onChange={(e) => handlePlayerChange(index, e.target.value)}
          className="input-field"
        />
      ))}

      {!isConnected && !showPopup && (
        <button onClick={handleStartConnection} className="start-button">
          Connect to Players
        </button>
      )}

      {showPopup && (
        <ConnectionPopup
          isConnected={isConnected}
          playerConnections={players} 
          expectedPlayers={numPlayers}
          onClose={() => setShowPopup(false)}
        >
          <button onClick={handleGameSelectionStart} className="start-game-selection-button">
            Start Game Selection
          </button>
        </ConnectionPopup>
      )}
    </div>
  );
};

export default Menu;
