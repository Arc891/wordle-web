// Load words from a file using fetch (for browser environments)
export async function getWordsFromFile(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    return data.split('\n').map(word => word.trim()).filter(Boolean);
}

// Usage example (allPossibleWords will be a Promise)
export const allPossibleWords = getWordsFromFile('sorted.txt');