// Register GSAP plugins (REQUIRED for ScrollTrigger)
// Note: GSAP is registered but not strictly used by current animations
gsap.registerPlugin(ScrollTrigger);

// Function to update the glowing background elements positions
function glowEffect(event) {
    const glows = document.querySelectorAll('body::before, body::after');
    const x = event.clientX;
    const y = event.clientY;

    glows.forEach((glow, index) => {
        const moveX = (x / window.innerWidth - 0.5) * 60; 
        const moveY = (y / window.innerHeight - 0.5) * 60; 
        const rotate = (x / window.innerWidth - 0.5) * 10; 

        glow.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
    });
}

// Attach the glow effect to mouse movement (uncomment if you want this feature)
// document.addEventListener('mousemove', glowEffect); 

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


// Scroll Spy for section title (existing logic)
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for updating text

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    // Adjust offset based on desired trigger point for the scroll spy.
    const sectionTop = section.offsetTop - 150; // Change when section is 150px from viewport top
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  if (current && navIndicator) {
    const formattedTitle = current
      .split('-') 
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
      .join(' '); 
      
    navIndicator.textContent = formattedTitle;
  } else if (navIndicator && current === "") {
      // If no specific section is in view (e.g., at the very top of the page), set a default title
      // Check if scroll is near the top and set 'HERO'
      if (window.scrollY < 200 && navIndicator.textContent !== "HERO") { 
          navIndicator.textContent = "HERO";
      }
  }
});


// Initialize all animations when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, 2D services, Tools)
    initIntersectionObserverAnimations(); 
    
    // Trigger a scroll event immediately to set the initial scroll spy title
    window.dispatchEvent(new Event('scroll'));
});
