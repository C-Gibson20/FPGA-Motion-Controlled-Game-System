import { useState, useEffect } from "react";
import "./ConnectionPopup.css";

function ConnectionPopup({ onPlayersConnected, onClose }) {
  const [player1Connected, setPlayer1Connected] = useState(false);
  const [player2Connected, setPlayer2Connected] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setPlayer1Connected(true), 1000);
    const timer2 = setTimeout(() => setPlayer2Connected(true), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (player1Connected && player2Connected) {
      onPlayersConnected();
    }
  }, [player1Connected, player2Connected, onPlayersConnected]);

  return (
    <div className="connection-popup">
      <div className="connection-popup-content">
        <h2>Player Connection Status</h2>
        <p>{player1Connected ? "Player 1 Connected" : "Waiting for Player 1..."}</p>
        <p>{player2Connected ? "Player 2 Connected" : "Waiting for Player 2..."}</p>
        {player1Connected && player2Connected && (
          <button onClick={onClose}>Exit</button>
        )}
      </div>
    </div>
  );
}

export default ConnectionPopup;
