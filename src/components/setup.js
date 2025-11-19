export function createGridContainer(WORD_LENGTH, ROWS) {
    const gridContainer = document.createElement('div');
    const squareSize = 50; // px
    const gap = 8; // px
    // Calculate total width: (n squares * size) + (n-1 gaps)
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
            className: 'grid-square',
            textContent: '',
            style: {
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                border: '2px solid #d3d6da',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                color: '#333',
                background: '#fff',
                boxSizing: 'border-box',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease'
            }
        };
        Object.assign(square, { className: squareProperties.className, textContent: squareProperties.textContent });
        Object.assign(square.style, squareProperties.style);
        gridContainer.appendChild(square);
    }

    return gridContainer;
}

export function createKeyboardContainer(WORD_LENGTH) {
    function simulateKeyPress(key) {
        const event = new KeyboardEvent('keydown', { key });
        document.dispatchEvent(event);
    }
    
    const keyboardContainer = document.createElement('div');


    // Define keys in rows to mimic a real keyboard layout
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
        margin: '20px auto',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    };

    const rowStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '6px'
    };

    const buttonStyle = {
        padding: '14px 10px',
        minWidth: '32px',
        textAlign: 'center',
        fontSize: '0.95rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '600',
        color: '#333',
        backgroundColor: '#ffffff',
        border: '1px solid #d3d6da',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        userSelect: 'none'
    };

    Object.assign(keyboardContainer.style, keyboardContainerStyle);

    keyRows.forEach((row) => {
        const rowDiv = document.createElement('div');
        Object.assign(rowDiv.style, rowStyle);

        row.forEach((key) => {
            const keyButton = document.createElement('button');
            keyButton.textContent = key === 'Backspace' ? '⌫' : key;
            keyButton.dataset.key = key;
            Object.assign(keyButton.style, buttonStyle);

            // Make Enter and Backspace wider
            if (key === 'Enter' || key === 'Backspace') {
                keyButton.style.minWidth = '65px';
                keyButton.style.fontSize = key === 'Enter' ? '0.8rem' : '1.1rem';
            }

            // Add press effect function
            function addPressEffect() {
                keyButton.style.transform = 'scale(0.95)';
                keyButton.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
                keyButton.style.backgroundColor = '#e8e8e8';
                
                setTimeout(() => {
                    keyButton.style.transform = 'scale(1)';
                    keyButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    // Only reset background if not colored by game
                    const currentBg = keyButton.style.backgroundColor;
                    if (currentBg === 'rgb(232, 232, 232)' || currentBg === '#e8e8e8') {
                        keyButton.style.backgroundColor = '#ffffff';
                    }
                }, 100);
            }

            // Add hover effects
            keyButton.addEventListener('mouseenter', () => {
                if (!keyButton.style.backgroundColor.includes('rgb(120') && 
                    !keyButton.style.backgroundColor.includes('rgb(202') && 
                    !keyButton.style.backgroundColor.includes('rgb(107')) {
                    keyButton.style.backgroundColor = '#f5f5f5';
                }
            });
            
            keyButton.addEventListener('mouseleave', () => {
                if (!keyButton.style.backgroundColor.includes('rgb(120') && 
                    !keyButton.style.backgroundColor.includes('rgb(202') && 
                    !keyButton.style.backgroundColor.includes('rgb(107')) {
                    keyButton.style.backgroundColor = '#ffffff';
                }
            });

            keyButton.addEventListener('click', () => { 
                addPressEffect();
                simulateKeyPress(key); 
            });

            // Store the press effect function so it can be triggered externally
            keyButton.triggerPressEffect = addPressEffect;

            rowDiv.appendChild(keyButton);
        });

        keyboardContainer.appendChild(rowDiv);
    });

    return keyboardContainer;
}

// Helper to style selection buttons
export function createSelectionButton(text) {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, {
        padding: '12px 24px',
        fontSize: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '600',
        color: '#fff',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
        margin: '20px auto 10px auto',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    });
    
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
    
    return btn;
}

export function createBottomButton(icon, ariaLabel) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.setAttribute('aria-label', ariaLabel);
    Object.assign(btn.style, {
        fontSize: '1.5rem',
        background: '#fff',
        border: '1px solid #d3d6da',
        borderRadius: '50%',
        width: '45px',
        height: '45px',
        margin: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    });
    btn.onmouseenter = () => {
        btn.style.background = '#f5f5f5';
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    };
    btn.onmouseleave = () => {
        btn.style.background = '#fff';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    };
    return btn;
}

function buttonWithLabel(btn, labelText) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.appendChild(btn);

    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.fontSize = '0.85rem';
    label.style.color = '#444';
    label.style.marginTop = '2px';
    wrapper.appendChild(label);

    return wrapper;
}

function createNewBtnRow(container) {    
    const btnRow = document.createElement('div');
    btnRow.id = 'game-btn-row';
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '32px';
    btnRow.style.margin = '10px auto 0 auto';
    btnRow.style.width = container.style.width || 'max-content';

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

    const dropdown = document.createElement('div');
    dropdown.id = id;
    Object.assign(dropdown.style, {
        width: container.offsetWidth ? `${container.offsetWidth}px` : '400px',
        maxWidth: '100%',
        margin: '10px auto',
        background: '#fff',
        border: '1.5px solid #007bff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: '16px 16px 8px 16px',
        position: 'relative',
        zIndex: 100,
        textAlign: 'left',
        fontFamily: 'Arial, sans-serif'
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '12px',
        border: 'none',
        background: 'transparent',
        fontSize: '1.2rem',
        cursor: 'pointer',
        color: '#007bff'
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
    const wordSourceText = document.createElement('p');
    wordSourceText.textContent = `Words: ${wordSource}`;
    const wordSourceStyle = {
        fontSize: '0.8rem',
        color: '#666',
        marginTop: '5px',
        marginBottom: '10px',
        textAlign: 'center',
    };
    Object.assign(wordSourceText.style, wordSourceStyle);
    const gameCard = document.getElementById('game-card');
    if (gameCard) {
        gameCard.appendChild(wordSourceText);
    } else {
        document.body.appendChild(wordSourceText);
    }
}



export function applyBodyStyles() {
    Object.assign(document.body.style, {
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: '#333',
        textAlign: 'center',
        padding: '20px',
        margin: '0'
    });
}

export function createGameCard() {
    const card = document.createElement('div');
    card.id = 'game-card';
    Object.assign(card.style, {
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '30px 20px',
        minHeight: '400px'
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