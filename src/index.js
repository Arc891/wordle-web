import { createGridContainer, applyBodyStyles, createKeyboardContainer } from './components/setup.js';
import { decodeWord, mapWordSourceToWords } from './utils.js';
import { loadGameState, restoreGameState } from './state/game-state.js';
import { startGame, showWordSetSelection } from './game/game-controller.js';
import { startSolverMode, showSolverModeInfo } from './solver/solver-mode.js';
import { unlockSolverMode } from './components/ui-handlers.js';

// Global constants
const WORD_LENGTH = 5;
const ROWS = 6;

// Global UI elements
const gridContainer = createGridContainer(WORD_LENGTH, ROWS);
const keyboardContainer = createKeyboardContainer(WORD_LENGTH);

// Global game state
let gameState = {
    currentRow: 0,
    currentCol: 0,
    word: '',
    wordsToGuess: [],
    wordsToUse: [],
    wordSource: '',
    playGameHandler: null,
    playGameHandlerActive: false,
    gameDone: false,
    titleClicks: 0,
    solverModeEnabled: false
};

// State update function
function updateGameState(newState) {
    gameState = { ...gameState, ...newState };
    updateGameState.gameState = gameState;
    updateGameState.wordSource = gameState.wordSource;
}

// Initialize the update function with current state
updateGameState.gameState = gameState;

// Title click handler for solver mode
function handleTitleClick() {
    const result = unlockSolverMode(
        gameState.titleClicks, 
        gameState.solverModeEnabled, 
        () => showSolverModeInfo(() => 
            startSolverMode(gridContainer, keyboardContainer, gameState.wordSource, WORD_LENGTH, ROWS)
        )
    );
    updateGameState(result);
}

// Initialize the application
function initializeApp() {
    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Wordle Game';
    title.style.textAlign = 'center';
    title.style.marginTop = '0px';
    title.addEventListener('click', handleTitleClick);
    document.body.appendChild(title);
    
    // Apply body styles
    applyBodyStyles();
    
    // Check for saved game state
    if (localStorage.getItem('wordleGameState')) {
        const savedState = loadGameState(WORD_LENGTH);
        if (savedState) {
            updateGameState(savedState);
            startGame(
                gridContainer, 
                keyboardContainer, 
                savedState.wordSource, 
                savedState.wordsToGuess, 
                savedState.wordsToUse, 
                false, 
                true,
                WORD_LENGTH,
                ROWS,
                gameState,
                updateGameState
            );
            restoreGameState(savedState, gridContainer, WORD_LENGTH);
            return;
        }
    }
    
    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('gid') && params.has('ws')) {
        if (decodeWord(params.get('gid')).length !== WORD_LENGTH) {
            console.warn(`Invalid word length in URL: ${decodeWord(params.get('gid'))}. Expected ${WORD_LENGTH} characters.`);
            showWordSetSelection(gridContainer, keyboardContainer, WORD_LENGTH, ROWS, updateGameState);
            return;
        }
        
        // Use the word from the URL
        console.debug(`Using word from URL: ${params.get('gid')}`);
        const word = decodeWord(params.get('gid')).toUpperCase();
        const wordSource = params.get('ws') || 'common';
        const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);

        if (!wordsToUse.includes(word)) {
            console.warn(`The word from URL (${word}) is not in the selected word source (${wordSource}). Showing word set selection.`);
            showWordSetSelection(gridContainer, keyboardContainer, WORD_LENGTH, ROWS, updateGameState);
            return;
        }

        updateGameState({ word, wordSource, wordsToGuess, wordsToUse });
        console.debug(`Using word source from URL: ${wordSource}`);
        startGame(
            gridContainer, 
            keyboardContainer, 
            wordSource, 
            wordsToGuess, 
            wordsToUse, 
            true, 
            true,
            WORD_LENGTH,
            ROWS,
            gameState,
            updateGameState
        );
        return;
    }

    // Show word set selection
    console.debug('No saved game state found or tampered with. Showing word set selection.');
    showWordSetSelection(gridContainer, keyboardContainer, WORD_LENGTH, ROWS, updateGameState);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
