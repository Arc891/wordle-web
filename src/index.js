// Create a 6x5 grid (like Wordle) and add it to the page
import { commonWords } from './common-words.js';
import { createGridContainer, applyBodyStyles, createKeyboardContainer, createSelectionButton } from './setup.js';
import { wordleWords } from './wordle-dictionary.js';

const WORD_LENGTH = 5;
const ROWS = 6;


const gridContainer = createGridContainer(WORD_LENGTH, ROWS);
const keyboardContainer = createKeyboardContainer(WORD_LENGTH);

let currentRow = 0;
let currentCol = 0;
let word = '';
let words = [];
let wordSource = '';
let playGameHandler = null;


function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

function addLetterToSquare(letter, row, col) {
    const index = row * WORD_LENGTH + col;
    const square = gridContainer.children[index];
    if (square) {
        square.textContent = letter.toUpperCase();
    }
}

function clearGrid() {
    for (let i = 0; i < gridContainer.children.length; i++) {
        gridContainer.children[i].textContent = '';
        gridContainer.children[i].style.backgroundColor = '#fff'; // Reset background color
        gridContainer.children[i].style.border = '1px solid #ccc'; // Reset border color
        gridContainer.children[i].style.transition = 'none'; // Reset transition for immediate effect
        gridContainer.children[i].style.color = '#333'; // Reset text color
    }
    // Reset all keyboard buttons
    for (let row = 0; row < keyboardContainer.children.length; row++) {
        const rowDiv = keyboardContainer.children[row];
        for (let btn = 0; btn < rowDiv.children.length; btn++) {
            const keyButton = rowDiv.children[btn];
            keyButton.style.backgroundColor = '#e0e0e0';
            keyButton.style.color = '#333';
            keyButton.style.transition = 'none';
        }
    }
}

const LetterStatus = {
    CORRECT: '#6baa64',
    PRESENT: '#cab458',
    ABSENT: '#787c7e'
};


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
        console.log(`Letter: ${guess[i]}, Status: ${status}, square: ${square.textContent}`);

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
            // If the key is already correct, do not change it
            if (keyButton.style.backgroundColor === hexToRgb(LetterStatus.CORRECT))
                return;
            
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
    function restartOnInputR(event) {
        if (event.key === 'r' || event.key === 'R') {
            restart();
        }
    }
    
    function restart() {
        clearGrid();
        playerInput();
        console.log('Game restarted');
        document.removeEventListener('keydown', restartOnInputR); // Remove the restart event listener
        document.body.removeChild(restartButton);
    }

    restartButton.addEventListener('click', restart);
    document.addEventListener('keydown', restartOnInputR);

    document.body.appendChild(restartButton);
}

function showWordIsInvalid(currentRow) {
    const squares = Array.from(gridContainer.children);
    const startIndex = currentRow * WORD_LENGTH;
    console.log(`Invalid word! ${currentRow} - Highlighting squares from index ${startIndex} to ${startIndex + WORD_LENGTH - 1}`);
    for (let i = startIndex; i < startIndex + WORD_LENGTH; i++) {
        const square = squares[i];
        square.style.border = '2px solid red';
        square.style.transition = 'border-color 0.3s';
        setTimeout(() => {
            square.style.border = '2px solid #ccc'; // Reset border color after transition
        }, 400);
    }
}


function playerInput() {
    currentRow = 0;
    currentCol = 0;
    let gameDone = false;

    clearGrid();
    word = words[Math.floor(Math.random() * words.length)]; // Randomly select a word from the list

    if (playGameHandler) {
        document.removeEventListener('keydown', playGameHandler);
    }

    console.log(`The word to guess is: ${word}`); // For debugging purposes

    playGameHandler = function(event) {
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/) && currentCol < WORD_LENGTH) {
            addLetterToSquare(event.key, currentRow, currentCol);
            currentCol++;
        } else if (event.key === 'Backspace' && currentCol > 0) {
            currentCol--;
            addLetterToSquare('', currentRow, currentCol);
        } else if (event.key === 'Enter' && !gameDone) {
            const guess = Array.from({ length: WORD_LENGTH }, (_, i) => gridContainer.children[currentRow * WORD_LENGTH + i].textContent);

            if (currentCol < WORD_LENGTH || !words.includes(guess.join(''))) {
                showWordIsInvalid(currentRow);
                return;
            }

            checkGuess(guess, word, currentRow).then(() => {
                if (guess.join('') === word) {
                    alert('Congratulations! You guessed the word!');
                    addOptionToRestartButton();
                    document.removeEventListener('keydown', playGameHandler); // Remove event listener to stop further input
                } 
                else if (currentRow === ROWS - 1) {
                    alert(`Game Over! The word was: ${word}`);
                    addOptionToRestartButton();
                    document.removeEventListener('keydown', playGameHandler); // Remove event listener to stop further input
                }
                else {
                    console.log(`Current guess: ${guess.join('')}, Target word: ${word}`);
                    currentRow++;
                    currentCol = 0;
                }
            });
        }
    }
    document.addEventListener('keydown', playGameHandler);
}

function startGame() {
    // Append small text below h1 to show word source
    const wordSourceText = document.createElement('p');
    wordSourceText.textContent = `Words: ${wordSource}`;
    wordSourceText.style.textAlign = 'center';
    wordSourceText.style.fontSize = '0.8rem';
    wordSourceText.style.color = '#666';
    wordSourceText.style.marginTop = '-20px';
    wordSourceText.style.marginBottom = '-5px';
    document.body.appendChild(wordSourceText);

    document.body.appendChild(gridContainer);
    document.body.appendChild(keyboardContainer);
    playerInput();
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
    const btnAll = createSelectionButton('All Words');

    btnCommon.onclick = () => {
        // Use common words from common-words.js
        words = commonWords.map(w => w.toUpperCase());
        wordSource = 'common';
        document.body.removeChild(container);
        startGame();
    };

    btnAll.onclick = () => {
        // Use all words from wordle-dictionary.js
        words = wordleWords.map(w => w.toUpperCase());
        wordSource = 'all';
        document.body.removeChild(container);
        startGame();
    };

    container.appendChild(btnCommon);
    container.appendChild(btnAll);
    document.body.appendChild(container);
}

// Initialize player input
document.addEventListener('DOMContentLoaded', () => {
    // Add a title to the grid
    const title = document.createElement('h1');
    title.textContent = 'Wordle Game';
    title.style.textAlign = 'center';
    title.style.marginTop = '0px';
    document.body.appendChild(title);
    applyBodyStyles();
    showWordSetSelection();
});