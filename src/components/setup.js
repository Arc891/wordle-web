import { theme, getTheme } from '../styles/theme.js';
import { createStyledElement, stylePatterns, addButtonHoverEffect, addButtonPressEffect } from '../styles/utils.js';

export function createGridContainer(WORD_LENGTH, ROWS) {
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
        margin: '40px auto'
    });

    for (let i = 0; i < WORD_LENGTH * ROWS; i++) {
        const square = createStyledElement('div', {
            ...stylePatterns.gridSquare,
            width: `${squareSize}px`,
            height: `${squareSize}px`
        }, {
            className: 'grid-square',
            textContent: ''
        });
        gridContainer.appendChild(square);
    }

    return gridContainer;
}

export function createKeyboardContainer(WORD_LENGTH) {
    const currentTheme = getTheme();
    
    function simulateKeyPress(key) {
        const event = new KeyboardEvent('keydown', { key });
        document.dispatchEvent(event);
    }
    
    const keyboardContainer = createStyledElement('div', stylePatterns.keyboardContainer);

    // Define keys in rows to mimic a real keyboard layout
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
            keyButton.triggerPressEffect = triggerPress;

            // Add hover effects
            addButtonHoverEffect(keyButton);

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

// Helper to style selection buttons
export function createSelectionButton(text) {
    const btn = createStyledElement('button', {
        ...stylePatterns.primaryButton,
        display: 'block',
        textAlign: 'center',
        margin: `${theme.spacing.lg} auto 10px auto`
    }, {
        textContent: text
    });
    
    addButtonHoverEffect(btn, {
        hoverTransform: 'translateY(-2px)',
        normalTransform: 'translateY(0)',
        hoverShadow: theme.shadows.primaryButtonHover,
        normalShadow: theme.shadows.primaryButton,
        skipColoredButtons: false
    });
    
    return btn;
}

export function createBottomButton(icon, ariaLabel) {
    const btn = createStyledElement('button', {
        ...stylePatterns.iconButton,
        ...stylePatterns.flexCenter,
        margin: theme.spacing.sm,
        transition: `all ${theme.transitions.normal}`
    }, {
        innerHTML: icon,
        'aria-label': ariaLabel
    });
    
    addButtonHoverEffect(btn, {
        hoverTransform: 'translateY(-2px)',
        normalTransform: 'translateY(0)',
        skipColoredButtons: false
    });
    
    return btn;
}

function buttonWithLabel(btn, labelText) {
    const wrapper = createStyledElement('div', {
        ...stylePatterns.flexColumn,
        alignItems: 'center'
    });
    wrapper.appendChild(btn);

    const label = createStyledElement('div', {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
        marginTop: '2px'
    }, {
        textContent: labelText
    });
    wrapper.appendChild(label);

    return wrapper;
}

function createNewBtnRow(container) {    
    const btnRow = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        margin: '10px auto 0 auto',
        width: container.style.width || 'max-content'
    }, {
        id: 'game-btn-row'
    });

    return btnRow;
}

function getGameBtnRow(container) {
    if (document.getElementById('game-btn-row')) {
        return document.getElementById('game-btn-row');
    } else {
        return createNewBtnRow(container);
    }
}

export function addHintButtons(container, getHints) {

    const btnRow = getGameBtnRow(container);
    // Lightbulb (letters) and question mark (words)
    const lightbulbBtn = createBottomButton('💡', 'Show most common letters');
    const questionBtn = createBottomButton('❓', 'Show possible words');

    lightbulbBtn.onclick = () => getHints('letters');
    questionBtn.onclick = () => getHints('words');

    btnRow.appendChild(buttonWithLabel(lightbulbBtn, 'Hint'));
    btnRow.appendChild(buttonWithLabel(questionBtn, 'Answers'));

    // Insert after keyboard
    container.parentNode.insertBefore(btnRow, container.nextSibling);
}

export function addGameButtons(container, func) {
    const btnRow = getGameBtnRow(container);

    const giveUpBtn = createBottomButton('🛑', 'Give up this guess');
    const resetBtn = createBottomButton('🔄', 'Restart game session');

    giveUpBtn.onclick = () => func('give up');
    resetBtn.onclick = () => func('reset');

    btnRow.appendChild(buttonWithLabel(giveUpBtn, 'Give up'));
    btnRow.appendChild(buttonWithLabel(resetBtn, 'Reset'));

    // Insert after keyboard
    container.parentNode.insertBefore(btnRow, container.nextSibling);
}


export function removeGameContent(gridContainer, keyboardContainer) {
    const gameCard = document.getElementById('game-card');
    const searchRoot = gameCard || document.body;
    
    // Remove grid
    if (gridContainer.parentNode) gridContainer.parentNode.removeChild(gridContainer);
    // Remove keyboard
    if (keyboardContainer.parentNode) keyboardContainer.parentNode.removeChild(keyboardContainer);
    // Remove dropdowns
    document.getElementById('dropdown-words')?.remove();
    document.getElementById('dropdown-letters')?.remove();
    // Remove game/hint button rows
    document.getElementById('game-btn-row')?.remove();
    document.getElementById('hint-btn-row')?.remove();
    // Remove restart button if present
    const restartBtn = Array.from(searchRoot.querySelectorAll('button')).find(btn => btn.textContent === 'Restart Game');
    if (restartBtn) restartBtn.remove();
    // Remove word source info
    Array.from(searchRoot.querySelectorAll('p')).forEach(p => {
        if (p.textContent && p.textContent.startsWith('Words:')) p.remove();
    });
}

export function createDropdown(container, content, id) {
    // Remove any existing dropdown with this id
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const dropdown = createStyledElement('div', {
        width: container.offsetWidth ? `${container.offsetWidth}px` : '400px',
        maxWidth: '100%',
        margin: '10px auto',
        background: theme.colors.cardBackground,
        border: `1.5px solid ${theme.colors.primary}`,
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.md,
        padding: `16px 16px 8px 16px`,
        position: 'relative',
        zIndex: 100,
        textAlign: 'left',
        fontFamily: theme.typography.fontFamily
    }, {
        id
    });

    // Close button
    const closeBtn = createStyledElement('button', {
        position: 'absolute',
        top: theme.spacing.sm,
        right: '12px',
        border: 'none',
        background: 'transparent',
        fontSize: theme.typography.fontSize.lg,
        cursor: 'pointer',
        color: theme.colors.primary
    }, {
        textContent: '✕'
    });
    closeBtn.onclick = () => dropdown.remove();

    dropdown.appendChild(closeBtn);
    dropdown.appendChild(content);

    // Insert below the keyboard
    container.parentNode.insertBefore(dropdown, container.nextSibling);
    return dropdown;
}

export function addWordSourceBelowTitle(wordSource) {
    // Append small text below h1 to show word source
    const wordSourceText = createStyledElement('p', {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
        textAlign: 'center'
    }, {
        textContent: `Words: ${wordSource}`
    });
    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(wordSourceText);
    } else {
        document.body.appendChild(wordSourceText);
    }
}



export function applyBodyStyles() {
    Object.assign(document.body.style, {
        fontFamily: theme.typography.fontFamily,
        background: theme.colors.background,
        minHeight: '100vh',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        padding: theme.spacing.lg,
        margin: '0'
    });
}

export function createGameCard() {
    const card = createStyledElement('div', {
        ...stylePatterns.card,
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '400px'
    }, {
        id: 'game-card'
    });
    return card;
}

export function ensureGameCard() {
    let card = document.getElementById('game-card');
    if (!card) {
        card = createGameCard();
        document.body.appendChild(card);
    }
    return card;
}