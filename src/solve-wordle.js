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
    if (!Array.isArray(guesses) || !Array.isArray(statuses) || guesses.length !== statuses.length) {
        throw new Error("Invalid input: guesses and statuses must be arrays of the same length.");
    }

    console.log(`Filtering words with ${guesses} and statuses ${statuses} - ${statuses.length}`);

    const statusPerLetter = [];
    statuses.forEach((status, idx) => {
        for (let i = 0; i < status.length; i++) {
            statusPerLetter.push(
                {
                    letter: guesses[idx][i],
                    status: status[i],
                    idx: i,
                }
            );
        }
    });
    console.log(statusPerLetter);

    let words = wordSet.map(word => word.toUpperCase());

    statusPerLetter.forEach(ls => {
        // console.debug(`${ls} - ${ls.letter} - ${ls.status} - ${ls.idx}`);
        if (ls.status === LetterStatus.ABSENT) {
            words = words.filter(word => !word.includes(ls.letter));
        } 
        else if (ls.status === LetterStatus.CORRECT) {
            words = words.filter(word => word[ls.idx] === ls.letter);
        }
        else if (ls.status === LetterStatus.PRESENT) {
            words = words.filter(word => word[ls.idx] !== ls.letter && word.includes(ls.letter));
        }
        console.log(`Filtered ${ls.letter} being ${letterStatusToName(ls.status)} - left with ${words.length} possible words.`);
    })

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