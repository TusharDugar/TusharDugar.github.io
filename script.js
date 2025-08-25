// script.js
// Global constants for animation timing
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a flip
const SCROLL_DEBOUNCE_TIME_MS = 50; // Prevent rapid-fire wheel events from stacking

// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const valueElement = button.querySelector('.button-value');
    const value = valueElement ? valueElement.textContent.trim() : ''; // Trim whitespace

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
                // Fallback for older browsers or if clipboard API fails (e.g., execCommand)
                const textarea = document.createElement('textarea');
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.classList.remove('copied');
                    }, 2000);
                } catch (ex) {
                    console.error('Failed to copy using execCommand: ', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            });
    }
}

// Unified Function to reveal elements on scroll (for 2D animations)
function initIntersectionObserverAnimations() {
  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }

        // Handle reveal-item (single item reveal like headers, individual cards)
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        // Handle reveal-parent (for About section staggered children, and now Services section)
        else if (entry.target.classList.contains("reveal-parent")) {
          // Select immediate reveal-child elements within this parent
          const children = entry.target.querySelectorAll(":scope > .reveal-child"); 
          // If no direct .reveal-child, then check for a specific staggered container within
          if (children.length === 0) {
              const staggerContainer = entry.target.querySelector(".reveal-stagger-container");
              if (staggerContainer) {
                  const staggerChildren = staggerContainer.querySelectorAll(".reveal-stagger");
                  staggerChildren.forEach((child, index) => {
                      setTimeout(() => {
                          child.classList.add("visible");
                      }, index * 100); // Apply stagger delay (100ms)
                  });
              }
          } else {
              children.forEach((child, index) => {
                setTimeout(() => {
                  child.classList.add("visible");
                }, index * 100); // Apply stagger delay (100ms)
              });
          }
        }
        // Handle reveal-stagger-container (for staggered children like Tools and Contact buttons)
        else if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("visible");
            }, index * 100); // Apply stagger delay (100ms)
          });
        }
        
        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  // Observe all types of animated containers/items
  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => observer.observe(el));
}


// Scroll Spy for section title (REMOVED TEXT CHANGE LOGIC)
const sections = document.querySelectorAll("section[id], footer[id]");
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for your name

window.addEventListener("scroll", () => {
  let current = ""; 
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });
});


// Mouse Follower Glow (implementation)
document.addEventListener('DOMContentLoaded', () => {
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            mouseFollowerGlow.style.transform = `translate(-50%, -50%) translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        });
    }

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Services, Tools, and other reveal-items)
    initIntersectionObserverAnimations();

    window.dispatchEvent(new Event('scroll'));

    // --- REMOVED: Services Section 3D Cube Animation Logic ---
    // All JavaScript related to the 3D cube animation (animateCube, setupCubeFaces,
    // calculateFaceOffset, updateFaceOpacityAndVisibility, and all associated
    // wheel/touch event listeners) has been removed from this script.js file.
    // The "My Services" section now uses the 2D IntersectionObserver-based
    // stagger reveal animation implemented via initIntersectionObserverAnimations().
});
