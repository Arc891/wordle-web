// Utility functions for creating styled elements
import { theme } from './theme.js';

// Apply multiple style properties at once
export function applyStyles(element, styles) {
    Object.assign(element.style, styles);
}

// Create a styled element
export function createStyledElement(tag, styles, attributes = {}) {
    const element = document.createElement(tag);
    
    if (styles) {
        applyStyles(element, styles);
    }
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent' || key === 'innerHTML') {
            element[key] = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

// Common style patterns
export const stylePatterns = {
    flexCenter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    
    flexColumn: {
        display: 'flex',
        flexDirection: 'column'
    },
    
    card: {
        background: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.xl,
        boxShadow: theme.shadows.xl,
        padding: `${theme.spacing.xl} ${theme.spacing.lg}`
    },
    
    button: {
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeight.medium,
        border: 'none',
        cursor: 'pointer',
        transition: `all ${theme.transitions.normal}`,
        userSelect: 'none'
    },
    
    primaryButton: {
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
        color: theme.colors.textLight,
        padding: '12px 24px',
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.primaryButton,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium
    },
    
    iconButton: {
        background: theme.colors.buttonDefault,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.borderRadius.round,
        width: '45px',
        height: '45px',
        boxShadow: theme.shadows.md,
        fontSize: theme.typography.fontSize.xl
    },
    
    keyboardContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.keyboard.rowGap,
        width: 'max-content',
        margin: `${theme.spacing.lg} auto`,
        padding: theme.spacing.md,
        background: theme.colors.keyboardBackground,
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.lg
    },
    
    keyboardButton: {
        padding: theme.keyboard.buttonPadding,
        minWidth: theme.keyboard.buttonMinWidth,
        textAlign: 'center',
        fontSize: theme.typography.fontSize.md,
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.buttonDefault,
        border: `1px solid ${theme.colors.borderLight}`,
        cursor: 'pointer',
        transition: `all ${theme.transitions.fast}`,
        borderRadius: theme.borderRadius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: theme.shadows.button,
        userSelect: 'none'
    },
    
    gridSquare: {
        border: `${theme.grid.border} solid ${theme.colors.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: theme.grid.fontSize,
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        background: theme.colors.buttonDefault,
        boxSizing: 'border-box',
        borderRadius: theme.borderRadius.sm,
        boxShadow: theme.shadows.button,
        transition: `transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`
    }
};

// Add hover effect to button
export function addButtonHoverEffect(button, options = {}) {
    const {
        hoverBg = theme.colors.buttonHover,
        normalBg = theme.colors.buttonDefault,
        hoverTransform = 'translateY(-2px)',
        normalTransform = 'translateY(0)',
        hoverShadow = theme.shadows.buttonHover,
        normalShadow = theme.shadows.md,
        skipColoredButtons = true
    } = options;
    
    button.addEventListener('mouseenter', () => {
        if (skipColoredButtons) {
            const bg = button.style.backgroundColor;
            // Check for Wordle game colors (absent, present, correct)
            if (bg && (bg.includes('rgb(120') || bg.includes('rgb(202') || bg.includes('rgb(107') || 
                       bg.includes('#787c7e') || bg.includes('#cab458') || bg.includes('#6baa64'))) {
                return; // Skip if button has game colors
            }
        }
        button.style.backgroundColor = hoverBg;
        button.style.transform = hoverTransform;
        button.style.boxShadow = hoverShadow;
    });
    
    button.addEventListener('mouseleave', () => {
        if (skipColoredButtons) {
            const bg = button.style.backgroundColor;
            // Check for Wordle game colors (absent, present, correct) and white
            if (bg && (bg.includes('rgb(120') || bg.includes('rgb(202') || bg.includes('rgb(107') || 
                       bg.includes('#787c7e') || bg.includes('#cab458') || bg.includes('#6baa64') ||
                       bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === 'white')) {
                return;
            }
        }
        button.style.backgroundColor = normalBg;
        button.style.transform = normalTransform;
        button.style.boxShadow = normalShadow;
    });
}

// Add press effect to button
export function addButtonPressEffect(button, duration = 100) {
    return function triggerPress() {
        const originalBg = button.style.backgroundColor;
        const isGameColor = originalBg && (originalBg.includes('rgb(120') || originalBg.includes('rgb(202') || 
                            originalBg.includes('rgb(107') || originalBg.includes('#787c7e') || 
                            originalBg.includes('#cab458') || originalBg.includes('#6baa64'));
        
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = theme.shadows.buttonActive;
        
        // Only change background color if it's not a game color
        if (!isGameColor) {
            button.style.backgroundColor = theme.colors.buttonActive;
        }
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = theme.shadows.button;
            
            // Only reset background if we changed it (not a game color)
            if (!isGameColor) {
                const currentBg = button.style.backgroundColor;
                if (currentBg === 'rgb(232, 232, 232)' || currentBg === theme.colors.buttonActive) {
                    button.style.backgroundColor = theme.colors.buttonDefault;
                }
            }
        }, duration);
    };
}

// Responsive helper
export function addResponsiveStyles(element, mobileStyles, desktopStyles) {
    const mediaQuery = window.matchMedia(`(max-width: ${theme.breakpoints.mobile})`);
    
    function updateStyles() {
        if (mediaQuery.matches) {
            applyStyles(element, mobileStyles);
        } else {
            applyStyles(element, desktopStyles);
        }
    }
    
    updateStyles();
    mediaQuery.addListener(updateStyles);
    
    return () => mediaQuery.removeListener(updateStyles);
}
