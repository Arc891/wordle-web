// Central theme configuration for the Wordle app
export const theme = {
    colors: {
        // Primary colors
        primary: '#667eea',
        primaryDark: '#764ba2',
        
        // UI colors
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        cardBackground: '#ffffff',
        keyboardBackground: '#f8f9fa',
        
        // Text colors
        textPrimary: '#333',
        textSecondary: '#666',
        textLight: '#fff',
        
        // Border colors
        borderLight: '#d3d6da',
        borderMedium: '#ccc',
        
        // Letter status colors
        absent: '#787c7e',
        present: '#cab458',
        correct: '#6baa64',
        
        // Button colors
        buttonDefault: '#ffffff',
        buttonHover: '#f5f5f5',
        buttonActive: '#e8e8e8',
        
        // Accent colors
        info: '#e3f2fd',
        infoBorder: '#2196f3',
        error: 'red'
    },
    
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '15px',
        lg: '20px',
        xl: '30px',
        xxl: '40px'
    },
    
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
        round: '50%'
    },
    
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
        md: '0 2px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
        xl: '0 20px 60px rgba(0, 0, 0, 0.3)',
        button: '0 2px 4px rgba(0, 0, 0, 0.1)',
        buttonHover: '0 4px 8px rgba(0, 0, 0, 0.15)',
        buttonActive: '0 1px 2px rgba(0, 0, 0, 0.2)',
        primaryButton: '0 4px 12px rgba(102, 126, 234, 0.4)',
        primaryButtonHover: '0 6px 16px rgba(102, 126, 234, 0.5)'
    },
    
    typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
            xs: '0.8rem',
            sm: '0.85rem',
            md: '0.95rem',
            base: '1rem',
            lg: '1.2rem',
            xl: '1.5rem',
            xxl: '1.8rem',
            title: '2.5rem'
        },
        fontWeight: {
            normal: '400',
            medium: '600',
            bold: 'bold'
        }
    },
    
    grid: {
        squareSize: 50,
        gap: 8,
        fontSize: '1.8rem',
        border: '2px'
    },
    
    keyboard: {
        buttonMinWidth: '32px',
        buttonPadding: '14px 10px',
        specialButtonMinWidth: '65px',
        gap: '6px',
        rowGap: '8px'
    },
    
    transitions: {
        fast: '0.1s ease',
        normal: '0.2s ease',
        slow: '0.3s ease'
    },
    
    breakpoints: {
        mobile: '768px',
        tablet: '1024px'
    }
};

// Mobile-specific overrides
export const mobileTheme = {
    grid: {
        squareSize: 60,
        gap: 10,
        fontSize: '1.8rem'
    },
    keyboard: {
        buttonMinWidth: '36px',
        buttonPadding: '16px 12px'
    }
};

// Helper function to check if device is mobile
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= parseInt(theme.breakpoints.mobile);
}

// Helper to merge mobile theme
export function getTheme() {
    if (isMobile()) {
        return {
            ...theme,
            grid: { ...theme.grid, ...mobileTheme.grid },
            keyboard: { ...theme.keyboard, ...mobileTheme.keyboard }
        };
    }
    return theme;
}
