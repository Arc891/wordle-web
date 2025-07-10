# Wordle Project Structure

## Overview
This project has been restructured for better maintainability and separation of concerns.

## File Organization

```
src/
├── index.js                     # Main entry point with global state and initialization
├── utils.js                     # Utility functions and constants
│
├── components/                  # UI Components and Setup
│   ├── setup.js                 # Grid, keyboard, and UI element creation
│   └── ui-handlers.js           # UI event handlers (restart, give up, reset, solver unlock)
│
├── game/                        # Core Game Logic
│   ├── game-logic.js            # Core game mechanics (letter placement, guess checking)
│   └── game-controller.js       # Game flow control and player input handling
│
├── state/                       # State Management
│   └── game-state.js            # Save/load/restore game state functionality
│
├── solver/                      # Solver Mode
│   ├── solver-mode.js           # Solver mode UI and input handling
│   └── solve-wordle.js          # Wordle solving algorithm
│
└── data/                        # Data Files
    └── words/                   # Word lists
        ├── all-words.js
        ├── common-words.js
        └── previous-wordle-words.js
```
