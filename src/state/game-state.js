import { simpleHash, encodeWord, decodeWord, mapWordSourceToWords } from '../utils.js';
import { addLetterToSquare, checkGuess } from '../game/game-logic.js';

export function saveGameState(word, currentRow, currentCol, gridContainer, wordSource, gameDone, WORD_LENGTH) {
    const state = {
        word: encodeWord(word),
        currentRow,
        currentCol,
        guesses: Array.from({ length: currentRow }, (_, row) =>
            Array.from({ length: WORD_LENGTH }, (_, col) =>
                gridContainer.children[row * WORD_LENGTH + col].textContent
            ).join('')
        ),
        wordSource,
        gameDone,
    };
    // Add a simple hash for integrity
    const stateStr = JSON.stringify(state);
    const hash = simpleHash(stateStr);
    localStorage.setItem('wordleGameState', JSON.stringify({ state, hash }));
}

export function loadGameState(WORD_LENGTH) {
    const saved = JSON.parse(localStorage.getItem('wordleGameState'));
    if (!saved || !saved.state || !saved.hash) return null;
    
    const stateStr = JSON.stringify(saved.state);
    if (simpleHash(stateStr) !== saved.hash) {
        // Tampering detected
        localStorage.removeItem('wordleGameState');
        return null;
    }
    
    const state = saved.state;
    const word = decodeWord(state.word).toUpperCase();
    const currentRow = state.currentRow;
    const currentCol = state.currentCol;
    const wordSource = state.wordSource;
    const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);

    const params = new URLSearchParams(window.location.search);
    params.set('gid', encodeWord(word));
    params.set('ws', wordSource);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

    return {
        word,
        currentRow,
        currentCol,
        wordSource,
        wordsToGuess,
        wordsToUse,
        guesses: state.guesses
    };
}

export function restoreGameState(gameState, gridContainer, WORD_LENGTH) {
    // Restore guesses to the grid (set letters first)
    gameState.guesses.forEach((guess, row) => {
        for (let col = 0; col < guess.length; col++) {
            addLetterToSquare(guess[col], row, col, gridContainer, WORD_LENGTH);
        }
    });

    // Now animate and color only for completed guesses
    gameState.guesses.forEach((guess, row) => {
        if (guess.length === WORD_LENGTH) {
            checkGuess(guess.split(''), gameState.word, row, gridContainer, null, WORD_LENGTH);
        }
    });
}
