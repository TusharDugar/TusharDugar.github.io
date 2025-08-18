// GSAP library is no longer used for animations, its registration is removed.

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
    ".reveal-item, .reveal-stagger, .about-heading-animation, .about-content-animation, .services-items-container .service-item, .tool-card" 
  );

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible"); 

        // Specific stagger logic for .reveal-stagger-container (like footer buttons)
        if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.classList.add("visible"); 
          });
        }
        // Specific stagger logic for .about-content-wrapper (like paragraphs/blockquote)
        if (entry.target.classList.contains("about-content-wrapper")) {
            const children = entry.target.querySelectorAll(".about-content-animation");
            children.forEach((child, index) => {
                // CSS nth-child already handles stagger delay, but this ensures it's applied.
                child.classList.add("visible"); 
            });
        }
        // No explicit JS stagger needed for .services-items-container .service-item or .tool-card, as CSS nth-child / their own transitions handle it.

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}


// Scroll Spy for section title (REMOVED TEXT CHANGE LOGIC)
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for your name

window.addEventListener("scroll", () => {
  // This function now only exists to trigger other events if needed, 
  // but it no longer changes navIndicator.textContent.
  // The navIndicator will retain its original HTML text ("Tushar Dugar").
  
  // You can still use 'current' for other purposes if you re-introduce navigation highlights, etc.
  let current = "";
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150; 
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  // REMOVED: navIndicator.textContent = formattedTitle;
  // REMOVED: else if (navIndicator && current === "") { ... }
  // This ensures the h3 tag in left-column-sticky always shows "Tushar Dugar"
});


// Mouse Follower Glow (implementation)
document.addEventListener('DOMContentLoaded', () => {
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) { // Ensure the element exists before attaching listener
        document.addEventListener('mousemove', (event) => {
            // Use translate3d for hardware acceleration, good for performance
            mouseFollowerGlow.style.transform = `translate(-50%, -50%) translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        });
    }

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, 2D services, Tools)
    initIntersectionObserverAnimations(); 
    
    // Trigger a scroll event immediately to set the initial scroll spy title (though not visible now)
    window.dispatchEvent(new Event('scroll'));
});
