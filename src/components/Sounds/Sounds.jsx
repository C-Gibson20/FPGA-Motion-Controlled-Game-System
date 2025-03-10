let backgroundSound = null;

export const playBackgroundSound = () => {
    if(!backgroundSound){
        backgroundSound = new Audio("./sounds/mp.wav")
        backgroundSound.volume = 0.5;
        backgroundSound.loop = true;
        backgroundSound.play();
    };
};

export const stopBackgroundSound = () => {
    if(backgroundSound){
        backgroundSound.pause();
        backgroundSound = null;
    };
};

export const playCoinSound = () => {
    const soundEffect = new Audio("./sounds/smb_coin.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

export const playGameOverSound = () => {
    const soundEffect = new Audio("./sounds/smb_gameover.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

export const playJumpSound = () => {
    const soundEffect = new Audio("./sounds/smb_jump-small.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

export const playWarningSound = () => {
    const soundEffect = new Audio("./sounds/smb_warning.wav");
    soundEffect.currentTime = 0;
    soundEffect.play();
};

