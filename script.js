// All GSAP and ScrollTrigger code has been removed as per the decision to use plain JS/CSS animations.

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


// Unified Function to reveal elements on scroll using IntersectionObserver
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(
    // Select all elements that should animate using CSS transitions triggered by IntersectionObserver
    ".reveal-item, .reveal-stagger, .about-heading-animation, .about-content-animation, .service-item, .tool-card" 
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

        // Specific stagger logic for .profile-card-wrapper (about left content)
        if (entry.target.classList.contains("profile-card-wrapper")) { 
            const children = entry.target.querySelectorAll(".reveal-child");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add("visible"); 
            });
        }
        // Specific stagger logic for .contact-buttons (footer buttons)
        else if (entry.target.classList.contains("contact-buttons")) { 
            const children = entry.target.querySelectorAll(".contact-button"); 
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add("visible"); 
            });
        }
        // Specific stagger for .about-content-wrapper (paragraphs/blockquote in about right)
        else if (entry.target.classList.contains("about-content-wrapper")) {
            const children = entry.target.querySelectorAll(".about-content-animation");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.2}s`; // Add a delay for content items
                child.classList.add("visible"); 
            });
        }
        // Specific stagger for .services-items-container (for the 8 service cards)
        else if (entry.target.classList.contains("services-items-container")) {
            const children = entry.target.querySelectorAll(".service-item");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`; // Use CSS nth-child if that's preferred, or this
                child.classList.add("visible");
            });
        }
        // No explicit JS stagger needed for .tool-card, as CSS transition and IO will handle it.

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  // Observe all elements selected, including containers for staggering
  revealElements.forEach(el => observer.observe(el));
  
  // Explicitly observe containers that manage staggered children, if not covered by a reveal-item itself
  const aboutWrapper = document.querySelector('.profile-card-wrapper');
  if (aboutWrapper) observer.observe(aboutWrapper);

  const footerButtonsContainer = document.querySelector('.contact-buttons');
  if (footerButtonsContainer) observer.observe(footerButtonsContainer);

  const servicesItemsContainer = document.querySelector('.services-items-container');
  if (servicesItemsContainer) observer.observe(servicesItemsContainer);
}


// Scroll Spy for section title
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for updating text

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    // Adjust offset based on desired trigger point for the scroll spy.
    const sectionTop = section.offsetTop - 150; // Change when section is 150px from viewport top
    const sectionHeight = section.offsetHeight;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
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
      // If no specific section is in view, default to 'HERO' if near top
      if (window.scrollY < 200 && navIndicator.textContent !== "HERO") { 
          navIndicator.textContent = "HERO";
      }
  }
});


// Initialize all functionalities when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize all scroll-based animations (About section, Services 8 points, Tools)
    initScrollAnimations(); 
    
    // Trigger a scroll event immediately to set the initial scroll spy title
    window.dispatchEvent(new Event('scroll'));
});
