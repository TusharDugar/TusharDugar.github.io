// Global constants for animation timing
const ANIMATION_DURATION = 1200; // 1.2s in milliseconds
const ROTATE_INCREMENT = 90; // Degrees per transition step (for a cube-like rotation)

// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const valueElement = button.querySelector('.button-value');
    const value = valueElement ? valueElement.textContent : '';

    if (value) {
        navigator.clipboard.writeText(value)
            .then(() => {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 2000); // Reset after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
}

// Unified Function to reveal elements on scroll (for 2D animations)
function initIntersectionObserverAnimations() {
  const revealElements = document.querySelectorAll(
    // Select all elements that should animate using CSS transitions triggered by IntersectionObserver
    ".reveal-item, .reveal-stagger-container, .reveal-stagger" 
  );

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Handle stagger container
        if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.classList.add("visible"); 
          });
        }
        // Handle regular reveal items
        else if (entry.target.classList.contains("reveal-item") || 
                entry.target.classList.contains("reveal-stagger")) {
          entry.target.classList.add("visible"); 
        }

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    // Cube rotation logic
    const cube = document.getElementById('services-cube');
    if (!cube) return; // Exit if element doesn't exist
    
    let currentRotation = 0;
    let isScrolling = false;
    let lastScrollTop = 0;
    const rotationIncrement = 45; // 45° per step

    // Initialize cube position
    cube.style.transform = 'rotateY(0deg)';

    window.addEventListener('scroll', () => {
        if (isScrolling) return;
        
        const st = window.scrollY;
        const direction = st > lastScrollTop ? 1 : -1;
        lastScrollTop = st;

        // Check if in viewport with proper offset
        const rect = cube.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.top < viewportHeight * 0.8 && rect.bottom > viewportHeight * 0.2) {
            isScrolling = true;
            
            // Update rotation with limits
            currentRotation = Math.max(0, Math.min(360, currentRotation + direction * rotationIncrement));
            cube.style.transform = `rotateY(${currentRotation}deg)`;
            
            setTimeout(() => { isScrolling = false; }, 300);
        }
    });

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Tools, and other reveal-items)
    initIntersectionObserverAnimations();

    // Trigger a scroll event immediately to set the initial scroll spy title (though not visible now)
    window.dispatchEvent(new Event('scroll'));
});
