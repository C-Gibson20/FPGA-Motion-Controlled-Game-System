import React from "react";
import "./Scoreboard.css";

const Scoreboard = ({ players = [] }) => {
  return (
    <div className="scoreboard">
      <ul>
        {players.map((p, index) => (
          <li key={`${p.username}-${index}`} className="leaderboard-entry">
            <div className="player-container">
              <img
                src={p.avatar}
                alt={p.username}
                className="player-avatar"
              />
              <div className="score-box">
                <span className="player-name">{p.username}</span>
                <span className="player-score">{p.score}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;
