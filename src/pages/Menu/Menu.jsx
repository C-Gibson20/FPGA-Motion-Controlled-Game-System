import React, { useState } from 'react';
import './Menu.css';
import ConnectionPopup from '../ConnexionPopup/ConnectionPopup.jsx';

const Menu = ({ onStart }) => {
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerNames, setPlayerNames] = useState(['']);
  const [showPopup, setShowPopup] = useState(false);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerConnections, setPlayerConnections] = useState({}); // Mapping: player id -> FPGA address

  const handlePlayerChange = (index, name) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  // This function starts the WebSocket connection and sends the game configuration.
  const handleStartConnection = () => {
    setShowPopup(true);
    const socket = new WebSocket('ws://13.61.26.147:8765/'); // Replace with your server address

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
      setIsConnected(true);
      const initMessage = JSON.stringify({
        type: "init",
        numPlayers: numPlayers,
        names: playerNames
      });
      socket.send(initMessage);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received from server:", data);
      if (data.type === "player_connected") {
        setPlayerConnections(prev => ({ ...prev, [data.player]: data.address }));
      } else if (data.type === "all_connected") {
        console.log("All FPGA connections established:", data.players);
      } else if (data.type === "data") {
        console.log(`Data from player ${data.player}:`, data.data);
        // Handle incoming FPGA data as needed.
      }
    };
  };

  // This function is called when the user clicks "Start Game" in the popup.
  // This function is called when the user clicks "Start Game" in the popup.
  const handleGameStart = () => {
    console.log("Starting game with players:", playerNames);
    // Call the parent's onStart callback with both player names and ws.
    onStart(playerNames, ws);
    setShowPopup(false);
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
      {numPlayers > 1 ?
      <button onClick={handleStartConnection} className="start-button">
        Connect to Players
      </button>
      : <button onClick={handleGameStart} className="start-button">
        Play Solo
      </button>}
      {showPopup && (
        <ConnectionPopup
          isConnected={isConnected}
          playerConnections={playerConnections}
          expectedPlayers={numPlayers}
          onClose={() => setShowPopup(false)}
          onStartGame={handleGameStart}
        />
      )}
    </div>
  );
};

export default Menu;
