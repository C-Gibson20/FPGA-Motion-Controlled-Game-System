import React from 'react';
import './GameSel.css'; // Import the CSS
import bulletBarrageImg from '../../assets/spikeBallGame.png';
import coinCascadeImg from '../../assets/coinGame.png';
import discoDashImg from '../../assets/arrowGame.jpg';

const GameSel = ({ setGameSel }) => {
  const game = [
    { name: 'Bullet Barrage', image: bulletBarrageImg },
    { name: 'Coin Cascade', image: coinCascadeImg },
    { name: 'Disco Dash', image: discoDashImg },
  ];

  return (
    <div className="game-selection-container">
      {game.map((game, idx) => (
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
    </div>
  );
};

export default GameSel;