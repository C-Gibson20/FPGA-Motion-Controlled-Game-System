import React from "react";
import "./ConnectionPopup.css";

const ConnectionPopup = ({ isConnected, playerConnections, expectedPlayers, onClose, onStartGame }) => {
  const allPlayersConnected = Object.keys(playerConnections).length === expectedPlayers;

  return (
    <div className="connection-popup">
      <div className="connection-popup-content">
        {/* Close button in the top-right */}
        <button
          onClick={onClose}
          className="close-button"
          style={{ position: 'absolute', top: '10px', right: '10px' }}
        >
          ✖
        </button>
        <h2>Server Connection Status</h2>
        {isConnected ? (
          <div>
            <p>Connected to Server!</p>
            <p>
              FPGA connections: {Object.keys(playerConnections).length} / {expectedPlayers}
            </p>
            <ul>
              {Object.entries(playerConnections).map(([player, address]) => (
                <li key={player}>
                  Player {player}: {address}
                </li>
              ))}
            </ul>
            {allPlayersConnected ? (
              <button onClick={onStartGame} className="start-game-button">
                Start Game
              </button>
            ) : (
              <button className="start-game-button" disabled>
                Waiting for all players...
              </button>
            )}
          </div>
        ) : (
          <p>Waiting for Connection...</p>
        )}
      </div>
    </div>
  );
};

export default ConnectionPopup;
