import { createGridContainer, addWordSourceBelowTitle, removeGameContent } from '../components/setup.js';
import { mapWordSourceToWords, LetterStatus, rgbToHex } from '../utils.js';
import { solveWordle, countMostCommonLetters } from './solve-wordle.js';

export function showSolverModeInfo(startSolverModeCallback) {
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
        startSolverModeCallback();
    });
}

export function startSolverMode(gridContainer, keyboardContainer, wordSource, WORD_LENGTH, ROWS) {
    // Remove existing game elements
    removeGameContent(gridContainer, keyboardContainer);
    
    // Set default word source for solver if not already set
    if (!wordSource) {
        wordSource = 'common';
    }
    const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
    
    // Create solver grid
    const solverGrid = createGridContainer(WORD_LENGTH, ROWS);
    addWordSourceBelowTitle(wordSource);
    document.body.appendChild(solverGrid);
    
    // Create always-visible hint containers
    createSolverHintContainers();
    
    // Setup solver input handling
    setupSolverInput(solverGrid, wordSource, WORD_LENGTH, ROWS);
    
    // Initial hint update
    updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
    
    return { solverGrid, wordsToGuess, wordsToUse, wordSource };
}

export function createSolverHintContainers() {
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

export function setupSolverInput(solverGrid, wordSource, WORD_LENGTH, ROWS) {
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
            
            updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
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
                
                updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
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
                    updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
                }
            }
        }
    };

    document.addEventListener('keydown', solverInputHandler);
}

export function updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH) {
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
