import { clearGrid } from '../utils.js';
import { removeGameContent } from './setup.js';

export function addRestartButton(keyboardContainer, restartCallback) {
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    const resetButtonStyle = {
        padding: '12px 24px',
        fontSize: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '600',
        color: '#fff',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
        margin: '20px auto 0 auto',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }
    Object.assign(restartButton.style, resetButtonStyle);
    
    restartButton.addEventListener('mouseenter', () => {
        restartButton.style.transform = 'translateY(-2px)';
        restartButton.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });
    
    restartButton.addEventListener('mouseleave', () => {
        restartButton.style.transform = 'translateY(0)';
        restartButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    // Insert the button just before the keyboard to keep it centered with the keyboard
    keyboardContainer.parentNode.insertBefore(restartButton, keyboardContainer);
    
    function restartOnInputs(event) {
        const inputsForReset = ['r', 'R', 'Enter', ' '];
        console.log(event.key)
        if (inputsForReset.includes(event.key)) {
            restartFromBtn();
        }
    }

    function restartFromBtn() {
        console.log('Game restarted');
        document.removeEventListener('keydown', restartOnInputs); // Remove the restart event listener
        if (restartButton.parentNode) {
            restartButton.parentNode.removeChild(restartButton);
        }
        restartCallback();
    }

    restartButton.addEventListener('click', restartFromBtn);
    document.addEventListener('keydown', restartOnInputs);

    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(restartButton);
    } else {
        document.body.appendChild(restartButton);
    }
}

export function giveUp(word, gameDone, playGameHandler, gridContainer, keyboardContainer, playerInputCallback) {
    if (!gameDone) alert(`Game Over! The word was: ${word}`);
    document.removeEventListener('keydown', playGameHandler);
    clearGrid(gridContainer, keyboardContainer);
    localStorage.removeItem('wordleGameState');
    playerInputCallback(false, 0);
}

export function resetGame(gridContainer, keyboardContainer, showWordSetSelectionCallback) {
    localStorage.removeItem('wordleGameState');
    window.history.replaceState({}, '', `${window.location.pathname}`);
    removeGameContent(gridContainer, keyboardContainer);
    showWordSetSelectionCallback();
}

export function handleGiveUpOrReset(type, playGameHandlerActive, resetCallback, giveUpCallback) {
    if (!playGameHandlerActive) {
        console.warn(`Please wait until word has been checked before trying to ${type}`);
        return;
    }
    if (type === 'reset') {
        resetCallback();
    } else {
        giveUpCallback();
    }
}

export function unlockSolverMode(titleClicks, solverModeEnabled, showSolverModeInfoCallback) {
    const enabledSolverMode = () => { return titleClicks >= 5; };
    
    if (!enabledSolverMode()) {
        titleClicks++;
        console.log(`Title clicks: ${titleClicks}/5`);
        return { titleClicks, solverModeEnabled };
    } else if (!solverModeEnabled) {
        console.log("Solver mode unlocked!");
        solverModeEnabled = true;
        showSolverModeInfoCallback();
        return { titleClicks, solverModeEnabled };
    }
    return { titleClicks, solverModeEnabled };
}
