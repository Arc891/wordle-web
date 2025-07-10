import { LetterStatus } from '../utils.js';
import { solveWordle, countMostCommonLetters } from '../solver/solve-wordle.js';
import { hexToRgb } from '../utils.js';
import { createDropdown } from '../components/setup.js';

export function addLetterToSquare(letter, row, col, gridContainer, WORD_LENGTH) {
    const index = row * WORD_LENGTH + col;
    const square = gridContainer.children[index];
    if (square) {
        square.textContent = letter.toUpperCase();
    }
}

export function getLetterStatuses(guess, word) {
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

export async function checkGuess(guess, word, currentRow, gridContainer, keyboardContainer, WORD_LENGTH) {
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

export function showWordIsInvalid(currentRow, gridContainer, WORD_LENGTH) {
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

export function getHints(type, gridContainer, currentRow, wordSource, keyboardContainer) {
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
