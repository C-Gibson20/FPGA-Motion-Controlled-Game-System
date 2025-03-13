import React from 'react';
import './GameSel.css';
import bulletBarrageImg from '../../assets/spikeBallGame.png';
import coinCascadeImg from '../../assets/coinGame.png';
import discoDashImg from '../../assets/arrowGame.jpg';
import Scoreboard from '../RythmGame/Scoreboard';

const GameSel = ({ setGameSel, onExit, scores, players }) => {
  const games = [
    { name: 'Bullet Barrage', image: bulletBarrageImg },
    { name: 'Coin Cascade', image: coinCascadeImg },
    { name: 'Disco Dash', image: discoDashImg },
  ];

  // Build scoreboard data based on players and scores
  const scoreboardData = players.map((name, index) => ({
    username: name,
    score: scores[index] || 0,
    avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
  }));

  return (
    <div className="game-selection-container">
      <Scoreboard players={scoreboardData} />
      {games.map((game, idx) => (
        <div
          key={idx}
          className="game-selection-block"
          style={{ backgroundImage: `url(${game.image})` }}
          onClick={() => setGameSel(game.name)}
        >
          <div className="overlay">
            <h1 className="game-selection-title">{game.name}</h1>
          </div>
        </div>
      ))}
      <button onClick={onExit} className="exit-button">✖</button>
    </div>
  );
};

export default GameSel;
