import { createGridContainer, addWordSourceBelowTitle, removeGameContent } from '../components/setup.js';
import { mapWordSourceToWords, LetterStatus, rgbToHex } from '../utils.js';
import { solveWordle, countMostCommonLetters } from './solve-wordle.js';
import { theme, getTheme } from '../styles/theme.js';
import { createStyledElement, stylePatterns, addButtonPressEffect, addButtonHoverEffect } from '../styles/utils.js';

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

    const modal = createStyledElement('div', {
        background: theme.colors.cardBackground,
        padding: theme.spacing.xl,
        borderRadius: theme.borderRadius.lg,
        maxWidth: '500px',
        textAlign: 'center',
        fontFamily: theme.typography.fontFamily
    });

    modal.innerHTML = `
        <h2 style="color: ${theme.colors.primary}; margin-top: 0;">🎉 Wordle Solver Mode Unlocked!</h2>
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
            background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
            color: ${theme.colors.textLight};
            border: none;
            padding: 12px 24px;
            border-radius: ${theme.borderRadius.md};
            cursor: pointer;
            font-size: 16px;
            font-weight: ${theme.typography.fontWeight.medium};
            box-shadow: ${theme.shadows.primaryButton};
            transition: transform ${theme.transitions.normal}, box-shadow ${theme.transitions.normal};
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
    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(solverGrid);
    } else {
        document.body.appendChild(solverGrid);
    }
    
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
    const hintsContainer = createStyledElement('div', {
        display: 'flex',
        gap: theme.spacing.lg,
        justifyContent: 'center',
        margin: `${theme.spacing.lg} auto`,
        maxWidth: '800px',
        flexWrap: 'wrap'
    });

    // Possible words container
    const wordsContainer = createStyledElement('div', {
        background: theme.colors.keyboardBackground,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        minWidth: '300px',
        maxHeight: '300px',
        overflowY: 'auto',
        flex: 1,
        boxShadow: theme.shadows.md
    }, {
        id: 'solver-words'
    });
    wordsContainer.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Possible Words</h3>
        <div id="words-content">Enter some letters to see suggestions...</div>
    `;

    // Letter frequency container
    const lettersContainer = createStyledElement('div', {
        background: theme.colors.keyboardBackground,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        minWidth: '200px',
        maxHeight: '300px',
        overflowY: 'auto',
        flex: 1,
        boxShadow: theme.shadows.md
    }, {
        id: 'solver-letters'
    });
    lettersContainer.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Best Letters</h3>
        <div id="letters-content">Enter some letters to see frequency...</div>
    `;

    hintsContainer.appendChild(wordsContainer);
    hintsContainer.appendChild(lettersContainer);
    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(hintsContainer);
    } else {
        document.body.appendChild(hintsContainer);
    }
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
    const currentTheme = getTheme();
    const squareSize = currentTheme.grid.squareSize;
    const gap = currentTheme.grid.gap;
    const totalWidth = WORD_LENGTH * squareSize + (WORD_LENGTH - 1) * gap;

    const gridContainer = createStyledElement('div', {
        display: 'grid',
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)`,
        gap: `${gap}px`,
        width: `${totalWidth}px`,
        margin: `${theme.spacing.xxl} auto`
    });

    for (let i = 0; i < WORD_LENGTH * ROWS; i++) {
        const square = createStyledElement('div', {
            ...stylePatterns.gridSquare,
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            cursor: 'pointer',
            touchAction: 'manipulation'
        }, {
            className: 'solver-grid-square',
            textContent: ''
        });
        gridContainer.appendChild(square);
    }

    return gridContainer;
}

export function addSolverInstructions() {
    const instructionsContainer = createStyledElement('div', {
        background: theme.colors.keyboardBackground,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        margin: `${theme.spacing.lg} auto`,
        maxWidth: '600px',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.sm,
        textAlign: 'center',
        boxShadow: theme.shadows.md
    });
    
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
    
    const currentTheme = getTheme();
    const keyboardContainer = createStyledElement('div', stylePatterns.keyboardContainer);
    keyboardContainer.id = 'solver-keyboard';

    // Define keys in rows to mimic the game keyboard layout
    const keyRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
    ];

    const rowStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: currentTheme.keyboard.gap
    };

    keyRows.forEach((row) => {
        const rowDiv = createStyledElement('div', rowStyle);

        row.forEach((key) => {
            const keyButton = createStyledElement('button', stylePatterns.keyboardButton, {
                textContent: key === 'Backspace' ? '⌫' : key,
                dataset: { key }
            });

            // Make Enter and Backspace wider
            if (key === 'Enter' || key === 'Backspace') {
                keyButton.style.minWidth = currentTheme.keyboard.specialButtonMinWidth;
                keyButton.style.fontSize = key === 'Enter' ? theme.typography.fontSize.xs : theme.typography.fontSize.lg;
            }

            // Add press effect
            const triggerPress = addButtonPressEffect(keyButton);

            // Add hover effect
            addButtonHoverEffect(keyButton);

            // Add touch feedback for mobile
            keyButton.addEventListener('touchstart', () => {
                triggerPress();
            }, { passive: true });

            keyButton.addEventListener('click', () => { 
                triggerPress();
                simulateKeyPress(key); 
            });
            rowDiv.appendChild(keyButton);
        });

        keyboardContainer.appendChild(rowDiv);
    });

    // Add color legend below the keyboard
    const colorLegend = createStyledElement('div', {
        marginTop: theme.spacing.md,
        padding: theme.spacing.sm,
        background: theme.colors.keyboardBackground,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.xs,
        textAlign: 'center',
        fontFamily: theme.typography.fontFamily
    });
    colorLegend.innerHTML = `
        <strong>Tap grid squares to change colors:</strong><br>
        <span style="background: #787c7e; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Gray</span> = Absent • 
        <span style="background: #cab458; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Yellow</span> = Present • 
        <span style="background: #6baa64; color: white; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">Green</span> = Correct
    `;
    keyboardContainer.appendChild(colorLegend);

    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(keyboardContainer);
    } else {
        document.body.appendChild(keyboardContainer);
    }
    return keyboardContainer;
}

export function setupSolverInput(solverGrid, wordSource, WORD_LENGTH, ROWS, isMobile = false) {
    let currentSolverRow = 0;
    let currentSolverCol = 0;

    // Add click handlers to tiles for color cycling
    Array.from(solverGrid.children).forEach((square, _) => {
        // Enhanced touch handling for mobile
        const eventOptions = isMobile ? { passive: false } : undefined; // Non-passive because we preventDefault
        const eventType = isMobile ? 'touchstart' : 'click';
        
        const handler = (e) => {
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
        };
        
        if (eventOptions) {
            square.addEventListener(eventType, handler, eventOptions);
        } else {
            square.addEventListener(eventType, handler);
        }
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
