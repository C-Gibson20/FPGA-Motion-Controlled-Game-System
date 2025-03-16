import React from "react";
import "./ConnectionPopup.css";

const ConnectionPopup = ({ isConnected, playerConnections = [], expectedPlayers, onClose, children }) => {
  const allPlayersConnected = playerConnections.length === expectedPlayers;

  return (
    <div className="connection-popup">
      <div className="connection-popup-content">
        <button
          onClick={onClose}
          className="close-button"
          style={{ position: 'absolute', top: '10px', right: '10px' }}
        >
        </button>
        <h2>Server Connection Status</h2>
        {isConnected ? (
          <div>
            <p>Connected to Server</p>
            <p>
              FPGA connections: {playerConnections.length} / {expectedPlayers}
            </p>
            <ul>
              {playerConnections.map((player) => (
                <li key={player.id}>
                  Player {player.id}: {player.name} {player.address && `(${player.address})`}
                </li>
              ))}
            </ul>
            {allPlayersConnected ? (
              <p>All players connected.</p>
            ) : (
              <p>Waiting for all players to connect...</p>
            )}
          </div>
        ) : (
          <p>Waiting for Connection...</p>
        )}
        
        {children}
      </div>
    </div>
  );
};

export default ConnectionPopup;
