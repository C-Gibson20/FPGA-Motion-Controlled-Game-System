import React, { useState } from 'react';
import './Menu.css';

const Menu = ({ onStart }) => {
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerNames, setPlayerNames] = useState(['']);

  const handlePlayerChange = (index, name) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  return (
    <div className="menu-container">
      {/* <h1 className="title">Totally Not Mario Party </h1> */}
      <h1 class="title">
        <span class="word">
            <span>T</span><span>O</span><span>T</span><span>A</span><span>L</span><span>L</span><span>Y</span>
        </span>
        <span class="word">
            <span>N</span><span>O</span><span>T</span>
        </span>
        <span class="word">
            <span>M</span><span>A</span><span>R</span><span>I</span><span>O</span>
        </span>
        <span class="word">
            <span>P</span><span>A</span><span>R</span><span>T</span><span>Y</span>
        </span>
    </h1>


      <div className="selection-container">
        <label>Number of Players:</label>
        <select
          value={numPlayers}
          onChange={(e) => {
            setNumPlayers(parseInt(e.target.value));
            setPlayerNames(Array(parseInt(e.target.value)).fill(''));
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
      <button onClick={() => onStart(playerNames)} className="start-button">Start Game</button>
    </div>
  );
};

export default Menu;
