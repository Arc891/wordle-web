import {
    createGridContainer, applyBodyStyles, createKeyboardContainer, createSelectionButton, createDropdown,
    addHintButtons, addWordSourceBelowTitle, addGameButtons, removeGameContent
} from './setup.js';
import { hexToRgb, clearGrid, simpleHash, encodeWord, decodeWord, mapWordSourceToWords, rgbToHex } from './utils.js';
import { countMostCommonLetters, solveWordle } from './solve-wordle.js';
import { LetterStatus } from './utils.js';

const WORD_LENGTH = 5;
const ROWS = 6;

const gridContainer = createGridContainer(WORD_LENGTH, ROWS);
const keyboardContainer = createKeyboardContainer(WORD_LENGTH);

let currentRow = 0;
let currentCol = 0;
let word = '';
let wordsToGuess = [];
let wordsToUse = [];
let wordSource = '';
let playGameHandler = null;
let playGameHandlerActive = false;
let gameDone = false;
let titleClicks = 0;
let solverModeEnabled = false;

const enabledSolverMode = () => { return titleClicks >= 5; }


function addLetterToSquare(letter, row, col) {
    const index = row * WORD_LENGTH + col;
    const square = gridContainer.children[index];
    if (square) {
        square.textContent = letter.toUpperCase();
    }
}


function getLetterStatuses(guess, word) {
    const result = Array(guess.length).fill(LetterStatus.ABSENT);
    const wordArr = word.split('');
    const guessArr = guess.slice();

    // First pass: mark correct letters
    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] === wordArr[i]) {
            result[i] = LetterStatus.CORRECT;
            wordArr[i] = null; // Mark as used
            guessArr[i] = null; // Mark as handled
        }
    }

    // Second pass: mark present letters
    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] && wordArr.includes(guessArr[i])) {
            result[i] = LetterStatus.PRESENT;
            // Remove the first occurrence from wordArr to avoid double-counting
            wordArr[wordArr.indexOf(guessArr[i])] = null;
        }
    }

    return result;
}

async function checkGuess(guess, word, currentRow) {
    const statuses = getLetterStatuses(guess, word);

    for (let i = 0; i < WORD_LENGTH; i++) {
        const status = statuses[i];
        const square = gridContainer.children[i + currentRow * WORD_LENGTH];
        console.debug(`Letter: ${guess[i]}, Status: ${status}, square: ${square.textContent}`);

        setTimeout(() => {
            const newStyle = {
                transition: 'background-color 0.3s, border 0.3s, transform 0.1s',
                backgroundColor: status,
                border: `1px solid ${status}`,
                color: '#fff', // Change text color to white for better contrast
                transform: 'rotateX(90deg)' // Add a pop and spin effect
            };
            Object.assign(square.style, newStyle);
            // Reset transform after animation for next guesses
            setTimeout(() => {
                square.style.transform = 'none';
            }, 100);
        }, i * 350);
    }


    // Wait for the last letter to finish its transition before continuing
    const timeout = new Promise(resolve => {
        setTimeout(resolve, WORD_LENGTH * 350); // Wait for the last transition to finish
    });

    await timeout;

    // Set keyboard keys based on the guess
    const keyboardKeys = Array.from(keyboardContainer.querySelectorAll('button'));
    guess.forEach((letter, index) => {
        const keyButton = keyboardKeys.find(button => button.textContent.toUpperCase() === letter.toUpperCase());
        if (keyButton) {
            if (keyButton.style.backgroundColor === hexToRgb(LetterStatus.CORRECT) ||
                keyButton.style.backgroundColor === hexToRgb(LetterStatus.PRESENT) && statuses[index] === LetterStatus.ABSENT ||
                keyButton.style.backgroundColor === hexToRgb(statuses[index])) {
                return;
            }

            keyButton.style.backgroundColor = statuses[index];
            keyButton.style.color = '#fff'; // Change text color to white for better contrast
            keyButton.style.transition = 'background-color 0.3s, color 0.3s'; // Add transition for keyboard keys
        }
    });
}


function addOptionToRestartButton() {
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    const resetButtonStyle = {
        padding: '10px 20px',
        fontSize: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
        margin: '20px auto 0 auto', // Center horizontally
    }
    Object.assign(restartButton.style, resetButtonStyle);

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
        clearGrid(gridContainer, keyboardContainer);
        console.log('Game restarted');
        document.removeEventListener('keydown', restartOnInputs); // Remove the restart event listener
        document.body.removeChild(restartButton);
        localStorage.removeItem('wordleGameState');
        playerInput(false, 0);
    }

    restartButton.addEventListener('click', restartFromBtn);
    document.addEventListener('keydown', restartOnInputs);

    document.body.appendChild(restartButton);
}


function showWordIsInvalid(currentRow) {
    const squares = Array.from(gridContainer.children);
    const startIndex = currentRow * WORD_LENGTH;
    console.debug(`Invalid word! ${currentRow} - Highlighting squares from index ${startIndex} to ${startIndex + WORD_LENGTH - 1}`);
    for (let i = startIndex; i < startIndex + WORD_LENGTH; i++) {
        const square = squares[i];
        square.style.border = '2px solid red';
        square.style.transition = 'border-color 0.3s';
        setTimeout(() => {
            square.style.border = '2px solid #ccc'; // Reset border color after transition
        }, 400);
    }
}


function getHints(type) {
    const possibleWords = solveWordle(gridContainer, currentRow, wordSource);

    // Remove both dropdowns before showing a new one
    document.getElementById('dropdown-words')?.remove();
    document.getElementById('dropdown-letters')?.remove();

    if (type === 'words') {
        const content = document.createElement('div');
        content.innerHTML = `<strong>Possible words (${possibleWords.length}):</strong><br>` +
            `<div style="max-height:180px;overflow:auto;font-size:1.1rem;line-height:1.6;">${possibleWords.join(', ')}</div>`;
        createDropdown(keyboardContainer, content, 'dropdown-words');
    } else if (type === 'letters') {
        const letterCounts = countMostCommonLetters(possibleWords);
        const sortedLetterCounts = Object.entries(letterCounts).sort((a, b) => b[1] - a[1]);
        const content = document.createElement('div');
        content.innerHTML = `<strong>Most common letters:</strong><br>` +
            `<ol style="margin:0;padding-left:1.2em;font-size:1.1rem;">` +
            sortedLetterCounts.slice(0, 10).map(([letter, count]) =>
                `<li><b>${letter}</b>: ${count}</li>`).join('') +
            `</ol>`;
        createDropdown(keyboardContainer, content, 'dropdown-letters');
    }
}

function giveUp() {
    if (!gameDone) alert(`Game Over! The word was: ${word}`);
    document.removeEventListener('keydown', playGameHandler);
    clearGrid(gridContainer, keyboardContainer);
    localStorage.removeItem('wordleGameState');
    playerInput(false, 0);
}

function reset() {
    localStorage.removeItem('wordleGameState');
    window.history.replaceState({}, '', `${window.location.pathname}`);
    removeGameContent(gridContainer, keyboardContainer);
    showWordSetSelection();
}

function giveUpOrReset(type) {
    if (!playGameHandlerActive) {
        console.warn(`Please wait until word has been checked before trying to ${type}`);
        return;
    }
    if (type === 'reset') {
        reset();
    } else {
        giveUp();
    }
}

function removePlayGameHandler() {
    document.removeEventListener('keydown', playGameHandler);
    playGameHandlerActive = false;
}

function addPlayGameHandler() {
    document.addEventListener('keydown', playGameHandler);
    playGameHandlerActive = true;
}


function playerInput(useURLWord = false, startRow = 0) {
    currentRow = startRow;
    currentCol = 0;
    gameDone = false;
    console.log(`Starting game from row ${currentRow}, column ${currentCol}`);

    const params = new URLSearchParams(window.location.search);
    if (!useURLWord) {
        // Pick a random word as usual
        word = wordsToGuess[Math.floor(Math.random() * wordsToGuess.length)];
        // Update the URL for sharing (encode)
        params.set('gid', encodeWord(word));
        params.set('ws', wordSource);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }

    if (playGameHandler)
        removePlayGameHandler();

    console.debug(`The word to guess is: ${word}`); // For debugging purposes

    playGameHandler = function (event) {
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/) && currentCol < WORD_LENGTH) {
            addLetterToSquare(event.key, currentRow, currentCol);
            currentCol++;
        } else if (event.key === 'Backspace' && currentCol > 0) {
            currentCol--;
            addLetterToSquare('', currentRow, currentCol);
        } else if (event.key === 'Enter' && !gameDone) {
            removePlayGameHandler(); // Remove event listener to stop further input avoiding removal/tomfoolery during async checkGuess.
            const guess = Array.from({ length: WORD_LENGTH }, (_, i) => gridContainer.children[currentRow * WORD_LENGTH + i].textContent);

            if (currentCol < WORD_LENGTH || !wordsToUse.includes(guess.join(''))) {
                showWordIsInvalid(currentRow);
                addPlayGameHandler(); // Reinstate event listener to continue input
                return;
            }

            checkGuess(guess, word, currentRow).then(() => {
                if (guess.join('') === word) {
                    alert('Congratulations! You guessed the word!');
                    addOptionToRestartButton();
                    currentRow++; // Save winning into state as well
                    gameDone = true;
                }
                else if (currentRow === ROWS - 1) {
                    alert(`Game Over! The word was: ${word}`);
                    addOptionToRestartButton();
                    gameDone = true;
                }
                else {
                    console.debug(`Current guess: ${guess.join('')}, Target word: ${word}`);
                    currentRow++;
                    currentCol = 0;
                    addPlayGameHandler();
                }

                saveGameState();
            });
        }
    }
    addPlayGameHandler();
}


function startGame(clear = true, useURLWord = false) {
    addWordSourceBelowTitle(wordSource);
    document.body.appendChild(gridContainer);
    document.body.appendChild(keyboardContainer);
    addHintButtons(keyboardContainer, getHints);
    addGameButtons(keyboardContainer, giveUpOrReset);

    if (clear) {
        console.log("Clear is true, clearing...");
        clearGrid(gridContainer, keyboardContainer);
    }

    let startRow = 0;
    if (localStorage.getItem('wordleGameState')) {
        const savedState = JSON.parse(localStorage.getItem('wordleGameState'));
        startRow = savedState.state.currentRow;
        console.debug(`Resuming game from row ${startRow}`);
    }

    playerInput(useURLWord, startRow);
}

function showWordSetSelection() {
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.marginTop = '40px';

    const info = document.createElement('div');
    info.textContent = 'Choose your word set:';
    info.style.fontSize = '1.2rem';
    info.style.marginBottom = '20px';
    container.appendChild(info);

    const btnCommon = createSelectionButton('Common Words');
    const btnPrev = createSelectionButton('Previous Words');
    const btnAll = createSelectionButton('All Words');

    btnCommon.onclick = () => {
        // Use common words from common-words.js
        wordSource = 'common';
        [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        document.body.removeChild(container);
        startGame();
    };

    btnPrev.onclick = () => {
        // Use previously used words from previous-wordle-words.js
        wordSource = 'previous';
        [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        document.body.removeChild(container);
        startGame();
    };

    btnAll.onclick = () => {
        // Use all words from all-words.js
        wordSource = 'all';
        [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        document.body.removeChild(container);
        startGame();
    };

    container.appendChild(btnCommon);
    container.appendChild(btnPrev);
    container.appendChild(btnAll);
    document.body.appendChild(container);
}


function saveGameState() {
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

function loadGameState() {
    const saved = JSON.parse(localStorage.getItem('wordleGameState'));
    if (!saved || !saved.state || !saved.hash) return false;
    const stateStr = JSON.stringify(saved.state);
    if (simpleHash(stateStr) !== saved.hash) {
        // Tampering detected
        localStorage.removeItem('wordleGameState');
        return false;
    }
    const state = saved.state;
    word = decodeWord(state.word).toUpperCase();
    currentRow = state.currentRow;
    currentCol = state.currentCol;
    wordSource = state.wordSource;
    [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);

    const params = new URLSearchParams(window.location.search);
    params.set('gid', encodeWord(word));
    params.set('ws', wordSource);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

    // Restore guesses to the grid (set letters first)
    state.guesses.forEach((guess, row) => {
        for (let col = 0; col < guess.length; col++) {
            addLetterToSquare(guess[col], row, col);
        }
    });

    // Now animate and color only for completed guesses
    state.guesses.forEach((guess, row) => {
        if (guess.length === WORD_LENGTH) {
            checkGuess(guess.split(''), word, row);
        }
    });

    return true;
}




function unlockSolverMode() {
    if (!enabledSolverMode()) {
        titleClicks++;
        console.log(`Title clicks: ${titleClicks}/5`);
    } else if (!solverModeEnabled) {
        console.log("Solver mode unlocked!");
        solverModeEnabled = true;
        showSolverModeInfo();
    }
}

function showSolverModeInfo() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        text-align: center;
        font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
        <h2>🎉 Wordle Solver Mode Unlocked!</h2>
        <p><strong>How it works:</strong></p>
        <ul style="text-align: left; margin: 20px 0;">
            <li>Type letters directly - they auto-advance to next row</li>
            <li>Letters start as gray (absent)</li>
            <li><strong>Click tiles</strong> to change colors:</li>
            <ul>
                <li>Gray → Yellow (present) → Green (correct) → Gray</li>
            </ul>
            <li>Hints update automatically as you type/click</li>
            <li>Use backspace to delete letters</li>
        </ul>
        <button id="start-solver" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        ">Start Solver Mode</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('start-solver').addEventListener('click', () => {
        document.body.removeChild(overlay);
        startSolverMode();
    });
}

function startSolverMode() {
    // Remove existing game elements
    removeGameContent(gridContainer, keyboardContainer);
    
    // Set default word source for solver
    // wordSource = 'common';
    [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
    
    // Create solver grid
    const solverGrid = createGridContainer(WORD_LENGTH, ROWS);
    addWordSourceBelowTitle(wordSource);
    document.body.appendChild(solverGrid);
    
    // Create always-visible hint containers
    createSolverHintContainers();
    
    // Setup solver input handling
    setupSolverInput(solverGrid);
    
    // Initial hint update
    updateSolverHints(solverGrid);
}

function createSolverHintContainers() {
    const hintsContainer = document.createElement('div');
    hintsContainer.style.cssText = `
        display: flex;
        gap: 20px;
        justify-content: center;
        margin: 20px auto;
        max-width: 800px;
    `;

    // Possible words container
    const wordsContainer = document.createElement('div');
    wordsContainer.id = 'solver-words';
    wordsContainer.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        min-width: 300px;
        max-height: 300px;
        overflow-y: auto;
    `;
    wordsContainer.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Possible Words</h3>
        <div id="words-content">Enter some letters to see suggestions...</div>
    `;

    // Letter frequency container
    const lettersContainer = document.createElement('div');
    lettersContainer.id = 'solver-letters';
    lettersContainer.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        min-width: 200px;
        max-height: 300px;
        overflow-y: auto;
    `;
    lettersContainer.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Best Letters</h3>
        <div id="letters-content">Enter some letters to see frequency...</div>
    `;

    hintsContainer.appendChild(wordsContainer);
    hintsContainer.appendChild(lettersContainer);
    document.body.appendChild(hintsContainer);
}

function setupSolverInput(solverGrid) {
    let currentSolverRow = 0;
    let currentSolverCol = 0;

    // Add click handlers to tiles for color cycling
    Array.from(solverGrid.children).forEach((square, _) => {
        square.addEventListener('click', () => {
            if (square.textContent.trim() === '') return; // Don't change empty squares
            
            const currentBg = square.style.backgroundColor;
            const currentColor = currentBg ? rgbToHex(currentBg) : LetterStatus.ABSENT;
            
            // Cycle through colors: gray → yellow → green → gray
            let newColor;
            if (currentColor === LetterStatus.ABSENT) {
                newColor = LetterStatus.PRESENT;
            } else if (currentColor === LetterStatus.PRESENT) {
                newColor = LetterStatus.CORRECT;
            } else {
                newColor = LetterStatus.ABSENT;
            }
            
            square.style.backgroundColor = newColor;
            square.style.color = newColor === LetterStatus.ABSENT ? '#333' : '#fff';
            
            updateSolverHints(solverGrid);
        });
    });

    // Keyboard input handler
    const solverInputHandler = (event) => {
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            // Add letter and auto-advance
            const index = currentSolverRow * WORD_LENGTH + currentSolverCol;
            const square = solverGrid.children[index];
            
            if (square) {
                square.textContent = event.key.toUpperCase();
                square.style.backgroundColor = LetterStatus.ABSENT;
                square.style.color = '#333';
                
                // Auto-advance
                currentSolverCol++;
                if (currentSolverCol >= WORD_LENGTH) {
                    currentSolverCol = 0;
                    currentSolverRow++;
                    if (currentSolverRow >= ROWS) {
                        currentSolverRow = ROWS - 1;
                        currentSolverCol = WORD_LENGTH - 1;
                    }
                }
                
                updateSolverHints(solverGrid);
            }
        } else if (event.key === 'Backspace') {
            // Go back and clear
            if (currentSolverCol > 0 || currentSolverRow > 0) {
                if (currentSolverCol === 0 && currentSolverRow > 0) {
                    currentSolverRow--;
                    currentSolverCol = WORD_LENGTH - 1;
                } else if (currentSolverCol > 0) {
                    currentSolverCol--;
                }
                
                const index = currentSolverRow * WORD_LENGTH + currentSolverCol;
                const square = solverGrid.children[index];
                
                if (square) {
                    square.textContent = '';
                    square.style.backgroundColor = '#fff';
                    square.style.color = '#333';
                    updateSolverHints(solverGrid);
                }
            }
        }
    };

    document.addEventListener('keydown', solverInputHandler);
}

function updateSolverHints(solverGrid) {
    // Count how many rows have content
    let filledRows = 0;
    for (let row = 0; row < ROWS; row++) {
        let hasContent = false;
        for (let col = 0; col < WORD_LENGTH; col++) {
            const square = solverGrid.children[row * WORD_LENGTH + col];
            if (square.textContent.trim() !== '') {
                hasContent = true;
                break;
            }
        }
        if (hasContent) filledRows = row + 1;
        else break;
    }

    if (filledRows === 0) {
        // No content, show initial state
        document.getElementById('words-content').textContent = 'Enter some letters to see suggestions...';
        document.getElementById('letters-content').textContent = 'Enter some letters to see frequency...';
        return;
    }

    // Get possible words using the solver
    const possibleWords = solveWordle(solverGrid, filledRows, wordSource);
    
    // Update words display
    const wordsContent = document.getElementById('words-content');
    if (possibleWords.length > 0) {
        wordsContent.innerHTML = `
            <div style="margin-bottom: 10px;"><strong>${possibleWords.length} possible words:</strong></div>
            <div style="font-size: 14px; line-height: 1.4;">${possibleWords.slice(0, 50).join(', ')}${possibleWords.length > 50 ? '...' : ''}</div>
        `;
    } else {
        wordsContent.innerHTML = '<div style="color: #dc3545;">No possible words found. Check your clues!</div>';
    }
    
    // Update letters display
    const lettersContent = document.getElementById('letters-content');
    if (possibleWords.length > 0) {
        const letterCounts = countMostCommonLetters(possibleWords);
        const sortedLetters = Object.entries(letterCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        lettersContent.innerHTML = `
            <div style="margin-bottom: 10px;"><strong>Most frequent letters:</strong></div>
            <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                ${sortedLetters.map(([letter, count]) => `<li><strong>${letter}</strong>: ${count}</li>`).join('')}
            </ol>
        `;
    } else {
        lettersContent.innerHTML = '<div style="color: #dc3545;">No letters to analyze.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add a title to the grid
    const title = document.createElement('h1');
    title.textContent = 'Wordle Game';
    title.style.textAlign = 'center';
    title.style.marginTop = '0px';
    title.addEventListener('click', unlockSolverMode)

    document.body.appendChild(title);
    applyBodyStyles();
    // If wordSource is already set in localStorage, start the game directly
    if (localStorage.getItem('wordleGameState')) {
        if (loadGameState()) {
            startGame(false, true);
            return;
        }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('gid') && params.has('ws')) {
        if (!params.get('gid').length === WORD_LENGTH) {
            console.warn(`Invalid word length in URL: ${params.get('gid')}. Expected ${WORD_LENGTH} characters.`);
            showWordSetSelection();
            return;
        }
        // Use the word from the URL (decode)
        console.debug(`Using word from URL: ${params.get('gid')}`);
        word = decodeWord(params.get('gid')).toUpperCase();
        wordSource = params.get('ws') || 'common'; // Default to 'common' if not specified
        [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);

        if (!wordsToUse.includes(word)) {
            console.warn(`The word from URL (${word}) is not in the selected word source (${wordSource}). Showing word set selection.`);
            showWordSetSelection();
            return;
        }

        console.debug(`Using word source from URL: ${wordSource}`);
        startGame(true, true);
        return;
    }

    // Otherwise, show the word set selection
    console.debug('No saved game state found or tampered with. Showing word set selection.');
    showWordSetSelection();
});