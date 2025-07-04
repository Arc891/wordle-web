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
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                color: '#333',
                background: '#fff',
                boxSizing: 'border-box'
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

            keyButton.addEventListener('click', () => { simulateKeyPress(key); });
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
        padding: '10px 20px',
        fontSize: '1rem',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'block',
        textAlign: 'center',
        margin: '20px auto 10px auto'
    });
    return btn;
}

export function createHintButton(icon, ariaLabel) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.setAttribute('aria-label', ariaLabel);
    Object.assign(btn.style, {
        fontSize: '1.5rem',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        margin: '8px',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s'
    });
    btn.onmouseenter = () => btn.style.background = '#f0f0f0';
    btn.onmouseleave = () => btn.style.background = '#fff';
    return btn;
}

export function addHintButtons(container, getHints) {
    // Remove old buttons if present
    document.getElementById('hint-btn-row')?.remove();

    const btnRow = document.createElement('div');
    btnRow.id = 'hint-btn-row';
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '32px';
    btnRow.style.margin = '10px auto 0 auto';
    btnRow.style.width = container.style.width || 'max-content';

    // Helper to wrap button and label
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

    // Lightbulb (letters) and question mark (words)
    const lightbulbBtn = createHintButton('💡', 'Show most common letters');
    const questionBtn = createHintButton('❓', 'Show possible words');

    lightbulbBtn.onclick = () => getHints('letters');
    questionBtn.onclick = () => getHints('words');

    btnRow.appendChild(buttonWithLabel(lightbulbBtn, 'Hint'));
    btnRow.appendChild(buttonWithLabel(questionBtn, 'Answers'));

    // Insert after keyboard
    container.parentNode.insertBefore(btnRow, container.nextSibling);
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


export function applyBodyStyles() {
    Object.assign(document.body.style, {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        color: '#333',
        textAlign: 'center',
        padding: '20px'
    });
}