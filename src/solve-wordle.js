import { LetterStatus, letterStatusToName } from "./utils";
import { rgbToHex } from "./utils";
import { commonWords } from "./words/common-words";
import { previousWordleWords } from "./words/previous-wordle-words";
import { allWords } from "./words/all-words";


export function solveWordle(gridContainer, currentRow, wordSource = 'common') {
    const guesses = getAllPreviousGuesses(gridContainer, currentRow);
    const statuses = getAllStatuses(gridContainer, currentRow);
    const wordSet = 
        wordSource === 'common' ? commonWords :
        wordSource === 'previous' ? previousWordleWords :
        allWords;
    return filterWordsFromSet(wordSet, guesses, statuses);
}


function filterWordsFromSet(wordSet, guesses, statuses) {
    let words = wordSet.map(word => word.toUpperCase());

    for (let row = 0; row < guesses.length; row++) {
        const guess = guesses[row];
        const status = statuses[row];

        // 1. First, handle CORRECT and PRESENT
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            if (status[i] === LetterStatus.CORRECT) {
                words = words.filter(word => word[i] === letter);
            }
        }
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            if (status[i] === LetterStatus.PRESENT) {
                words = words.filter(word => word.includes(letter) && word[i] !== letter);
            }
        }

        // 2. Now handle ABSENT, but only if the number of occurrences in the word is not more than the number of CORRECT+PRESENT for that letter in this guess
        const letterCounts = {};
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            if (!letterCounts[letter]) letterCounts[letter] = { correct: 0, present: 0, absent: 0 };
            if (status[i] === LetterStatus.CORRECT) letterCounts[letter].correct++;
            else if (status[i] === LetterStatus.PRESENT) letterCounts[letter].present++;
            else if (status[i] === LetterStatus.ABSENT) letterCounts[letter].absent++;
        }
        for (const letter in letterCounts) {
            const allowedCount = letterCounts[letter].correct + letterCounts[letter].present;
            if (letterCounts[letter].absent > 0) {
                words = words.filter(word => {
                    // Only allow words with at most allowedCount of this letter
                    return (word.split(letter).length - 1) <= allowedCount;
                });
            }
        }
    }
    return words;
}

function getAllPreviousGuesses(gridContainer, currentRow) {
    const previousGuesses = [];
    for (let i = 0; i < currentRow; i++) {
        const rowSquares = Array.from(gridContainer.children).slice(i * 5, (i + 1) * 5);
        const guess = Array.from(rowSquares).map(square => square.textContent).join('');
        console.debug(`Row ${i}: ${guess} - ${rowSquares.length}`);
        previousGuesses.push(guess);
    }
    return previousGuesses;
}


function getAllStatuses(gridContainer, currentRow) {
    const statuses = [];
    for (let i = 0; i < currentRow; i++) {
        const rowSquares = Array.from(gridContainer.children).slice(i * 5, (i + 1) * 5);
        const statusRow = Array.from(rowSquares).map(square => rgbToHex(square.style.backgroundColor) || LetterStatus.ABSENT);
        console.debug(`Row ${i} statuses: ${statusRow.join(', ')}`);
        statuses.push(statusRow);
    }
    return statuses;
}

export function countMostCommonLetters(possibleWords) {
    const letterCounts = {};
    possibleWords.forEach(word => {
        word.split('').forEach(letter => {
            if (!letterCounts[letter]) {
                letterCounts[letter] = 0;
            }
            letterCounts[letter]++;
        });
    });
    return letterCounts;
}