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


export function applyBodyStyles() {
    Object.assign(document.body.style, {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        color: '#333',
        textAlign: 'center',
        padding: '20px'
    });
}