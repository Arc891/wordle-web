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
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const gameCard = document.getElementById('game-card');
    
    // Make game card wider for solver mode
    if (gameCard && !isMobile) {
        gameCard.style.maxWidth = '1400px';
        gameCard.style.width = '95%';
    }
    
    addWordSourceBelowTitle(wordSource);
    
    // Create main solver layout container
    const solverLayout = createSolverLayout(WORD_LENGTH, ROWS, isMobile);
    
    if (gameCard) {
        gameCard.appendChild(solverLayout.container);
    } else {
        document.body.appendChild(solverLayout.container);
    }
    
    // Setup solver input handling
    setupSolverInput(solverLayout.grid, wordSource, WORD_LENGTH, ROWS, isMobile);
    
    // Initial hint update
    updateSolverHints(solverLayout.grid, wordSource, ROWS, WORD_LENGTH);
    
    return { solverGrid: solverLayout.grid, wordsToGuess, wordsToUse, wordSource };
}

export function createSolverLayout(WORD_LENGTH, ROWS, isMobile) {
    // Main layout container
    const layoutContainer = createStyledElement('div', {
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: theme.spacing.xl,
        margin: `${theme.spacing.lg} auto`,
        alignItems: isMobile ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: isMobile ? theme.spacing.md : theme.spacing.lg
    });

    // Create grid and keyboard in center column
    const centerColumn = createStyledElement('div', {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.lg,
        flex: isMobile ? 'none' : '0 0 auto'
    });

    const solverGrid = createSolverGrid(WORD_LENGTH, ROWS);
    centerColumn.appendChild(solverGrid);
    
    const keyboard = createSolverKeyboardElement(solverGrid, WORD_LENGTH, ROWS);
    centerColumn.appendChild(keyboard);

    // Create hint panels
    const { wordsPanel, lettersPanel } = createSolverHintPanels(isMobile);

    if (isMobile) {
        // Mobile: Stack everything vertically
        layoutContainer.appendChild(centerColumn);
        layoutContainer.appendChild(wordsPanel);
        layoutContainer.appendChild(lettersPanel);
    } else {
        // Desktop: Side panels + center + future panel space
        layoutContainer.appendChild(wordsPanel);
        layoutContainer.appendChild(centerColumn);
        layoutContainer.appendChild(lettersPanel);
    }

    return { container: layoutContainer, grid: solverGrid };
}

export function createSolverHintPanels(isMobile) {
    const panelStyle = {
        background: theme.colors.cardBackground,
        border: `2px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        boxShadow: theme.shadows.lg,
        display: 'flex',
        flexDirection: 'column',
        width: isMobile ? '100%' : '280px',
        maxWidth: isMobile ? '500px' : '280px',
        height: isMobile ? 'auto' : 'fit-content',
        maxHeight: isMobile ? '400px' : '600px'
    };

    // Possible words panel
    const wordsPanel = createStyledElement('div', panelStyle, { id: 'solver-words' });
    
    const wordsHeader = createStyledElement('div', {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottom: `2px solid ${theme.colors.borderLight}`
    });
    wordsHeader.innerHTML = `
        <h3 style="
            margin: 0;
            color: ${theme.colors.primary};
            font-size: ${theme.typography.fontSize.md};
            font-weight: ${theme.typography.fontWeight.semibold};
            display: flex;
            align-items: center;
            gap: 8px;
        ">
            <span style="font-size: 20px;">💡</span>
            Possible Words
        </h3>
    `;
    wordsPanel.appendChild(wordsHeader);
    
    const wordsContent = createStyledElement('div', {
        flex: '1',
        overflowY: 'auto',
        fontSize: theme.typography.fontSize.xs,
        lineHeight: '1.5',
        color: theme.colors.text
    }, {
        id: 'words-content'
    });
    wordsContent.textContent = 'Enter some letters to see suggestions...';
    wordsPanel.appendChild(wordsContent);

    // Letter frequency panel
    const lettersPanel = createStyledElement('div', panelStyle, { id: 'solver-letters' });
    
    const lettersHeader = createStyledElement('div', {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottom: `2px solid ${theme.colors.borderLight}`
    });
    lettersHeader.innerHTML = `
        <h3 style="
            margin: 0;
            color: ${theme.colors.primary};
            font-size: ${theme.typography.fontSize.md};
            font-weight: ${theme.typography.fontWeight.semibold};
            display: flex;
            align-items: center;
            gap: 8px;
        ">
            <span style="font-size: 20px;">🔤</span>
            Best Letters
        </h3>
    `;
    lettersPanel.appendChild(lettersHeader);
    
    const lettersContent = createStyledElement('div', {
        flex: '1',
        overflowY: 'auto',
        fontSize: theme.typography.fontSize.xs,
        lineHeight: '1.4',
        color: theme.colors.text
    }, {
        id: 'letters-content'
    });
    lettersContent.textContent = 'Enter some letters to see frequency...';
    lettersPanel.appendChild(lettersContent);

    return { wordsPanel, lettersPanel };
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
        document.getElementById('words-content').innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: ${theme.colors.textSecondary};
                text-align: center;
                padding: ${theme.spacing.lg};
            ">
                <p style="margin: 0;">✨ Enter some letters to see suggestions...</p>
            </div>
        `;
        document.getElementById('letters-content').innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: ${theme.colors.textSecondary};
                text-align: center;
                padding: ${theme.spacing.lg};
            ">
                <p style="margin: 0;">📊 Letter frequency will appear here...</p>
            </div>
        `;
        return;
    }

    // Get possible words using the solver
    const possibleWords = solveWordle(solverGrid, filledRows, wordSource);
    
    // Update words display
    const wordsContent = document.getElementById('words-content');
    if (possibleWords.length > 0) {
        const displayLimit = 100;
        const wordList = possibleWords.slice(0, displayLimit).join(', ');
        const remaining = possibleWords.length - displayLimit;
        
        wordsContent.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: ${theme.spacing.md};
                padding: ${theme.spacing.sm} ${theme.spacing.md};
                background: ${theme.colors.accentLight};
                border-radius: ${theme.borderRadius.md};
                color: ${theme.colors.primary};
                font-weight: ${theme.typography.fontWeight.semibold};
            ">
                <span style="font-size: 20px;">✓</span>
                <span>${possibleWords.length} possible word${possibleWords.length === 1 ? '' : 's'}</span>
            </div>
            <div style="
                padding: ${theme.spacing.sm};
                line-height: 1.8;
                word-wrap: break-word;
            ">${wordList}${remaining > 0 ? `<span style="color: ${theme.colors.textSecondary}; font-style: italic;"> ... and ${remaining} more</span>` : ''}</div>
        `;
    } else {
        wordsContent.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: ${theme.colors.error};
                text-align: center;
                padding: ${theme.spacing.lg};
                gap: ${theme.spacing.sm};
            ">
                <span style="font-size: 48px;">❌</span>
                <p style="margin: 0; font-weight: ${theme.typography.fontWeight.semibold};">No possible words found</p>
                <p style="margin: 0; font-size: ${theme.typography.fontSize.sm}; color: ${theme.colors.textSecondary};">Double-check your clue colors!</p>
            </div>
        `;
    }
    
    // Update letters display
    const lettersContent = document.getElementById('letters-content');
    if (possibleWords.length > 0) {
        const letterCounts = countMostCommonLetters(possibleWords);
        const sortedLetters = Object.entries(letterCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        lettersContent.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                gap: ${theme.spacing.xs};
            ">
                ${sortedLetters.map(([letter, count], index) => {
                    const percentage = ((count / possibleWords.length) * 100).toFixed(1);
                    const barWidth = percentage;
                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: ${theme.spacing.sm};
                            padding: ${theme.spacing.xs} 0;
                        ">
                            <span style="
                                font-weight: ${theme.typography.fontWeight.bold};
                                font-size: ${theme.typography.fontSize.lg};
                                text-transform: uppercase;
                                width: 24px;
                                text-align: center;
                                color: ${theme.colors.primary};
                            ">${letter}</span>
                            <div style="
                                flex: 1;
                                background: ${theme.colors.borderLight};
                                border-radius: ${theme.borderRadius.sm};
                                height: 24px;
                                position: relative;
                                overflow: hidden;
                            ">
                                <div style="
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    height: 100%;
                                    width: ${barWidth}%;
                                    background: linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
                                    border-radius: ${theme.borderRadius.sm};
                                    transition: width 0.3s ease;
                                "></div>
                                <span style="
                                    position: absolute;
                                    right: 8px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    font-size: ${theme.typography.fontSize.xs};
                                    font-weight: ${theme.typography.fontWeight.semibold};
                                    color: ${parseFloat(barWidth) > 50 ? theme.colors.textLight : theme.colors.text};
                                    z-index: 1;
                                ">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        lettersContent.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: ${theme.colors.textSecondary};
                text-align: center;
                padding: ${theme.spacing.lg};
                gap: ${theme.spacing.sm};
            ">
                <span style="font-size: 48px;">📭</span>
                <p style="margin: 0;">No letters to analyze</p>
            </div>
        `;
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
        margin: '0'
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

export function createSolverKeyboardElement(solverGrid, WORD_LENGTH, ROWS) {
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

    return keyboardContainer;
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
