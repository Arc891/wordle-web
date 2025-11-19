import { addLetterToSquare, checkGuess, showWordIsInvalid, getHints } from './game-logic.js';
import { addRestartButton, giveUp, resetGame, handleGiveUpOrReset } from '../components/ui-handlers.js';
import { saveGameState } from '../state/game-state.js';
import { 
    addWordSourceBelowTitle, 
    addHintButtons, 
    addGameButtons, 
    createSelectionButton, 
    removeGameContent 
} from '../components/setup.js';
import { clearGrid, encodeWord, mapWordSourceToWords } from '../utils.js';

export function createPlayerInputHandler(
    gameStateRef,
    gridContainer, 
    keyboardContainer, 
    WORD_LENGTH,
    ROWS,
    updateGameState
) {
    return function playGameHandler(event) {
        // Trigger visual effect on keyboard button
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            const keyButton = keyboardContainer.querySelector(`button[data-key="${event.key.toUpperCase()}"]`);
            if (keyButton && keyButton.triggerPressEffect) {
                keyButton.triggerPressEffect();
            }
        } else if (event.key === 'Backspace' || event.key === 'Enter') {
            const keyButton = keyboardContainer.querySelector(`button[data-key="${event.key}"]`);
            if (keyButton && keyButton.triggerPressEffect) {
                keyButton.triggerPressEffect();
            }
        }
        
        const { word, currentRow, currentCol, wordsToUse, gameDone } = gameStateRef();
        
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/) && currentCol < WORD_LENGTH) {
            addLetterToSquare(event.key, currentRow, currentCol, gridContainer, WORD_LENGTH);
            updateGameState({ currentCol: currentCol + 1 });
        } else if (event.key === 'Backspace' && currentCol > 0) {
            const newCol = currentCol - 1;
            addLetterToSquare('', currentRow, newCol, gridContainer, WORD_LENGTH);
            updateGameState({ currentCol: newCol });
        } else if (event.key === 'Enter' && !gameDone) {
            updateGameState({ playGameHandlerActive: false });
            document.removeEventListener('keydown', playGameHandler);
            
            const guess = Array.from({ length: WORD_LENGTH }, (_, i) => 
                gridContainer.children[currentRow * WORD_LENGTH + i].textContent
            );

            if (currentCol < WORD_LENGTH || !wordsToUse.includes(guess.join(''))) {
                showWordIsInvalid(currentRow, gridContainer, WORD_LENGTH);
                updateGameState({ playGameHandlerActive: true });
                document.addEventListener('keydown', playGameHandler);
                return;
            }

            checkGuess(guess, word, currentRow, gridContainer, keyboardContainer, WORD_LENGTH).then(() => {
                const { wordSource } = gameStateRef();
                
                if (guess.join('') === word) {
                    alert('Congratulations! You guessed the word!');
                    addRestartButton(keyboardContainer, () => {
                        clearGrid(gridContainer, keyboardContainer);
                        localStorage.removeItem('wordleGameState');
                        // Remove the current game handler first
                        document.removeEventListener('keydown', playGameHandler);
                        
                        // Get current state before clearing it
                        const currentState = gameStateRef();
                        
                        // Clear the word from state to force a new word selection
                        updateGameState({ 
                            word: '',
                            currentRow: 0, 
                            currentCol: 0, 
                            gameDone: false,
                            playGameHandlerActive: false 
                        });
                        
                        // Start a new game with a new word using preserved state values
                        playerInput(false, 0, gridContainer, keyboardContainer, 
                            currentState.wordsToGuess, currentState.wordsToUse, 
                            currentState.wordSource, WORD_LENGTH, ROWS, 
                            updateGameState.gameState, updateGameState);
                    });
                    updateGameState({ 
                        currentRow: currentRow + 1, 
                        gameDone: true 
                    });
                }
                else if (currentRow === ROWS - 1) {
                    alert(`Game Over! The word was: ${word}`);
                    addRestartButton(keyboardContainer, () => {
                        clearGrid(gridContainer, keyboardContainer);
                        localStorage.removeItem('wordleGameState');
                        // Remove the current game handler first
                        document.removeEventListener('keydown', playGameHandler);
                        
                        // Get current state before clearing it
                        const currentState = gameStateRef();
                        
                        // Clear the word from state to force a new word selection
                        updateGameState({ 
                            word: '',
                            currentRow: 0, 
                            currentCol: 0, 
                            gameDone: false,
                            playGameHandlerActive: false 
                        });
                        
                        // Start a new game with a new word using preserved state values
                        playerInput(false, 0, gridContainer, keyboardContainer, 
                            currentState.wordsToGuess, currentState.wordsToUse, 
                            currentState.wordSource, WORD_LENGTH, ROWS, 
                            updateGameState.gameState, updateGameState);
                    });
                    updateGameState({ gameDone: true });
                }
                else {
                    console.debug(`Current guess: ${guess.join('')}, Target word: ${word}`);
                    const newRow = currentRow + 1;
                    updateGameState({ 
                        currentRow: newRow, 
                        currentCol: 0,
                        playGameHandlerActive: true 
                    });
                    document.addEventListener('keydown', playGameHandler);
                }

                const currentState = gameStateRef();
                saveGameState(
                    currentState.word, 
                    currentState.currentRow, 
                    currentState.currentCol, 
                    gridContainer, 
                    wordSource, 
                    currentState.gameDone, 
                    WORD_LENGTH
                );
            });
        }
    };
}

export function startGame(
    gridContainer, 
    keyboardContainer, 
    wordSource, 
    wordsToGuess, 
    wordsToUse, 
    clear = true, 
    useURLWord = false,
    WORD_LENGTH,
    ROWS,
    gameState,
    updateGameState
) {
    const gameCard = document.getElementById('game-card');
    addWordSourceBelowTitle(wordSource);
    gameCard.appendChild(gridContainer);
    gameCard.appendChild(keyboardContainer);
    
    addHintButtons(keyboardContainer, (type) => {
        const currentState = updateGameState.gameState;
        getHints(type, gridContainer, currentState.currentRow, currentState.wordSource, keyboardContainer);
    });
    
    addGameButtons(keyboardContainer, (type) => {
        const currentState = updateGameState.gameState;
        handleGiveUpOrReset(
            type, 
            currentState.playGameHandlerActive,
            () => resetGame(gridContainer, keyboardContainer, () => 
                showWordSetSelection(gridContainer, keyboardContainer, WORD_LENGTH, ROWS, updateGameState)
            ),
            () => giveUp(
                currentState.word, 
                currentState.gameDone, 
                currentState.playGameHandler, 
                gridContainer, 
                keyboardContainer, 
                (useURL, startRow) => {
                    // Clear the word state to force new word selection
                    updateGameState({ word: '' });
                    playerInput(
                        useURL, startRow, gridContainer, keyboardContainer, 
                        currentState.wordsToGuess, currentState.wordsToUse, currentState.wordSource, 
                        WORD_LENGTH, ROWS, updateGameState.gameState, updateGameState
                    );
                }
            )
        );
    });

    if (clear) {
        console.log("Clear is true, clearing...");
        clearGrid(gridContainer, keyboardContainer);
    }

    let startRow = 0;
    if (localStorage.getItem('wordleGameState')) {
        const savedState = JSON.parse(localStorage.getItem('wordleGameState'));
        startRow = savedState.state.currentRow;
        console.debug(`Resuming game from row ${startRow}`);
    }

    playerInput(useURLWord, startRow, gridContainer, keyboardContainer, 
        wordsToGuess, wordsToUse, wordSource, WORD_LENGTH, ROWS, gameState, updateGameState);
}

export function playerInput(
    useURLWord = false, 
    startRow = 0, 
    gridContainer, 
    keyboardContainer, 
    wordsToGuess, 
    wordsToUse, 
    wordSource,
    WORD_LENGTH,
    ROWS,
    gameState,
    updateGameState
) {
    let currentRow = startRow;
    let currentCol = 0;
    let gameDone = false;
    let word = gameState.word;
    
    console.log(`Starting game from row ${currentRow}, column ${currentCol}`);
    
    // Ensure we have valid word arrays
    if (!wordsToGuess || !wordsToUse) {
        console.error('Missing word arrays, cannot start game');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    if (!useURLWord) {
        // Pick a random word when not using URL word (including restarts)
        word = wordsToGuess[Math.floor(Math.random() * wordsToGuess.length)];
        // Update the URL for sharing (encode)
        params.set('gid', encodeWord(word));
        params.set('ws', wordSource);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        console.log(`New word selected: ${word}`);
    } else if (!word) {
        // If using URL word but no word in state, this shouldn't happen but let's handle it
        console.warn('URL word expected but no word found in state');
        word = wordsToGuess[Math.floor(Math.random() * wordsToGuess.length)];
        params.set('gid', encodeWord(word));
        params.set('ws', wordSource);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }

    updateGameState({ 
        word, 
        currentRow, 
        currentCol, 
        gameDone, 
        wordSource,
        wordsToGuess,
        wordsToUse
    });

    if (gameState.playGameHandler) {
        document.removeEventListener('keydown', gameState.playGameHandler);
    }

    console.debug(`The word to guess is: ${word}`); // For debugging purposes

    // Create a getter function for current state
    const getGameState = () => ({
        word: updateGameState.gameState.word,
        currentRow: updateGameState.gameState.currentRow,
        currentCol: updateGameState.gameState.currentCol,
        wordsToUse: updateGameState.gameState.wordsToUse,
        wordsToGuess: updateGameState.gameState.wordsToGuess,
        gameDone: updateGameState.gameState.gameDone,
        wordSource: updateGameState.gameState.wordSource
    });

    const playGameHandler = createPlayerInputHandler(
        getGameState,
        gridContainer, 
        keyboardContainer, 
        WORD_LENGTH, 
        ROWS, 
        updateGameState
    );
    
    updateGameState({ playGameHandler, playGameHandlerActive: true });
    document.addEventListener('keydown', playGameHandler);
}

export function showWordSetSelection(gridContainer, keyboardContainer, WORD_LENGTH, ROWS, updateGameState) {
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.marginTop = '40px';

    const info = document.createElement('div');
    info.textContent = 'Choose your word set:';
    info.style.fontSize = '1.2rem';
    info.style.marginBottom = '20px';
    container.appendChild(info);

    const btnCommon = createSelectionButton('Common Words');
    const btnPrev = createSelectionButton('Previous Words');
    const btnAll = createSelectionButton('All Words');

    btnCommon.onclick = () => {
        const wordSource = 'common';
        const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        if (container.parentNode) container.parentNode.removeChild(container);
        updateGameState({ wordSource, wordsToGuess, wordsToUse });
        startGame(gridContainer, keyboardContainer, wordSource, wordsToGuess, wordsToUse, 
            true, false, WORD_LENGTH, ROWS, updateGameState.gameState, updateGameState);
    };

    btnPrev.onclick = () => {
        const wordSource = 'previous';
        const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        if (container.parentNode) container.parentNode.removeChild(container);
        updateGameState({ wordSource, wordsToGuess, wordsToUse });
        startGame(gridContainer, keyboardContainer, wordSource, wordsToGuess, wordsToUse, 
            true, false, WORD_LENGTH, ROWS, updateGameState.gameState, updateGameState);
    };

    btnAll.onclick = () => {
        const wordSource = 'all';
        const [wordsToGuess, wordsToUse] = mapWordSourceToWords(wordSource);
        if (container.parentNode) container.parentNode.removeChild(container);
        updateGameState({ wordSource, wordsToGuess, wordsToUse });
        startGame(gridContainer, keyboardContainer, wordSource, wordsToGuess, wordsToUse, 
            true, false, WORD_LENGTH, ROWS, updateGameState.gameState, updateGameState);
    };

    container.appendChild(btnCommon);
    container.appendChild(btnPrev);
    container.appendChild(btnAll);
    const gameCard = document.getElementById('game-card');
    gameCard.appendChild(container);
}
