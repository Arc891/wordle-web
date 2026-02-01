import { clearGrid } from '../utils.js';
import { removeGameContent } from './setup.js';
import { theme } from '../styles/theme.js';
import { createStyledElement, stylePatterns, addButtonHoverEffect } from '../styles/utils.js';

export function addRestartButton(keyboardContainer, restartCallback) {
    const restartButton = createStyledElement('button', {
        ...stylePatterns.primaryButton,
        display: 'block',
        textAlign: 'center',
        margin: `${theme.spacing.lg} auto 0 auto`
    }, {
        textContent: 'Restart Game'
    });
    
    addButtonHoverEffect(restartButton, {
        hoverTransform: 'translateY(-2px)',
        normalTransform: 'translateY(0)',
        hoverShadow: theme.shadows.primaryButtonHover,
        normalShadow: theme.shadows.primaryButton,
        skipColoredButtons: false
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
        // Close any open hint dropdowns
        document.getElementById('dropdown-words')?.remove();
        document.getElementById('dropdown-letters')?.remove();
        
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
    // Close any open hint dropdowns
    document.getElementById('dropdown-words')?.remove();
    document.getElementById('dropdown-letters')?.remove();
    
    if (!gameDone) alert(`Game Over! The word was: ${word}`);
    document.removeEventListener('keydown', playGameHandler);
    clearGrid(gridContainer, keyboardContainer);
    localStorage.removeItem('wordleGameState');
    playerInputCallback(false, 0);
}

export function resetGame(gridContainer, keyboardContainer, showWordSetSelectionCallback) {
    // Close any open hint dropdowns
    document.getElementById('dropdown-words')?.remove();
    document.getElementById('dropdown-letters')?.remove();
    
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
