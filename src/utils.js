import { allWords } from "./data/words/all-words.js";
import { commonWords } from "./data/words/common-words.js";
import { previousWordleWords } from "./data/words/previous-wordle-words.js";

export const LetterStatus = {
    CORRECT: '#6baa64',
    PRESENT: '#cab458',
    ABSENT: '#787c7e'
};

export function letterStatusToName(ls) {
    return ls === LetterStatus.CORRECT ? 'CORRECT' :
           ls === LetterStatus.PRESENT ? 'PRESENT' :
           'ABSENT';
}

export function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHex(rgb) {
    const hex = rgb.match(/\d+/g).map(x => {
        const hexValue = parseInt(x).toString(16);
        return hexValue.length === 1 ? '0' + hexValue : hexValue;
    }).join('');
    return `#${hex}`;
}

export function clearGrid(gridContainer, keyboardContainer) {
    console.debug("Clearing the grid...");
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

export function simpleHash(str) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
}


export function encodeWord(word) {
    return btoa(encodeURIComponent(word));
}
export function decodeWord(encoded) {
    try {
        return decodeURIComponent(atob(encoded));
    } catch {
        return '';
    }
}

export function mapWordSourceToWords(wordSource) {
    const allw =            allWords.map(word => word.toUpperCase());
    const cmw  =         commonWords.map(word => word.toUpperCase());
    const prvw = previousWordleWords.map(word => word.toUpperCase());
    if (wordSource === 'custom') {
        const customWords = localStorage.getItem('customWordList');
        if (customWords) {
            return customWords.split(',').map(word => word.trim().toUpperCase());
        }
        return [];
    } else if (wordSource === 'common') {
        return [cmw, cmw];
    } else if (wordSource === 'previous') {
        return [cmw, prvw];
    } else if (wordSource === 'all') {
        return [allw, allw];
    }
    return [allw, allw]; // Default to all words if no valid source is provided
}