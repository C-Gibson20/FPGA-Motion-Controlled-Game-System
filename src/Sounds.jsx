const playBackgroundSound = () => {
    const soundEffect = new Audio("./sounds/mp.wav");
    soundEffect.volume = 0.5;

    soundEffect.onended = () =>{
        soundEffect.currentTime = 0;
        soundEffect.play();
    };

    soundEffect.play();
};

const playCoinSound = () => {
    const soundEffect = new Audio("./sounds/smb_coin.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

const playGameOverSound = () => {
    const soundEffect = new Audio("./sounds/smb_gameover.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

const playJumpSound = () => {
    const soundEffect = new Audio("./sounds/smb_jump-small.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

const playWarningSound = () => {
    const soundEffect = new Audio("./sounds/smb_warning.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

