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
    // Target the carousel container specifically for the IntersectionObserver
    const servicesCarouselContainer = document.querySelector('.services-3d-carousel-container');
    const servicesWrapper = document.querySelector('.services-3d-carousel-wrapper');
    const servicesFaces = document.querySelectorAll('.services-carousel-face');
    const SERVICES_COUNT = servicesFaces.length;

    let currentIndex = 0;
    let currentRotation = 0; // Tracks the total rotation of the wrapper
    let isAnimating = false;
    let startY = 0; // For touch swipe
    let faceOffset = 0; // Will be calculated dynamically
    let isServicesCarouselVisible = false; // Flag for IntersectionObserver

    // Function to set initial 3D positions of all faces
    function setupFaces() {
        if (SERVICES_COUNT === 0) return;

        // Ensure carousel container exists before trying to calculate offset
        if (!servicesCarouselContainer) {
            console.error("Services 3D carousel container not found.");
            return;
        }

        // Calculate faceOffset dynamically based on the height of a face
        // Use an active face for height calculation to ensure it has its correct dimensions
        // Fallback to a default if still unable to get height
        const tempFace = servicesFaces[0];
        if (tempFace && tempFace.offsetHeight > 0) {
             faceOffset = tempFace.offsetHeight / 2;
        } else {
             // Fallback if initial height isn't computed (e.g., due to responsive changes or complex CSS)
             console.warn("Could not determine faceOffset dynamically. Using fallback height.");
             faceOffset = servicesCarouselContainer.offsetHeight / 2; // Use container height as fallback
             if (faceOffset === 0) faceOffset = 150; // Absolute fallback if container is also 0
        }
       
        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';
            face.style.transition = 'none'; // Clear any CSS transition during setup

            // Position each face around the center of the wrapper
            const angle = i * ROTATE_INCREMENT; // Angle for this specific face relative to its 0 position
            face.style.transform = `rotateX(${angle}deg) translateZ(${faceOffset}px)`;
        });

        // Set the initial current face state
        updateActiveFaceState();
    }

    // Update which faces are visible (is-current, is-next-face, is-prev-face)
    // This function runs on setup and after each animation completes.
    function updateActiveFaceState() {
        servicesFaces.forEach((face, i) => {
            // Clear all animation/state classes
            face.classList.remove('is-current', 'is-next-face', 'is-prev-face', 'is-outgoing', 'is-incoming');
            face.style.transition = 'none'; // Remove transition for state update

            // Calculate rotational difference from current view
            const diff = (i - currentIndex + SERVICES_COUNT) % SERVICES_COUNT;

            if (diff === 0) { // This is the current, active face
                face.classList.add('is-current');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            } else if (diff === 1) { // This is the next face (below current for scrolling down)
                face.classList.add('is-next-face');
                face.style.opacity = 0;
                face.style.visibility = 'visible';
            } else if (diff === SERVICES_COUNT - 1) { // This is the previous face (above current for scrolling up)
                face.classList.add('is-prev-face');
                face.style.opacity = 0;
                face.style.visibility = 'visible';
            } else { // All other faces are fully hidden
                face.style.opacity = 0;
                face.style.visibility = 'hidden';
            }
        });
    }

    // Main animation function
    // Returns true if animation started, false if boundary reached or already animating
    function animateServices(direction) {
        // Prevent animation if already animating
        if (isAnimating) return false;

        // Check for boundary conditions (non-looping)
        if ((direction === 1 && currentIndex === SERVICES_COUNT - 1) ||
            (direction === -1 && currentIndex === 0)) {
            isAnimating = false; // Ensure it's not locked if attempted to scroll past boundary
            return false; // Indicate that carousel did not animate
        }

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

        return true; // Indicate that carousel successfully animated
    }

    // --- Scroll Event Handling ---
    let scrollTimeout;
    // Observer for the carousel container to know when it's in view
    const servicesCarouselObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            isServicesCarouselVisible = entry.isIntersecting;
            // If it becomes invisible while animating, reset animation state
            if (!isServicesCarouselVisible && isAnimating) {
                isAnimating = false;
                if (scrollTimeout) clearTimeout(scrollTimeout);
                // Also, re-setup faces to clear any lingering animation states if scrolled away mid-transition
                setupFaces(); 
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% of the carousel container is visible

    // Debounce scroll events
    const handleScroll = (event) => {
        // Only try to control scroll if the carousel is visible
        if (!isServicesCarouselVisible) return;

        // Prevent default if an animation is currently in progress
        if (isAnimating) {
            event.preventDefault();
            return;
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up
            const didAnimate = animateServices(direction);
            
            if (didAnimate) {
                event.preventDefault(); // Prevent default page scroll ONLY if carousel animated
            } else {
                // If carousel didn't animate (hit boundary), allow default page scroll
                // This means the default scroll behavior will proceed, taking the user to the next section
            }
        }, 100); // Debounce time (adjust as needed for responsiveness)
    };

    // Touch event handler for mobile swipe
    const handleTouchStart = (event) => {
        // Only try to control scroll if the carousel is visible
        if (!isServicesCarouselVisible) return;
        
        startY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
        // Only try to control scroll if the carousel is visible
        if (!isServicesCarouselVisible) return;

        if (isAnimating) {
            event.preventDefault(); // Prevent page scroll if still animating
            return;
        }

        const endY = event.changedTouches[0].clientY;
        const deltaY = endY - startY;

        if (Math.abs(deltaY) < 50) { // Ignore small swipes
            return;
        }

        const direction = deltaY < 0 ? 1 : -1; // 1 for swipe up (scroll down), -1 for swipe down (scroll up)
        const didAnimate = animateServices(direction);

        if (didAnimate) {
            event.preventDefault(); // Prevent default page scroll ONLY if carousel animated
        }
    };

    // Initialize faces when the DOM is ready
    setupFaces();
    
    // Start observing the services carousel container for scroll interaction
    if (servicesCarouselContainer) {
        servicesCarouselObserver.observe(servicesCarouselContainer);
    }

    // Attach global scroll listeners (they will check `isServicesCarouselVisible`)
    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
