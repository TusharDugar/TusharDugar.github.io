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


// Scroll Spy for section title (REMOVED TEXT CHANGE LOGIC)
const sections = document.querySelectorAll("section[id], footer[id]");
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for your name

window.addEventListener("scroll", () => {
  // This function now only exists to trigger other events if needed,
  // but it no longer changes navIndicator.textContent.
  // The navIndicator will retain its original HTML text ("Tushar Dugar").

  let current = ""; // Still calculate 'current' section if you want to log it or use it for other non-text-changing purposes.
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  // Removed all textContent assignments to navIndicator to keep name static.
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

    // Initialize IntersectionObserver-based animations (for About section, Tools, and other reveal-items)
    initIntersectionObserverAnimations();

    // Trigger a scroll event immediately to set the initial scroll spy title (though not visible now)
    window.dispatchEvent(new Event('scroll'));


    // --- NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
    const servicesSection = document.getElementById('services');
    const servicesWrapper = document.querySelector('.services-3d-carousel-wrapper');
    const servicesFaces = document.querySelectorAll('.services-carousel-face');
    const SERVICES_COUNT = servicesFaces.length;

    let currentIndex = 0;
    let currentRotation = 0; // Tracks the total rotation of the wrapper
    let isAnimating = false;
    let startY = 0; // For touch swipe
    let faceOffset = 0; // Will be calculated dynamically

    // Function to set initial 3D positions of all faces
    function setupFaces() {
        if (SERVICES_COUNT === 0) return;

        // Calculate faceOffset dynamically based on the height of a face
        // Ensure the faces have a defined height in CSS for this to work
        faceOffset = servicesFaces[0].offsetHeight / 2; // Half height for cube perspective

        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';
            face.style.opacity = 0; // Start hidden
            face.style.visibility = 'hidden'; // Start hidden
            face.style.transition = 'none'; // Clear any CSS transition during setup

            // Position each face around the center of the wrapper
            // 0deg is front, -90deg is top, 90deg is bottom, 180deg is back
            // The translateZ pushes them out to form the cube face
            const angle = i * ROTATE_INCREMENT; // Angle for this specific face relative to its 0 position
            face.style.transform = `rotateX(${angle}deg) translateZ(${faceOffset}px)`;
        });

        // Set the initial current face to visible
        updateActiveFaceState();
    }

    // Update which faces are visible (is-current, is-next-face, is-prev-face)
    // This function runs on setup and after each animation completes.
    function updateActiveFaceState() {
        servicesFaces.forEach((face, i) => {
            // Clear all animation/state classes and transitions
            face.classList.remove('is-current', 'is-next-face', 'is-prev-face', 'is-outgoing', 'is-incoming');
            face.style.transition = 'none'; // Remove transition for state update
            
            // Calculate rotational difference from current view
            const diff = (i - currentIndex + SERVICES_COUNT) % SERVICES_COUNT;

            if (diff === 0) { // This is the current, active face
                face.classList.add('is-current');
                // Opacity/visibility handled by .is-current class in CSS
            } else if (diff === 1) { // This is the next face (below current)
                face.classList.add('is-next-face');
                // Opacity/visibility handled by .is-next-face class in CSS
            } else if (diff === SERVICES_COUNT - 1) { // This is the previous face (above current)
                face.classList.add('is-prev-face');
                // Opacity/visibility handled by .is-prev-face class in CSS
            } else { // All other faces are fully hidden
                face.style.opacity = 0;
                face.style.visibility = 'hidden';
            }
        });
    }

    // Main animation function
    function animateServices(direction) {
        if (isAnimating) return;
        isAnimating = true;

        const outgoingFaceIndex = currentIndex;
        const incomingFaceIndex = (currentIndex + direction + SERVICES_COUNT) % SERVICES_COUNT;

        const outgoingFace = servicesFaces[outgoingFaceIndex];
        const incomingFace = servicesFaces[incomingFaceIndex];

        // 1. Apply animation classes for fade timing
        outgoingFace.classList.add('is-outgoing'); // Triggers fade-out
        incomingFace.classList.add('is-incoming'); // Triggers fade-in (with delay)

        // 2. Apply the global wrapper rotation
        currentRotation -= direction * ROTATE_INCREMENT; // Decrement for scroll down, increment for scroll up
        servicesWrapper.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.65, 0.05, 0.36, 1)`;
        servicesWrapper.style.transform = `rotateX(${currentRotation}deg)`;

        // 3. Clear animation classes and update state after animation completes
        setTimeout(() => {
            currentIndex = incomingFaceIndex; // Update current index to the newly active face
            servicesWrapper.style.transition = 'none'; // Remove transition from wrapper after animation

            // Reset all faces to their non-animating state and apply new 'is-current', 'is-next-face', etc.
            updateActiveFaceState();
            
            isAnimating = false;
        }, ANIMATION_DURATION);
    }

    // --- Scroll Event Handling ---
    let scrollTimeout;
    const servicesSectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Attach scroll listeners only when the services section is in view
                window.addEventListener('wheel', handleScroll, { passive: false });
                window.addEventListener('touchstart', handleTouchStart, { passive: true });
                window.addEventListener('touchend', handleTouchEnd, { passive: false });
            } else {
                // Detach scroll listeners when the services section is out of view
                window.removeEventListener('wheel', handleScroll);
                window.removeEventListener('touchstart', handleTouchStart);
                window.removeEventListener('touchend', handleTouchEnd);
                // Also reset isAnimating if we scroll away mid-animation to prevent lock
                isAnimating = false;
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

    // Debounce scroll events
    const handleScroll = (event) => {
        event.preventDefault(); // Prevent default page scroll
        if (isAnimating) return;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up
            animateServices(direction);
        }, 100); // Debounce time (adjust as needed for responsiveness)
    };

    // Touch event handler for mobile swipe
    const handleTouchStart = (event) => {
        startY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
        if (isAnimating) return;

        const endY = event.changedTouches[0].clientY;
        const deltaY = endY - startY;

        if (Math.abs(deltaY) < 50) return; // Ignore small swipes

        const direction = deltaY < 0 ? 1 : -1; // 1 for swipe up (scroll down), -1 for swipe down (scroll up)
        animateServices(direction);
    };

    // Initialize faces when the DOM is ready
    setupFaces();
    
    // Start observing the services section for scroll interaction
    if (servicesSection) {
        servicesSectionObserver.observe(servicesSection);
    }
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
