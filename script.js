// Function to update the glowing background elements positions
function glowEffect(event) {
    const glows = document.querySelectorAll('body::before, body::after');
    const x = event.clientX;
    const y = event.clientY;

    glows.forEach((glow, index) => {
        // Adjust these values to control how much the glows move with the mouse
        const moveX = (x / window.innerWidth - 0.5) * 60; // Max 60px movement
        const moveY = (y / window.innerHeight - 0.5) * 60; // Max 60px movement

        // Apply a subtle rotation for a dynamic feel
        const rotate = (x / window.innerWidth - 0.5) * 10; // Max 10deg rotation

        // Ensure these transformations are compatible with existing CSS animations
        // Best to only apply transforms that don't conflict, or use GSAP if complex
        glow.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
    });
}

// Attach the glow effect to mouse movement
// document.addEventListener('mousemove', glowEffect); // Re-enable if you want mouse tracking glow

// Initialize sticky header offsets (if any) - This might be a remnant from a previous design.
// If your design changed, these might not be relevant anymore.
function setStickyOffsets() {
    const servicesH2 = document.querySelector('.services-section .services-heading');
    const servicesWrapper = document.querySelector('.services-content-wrapper');
    if (servicesH2) {
        document.documentElement.style.setProperty('--services-sticky-top-h2', `${servicesH2.offsetTop}px`);
    }
    if (servicesWrapper) {
        document.documentElement.style.setProperty('--services-sticky-top-wrapper', `${servicesWrapper.offsetTop}px`);
    }
}
// window.addEventListener('resize', setStickyOffsets);
// window.addEventListener('load', setStickyOffsets);


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

// Add event listeners for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initial call for unified scroll animations
    initScrollAnimations(); 
    
    // Initial call to set the correct section title on page load/refresh
    // Trigger a scroll event immediately to set the initial section.
    window.dispatchEvent(new Event('scroll'));
});


// Unified Function to reveal elements on scroll (MODIFIED TO INCLUDE NEW CLASSES AND USE 'visible')
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(
    // Original selectors + added .service-item and .tool-card
    ".reveal-item, .reveal-stagger, .reveal-child, .service-item, .tool-card" 
  );

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add the 'visible' class as specified in the new CSS
        entry.target.classList.add("visible"); 

        // Existing logic for stagger containers (keeping this for compatibility with your existing HTML structure)
        if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.classList.add("visible"); // Changed to 'visible'
          });
        }
        // Existing logic for About left content (keeping this for compatibility with your existing HTML structure)
        if (entry.target.classList.contains("about-left-content")) {
            const children = entry.target.querySelectorAll(".reveal-child");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add("visible"); // Changed to 'visible'
            });
        }
        // No special stagger logic needed for .service-item here because CSS nth-child handles it

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}


// Scroll Spy for section title (ADDED NEW FUNCTIONALITY)
// Selects sections and footer with an ID. Ensure your HTML elements have these IDs!
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for updating text

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    // Adjust offset based on desired trigger point for the scroll spy.
    // -150px means it changes when the section is 150px from the top of the viewport.
    const sectionTop = section.offsetTop - 150; 
    
    // Check if the current scroll position is past the top of the section
    // and if it's within the section's height.
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  // If a current section is detected and the target element exists
  if (current && navIndicator) {
    // Format the section ID for display (e.g., "my-services" -> "My Services")
    const formattedTitle = current
      .split('-') // Split by hyphen
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' '); // Join back with spaces
      
    navIndicator.textContent = formattedTitle;
  } else if (navIndicator && current === "") {
      // Optional: If no specific section is in view (e.g., at the very top of the page),
      // set a default title (e.g., "HERO" for the very first section).
      if (window.scrollY < 100 && navIndicator.textContent !== "HERO") { // Adjust 100px threshold as needed
          navIndicator.textContent = "HERO";
      }
  }
});
