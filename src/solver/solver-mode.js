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
    
    // Create solver grid with mobile-friendly styling
    const solverGrid = createSolverGrid(WORD_LENGTH, ROWS);
    addWordSourceBelowTitle(wordSource);
    document.body.appendChild(solverGrid);
    
    // Add mobile-friendly instructions
    // addSolverInstructions();
    
    // Create mobile-friendly keyboard if needed (always show for consistency)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    createSolverKeyboard(solverGrid, wordSource, WORD_LENGTH, ROWS);
    
    // Create always-visible hint containers
    createSolverHintContainers();
    
    // Setup solver input handling
    setupSolverInput(solverGrid, wordSource, WORD_LENGTH, ROWS, isMobile);
    
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
        flex-wrap: wrap;
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
        flex: 1;
        min-width: 280px;
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
        flex: 1;
        min-width: 280px;
    `;
    lettersContainer.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Best Letters</h3>
        <div id="letters-content">Enter some letters to see frequency...</div>
    `;

    hintsContainer.appendChild(wordsContainer);
    hintsContainer.appendChild(lettersContainer);
    document.body.appendChild(hintsContainer);
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

export function createSolverGrid(WORD_LENGTH, ROWS) {
    const gridContainer = document.createElement('div');
    const squareSize = window.innerWidth <= 768 ? 60 : 50; // Larger on mobile
    const gap = window.innerWidth <= 768 ? 10 : 8; // More space on mobile
    const totalWidth = WORD_LENGTH * squareSize + (WORD_LENGTH - 1) * gap;

    Object.assign(gridContainer.style, {
        display: 'grid',
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)`,
        gap: `${gap}px`,
        width: `${totalWidth}px`,
        margin: '40px auto'
    });

    for (let i = 0; i < WORD_LENGTH * ROWS; i++) {
        const square = document.createElement('div');
        const squareProperties = {
            className: 'solver-grid-square',
            textContent: '',
            style: {
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                border: '2px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: window.innerWidth <= 768 ? '1.8rem' : '1.5rem',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                color: '#333',
                background: '#fff',
                boxSizing: 'border-box',
                cursor: 'pointer',
                userSelect: 'none',
                touchAction: 'manipulation' // Better touch handling
            }
        };
        Object.assign(square, { className: squareProperties.className, textContent: squareProperties.textContent });
        Object.assign(square.style, squareProperties.style);
        gridContainer.appendChild(square);
    }

    return gridContainer;
}

export function addSolverInstructions() {
    const instructionsContainer = document.createElement('div');
    instructionsContainer.style.cssText = `
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 8px;
        padding: 15px;
        margin: 20px auto;
        max-width: 600px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        text-align: center;
    `;
    
    const isMobile = window.innerWidth <= 768;
    instructionsContainer.innerHTML = `
        <strong>🔍 Solver Mode Instructions:</strong><br>
        ${isMobile ? 
            '• Use keyboard below to add letters • Tap grid squares to cycle colors (Gray → Yellow → Green) • Use backspace to delete' :
            '• Use keyboard below or type letters • Click grid squares to cycle colors (Gray → Yellow → Green) • Use backspace to delete'
        }
    `;
    
    document.body.appendChild(instructionsContainer);
}

export function createSolverKeyboard(solverGrid, wordSource, WORD_LENGTH, ROWS) {
    function simulateKeyPress(key) {
        const event = new KeyboardEvent('keydown', { key });
        document.dispatchEvent(event);
    }
    
    const keyboardContainer = document.createElement('div');
    keyboardContainer.id = 'solver-keyboard';

    // Define keys in rows to mimic the game keyboard layout
    const keyRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
    ];

    const keyboardContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: 'max-content',
        margin: '20px auto'
    };

    const rowStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
    };

    const buttonStyle = {
        padding: '10px 14px',
        width: '20px',
        textAlign: 'center',
        fontSize: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#e0e0e0',
        border: '1px solid #ccc',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    Object.assign(keyboardContainer.style, keyboardContainerStyle);

    keyRows.forEach((row) => {
        const rowDiv = document.createElement('div');
        Object.assign(rowDiv.style, rowStyle);

        row.forEach((key) => {
            const keyButton = document.createElement('button');
            keyButton.textContent = key === 'Backspace' ? '⌫' : key;
            Object.assign(keyButton.style, buttonStyle);

            // Make Enter and Backspace a bit wider
            if (key === 'Enter' || key === 'Backspace') {
                keyButton.style.flex = '1.5';
                keyButton.style.minWidth = '60px';
            }

            // Add hover effect
            keyButton.addEventListener('mouseenter', () => {
                keyButton.style.backgroundColor = '#d0d0d0';
            });
            keyButton.addEventListener('mouseleave', () => {
                keyButton.style.backgroundColor = '#e0e0e0';
            });

            // Add touch feedback for mobile
            keyButton.addEventListener('touchstart', () => {
                keyButton.style.backgroundColor = '#d0d0d0';
            });
            keyButton.addEventListener('touchend', () => {
                keyButton.style.backgroundColor = '#e0e0e0';
            });

            keyButton.addEventListener('click', () => { simulateKeyPress(key); });
            rowDiv.appendChild(keyButton);
        });

        keyboardContainer.appendChild(rowDiv);
    });

    // Add color legend below the keyboard
    const colorLegend = document.createElement('div');
    colorLegend.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        font-size: 12px;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    colorLegend.innerHTML = `
        <strong>Tap grid squares to change colors:</strong><br>
        <span style="background: #787c7e; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Gray</span> = Absent • 
        <span style="background: #cab458; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Yellow</span> = Present • 
        <span style="background: #6baa64; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Green</span> = Correct
    `;
    keyboardContainer.appendChild(colorLegend);

    document.body.appendChild(keyboardContainer);
    return keyboardContainer;
}

export function setupSolverInput(solverGrid, wordSource, WORD_LENGTH, ROWS, isMobile = false) {
    let currentSolverRow = 0;
    let currentSolverCol = 0;

    // Add click handlers to tiles for color cycling
    Array.from(solverGrid.children).forEach((square, _) => {
        // Enhanced touch handling for mobile
        square.addEventListener(isMobile ? 'touchstart' : 'click', (e) => {
            if (isMobile) {
                e.preventDefault(); // Prevent double-tap zoom
            }
            
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
            
            // Add visual feedback
            square.style.transform = 'scale(0.95)';
            setTimeout(() => {
                square.style.transform = 'scale(1)';
            }, 100);
            
            updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
        });
    });

    // Keyboard input handler (works for both physical and virtual keyboards)
    const solverInputHandler = (event) => {
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            // Add letter and auto-advance
            const index = currentSolverRow * WORD_LENGTH + currentSolverCol;
            const square = solverGrid.children[index];
            
            if (square) {
                square.textContent = event.key.toUpperCase();
                square.style.backgroundColor = LetterStatus.ABSENT;
                square.style.color = '#333';
                
                // Add visual feedback
                square.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    square.style.transform = 'scale(1)';
                }, 150);
                
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
                    
                    // Add visual feedback
                    square.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        square.style.transform = 'scale(1)';
                    }, 150);
                    
                    updateSolverHints(solverGrid, wordSource, ROWS, WORD_LENGTH);
                }
            }
        }
    };

    document.addEventListener('keydown', solverInputHandler);
}
