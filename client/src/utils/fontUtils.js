// Utility functions for font management

export const loadCairoFont = () => {
  // Create a link element for the font
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap&subset=arabic';
  link.rel = 'stylesheet';
  
  // Add the link to the head
  document.head.appendChild(link);
  
  // Add a class to the body when font is loaded
  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  document.head.appendChild(style);
};

// Function to check if Cairo font is loaded
export const isCairoLoaded = () => {
  if (typeof document === 'undefined') return false;
  
  const span = document.createElement('span');
  span.style.fontFamily = 'Cairo';
  span.style.position = 'absolute';
  span.style.visibility = 'hidden';
  span.style.fontSize = '100px';
  span.innerHTML = 'Cairo';
  
  document.body.appendChild(span);
  
  const width1 = span.offsetWidth;
  span.style.fontFamily = 'Arial, sans-serif';
  const width2 = span.offsetWidth;
  
  document.body.removeChild(span);
  
  return width1 !== width2;
};

// Apply font to all elements
export const applyCairoToAll = () => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.id = 'cairo-global-override';
  style.textContent = `
    * {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    
    /* Fix for form elements */
    input, button, select, textarea, optgroup {
      font-family: inherit !important;
    }
    
    /* Fix for RTL */
    [dir='rtl'], [lang='ar'] {
      letter-spacing: 0 !important;
      text-align: right !important;
    }
  `;
  
  // Remove existing style if it exists
  const existingStyle = document.getElementById('cairo-global-override');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(style);
};

// Initialize font loading
export const initFonts = () => {
  if (typeof window !== 'undefined') {
    loadCairoFont();
    
    // Apply font after a short delay to ensure styles are loaded
    setTimeout(() => {
      if (!isCairoLoaded()) {
        console.warn('Cairo font not loaded, applying fallback styles');
        applyCairoToAll();
      }
    }, 1000);
  }
};
