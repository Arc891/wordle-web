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