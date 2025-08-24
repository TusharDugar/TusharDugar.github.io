// Global constants for animation timing
const ANIMATION_DURATION = 1200; // 1.2s in milliseconds
const ROTATE_INCREMENT = 90; // Degrees per transition step for a 90-degree card flip

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
  // Observe .reveal-item directly for non-staggered reveals (like headers, tool cards, contact buttons)
  document.querySelectorAll(".reveal-item").forEach(el => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: "0px", threshold: 0.1 });
    observer.observe(el);
  });

  // Observe .reveal-parent for staggered reveals of its .reveal-child elements (like About section)
  document.querySelectorAll(".reveal-parent").forEach(parent => {
    const children = parent.querySelectorAll(".reveal-child");
    const parentObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("visible");
            }, index * 200); // Stagger delay of 200ms
          });
          parentObserver.unobserve(parent);
        }
      });
    }, { root: null, rootMargin: "0px", threshold: 0.1 });
    parentObserver.observe(parent);
  });
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


    // --- NEW 3D SERVICES CAROUSEL JAVASCRIPT (DesignCube Flip) ---
    const servicesCarouselContainer = document.querySelector('.services-3d-carousel-container');
    const servicesWrapper = document.querySelector('.services-3d-carousel-wrapper');
    const servicesFaces = document.querySelectorAll('.services-carousel-face');
    const SERVICES_COUNT = servicesFaces.length;

    let currentIndex = 0;
    let isAnimating = false;
    let startY = 0; // For touch swipe
    let faceOffset = 0; // Will be calculated dynamically
    let isServicesCarouselVisible = false; // Flag for IntersectionObserver

    // Function to set initial 3D positions of all faces for the flip effect
    function setupFaces() {
        if (SERVICES_COUNT === 0) return;

        if (!servicesCarouselContainer) {
            console.error("Services 3D carousel container not found.");
            return;
        }

        // faceOffset is half the height of the card, used for rotateX origin and translateZ
        faceOffset = servicesFaces[0].offsetHeight / 2;
        if (faceOffset === 0 || isNaN(faceOffset)) {
            console.warn("Could not determine faceOffset dynamically. Using fallback height.");
            faceOffset = servicesCarouselContainer.offsetHeight / 2; // Fallback to container height
            if (faceOffset === 0 || isNaN(faceOffset)) faceOffset = 150; // Absolute fallback
        }

        // Set CSS variable for use in CSS transitions (for calc in translateZ)
        servicesCarouselContainer.style.setProperty('--face-offset', `${faceOffset}px`);
       
        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';
            face.style.transition = 'none'; // Clear any CSS transition during setup
            face.style.opacity = 0; // Default to hidden for all faces initially
            face.style.visibility = 'hidden';

            // Initial positioning of cards:
            // current (0) is flat: rotateX(0deg) translateZ(0)
            // next (1) is below: rotateX(90deg) translateZ(faceOffset)
            // prev (count-1) is above: rotateX(-90deg) translateZ(faceOffset)
            // All others are explicitly rotated and translated far out of view (or kept at 0, hidden)
            if (i === 0) {
                face.style.transform = `rotateX(0deg) translateZ(0)`;
            } else if (i === 1) { // The 'next' card, initially below
                face.style.transform = `rotateX(90deg) translateZ(${faceOffset}px)`;
            } else if (i === SERVICES_COUNT - 1) { // The 'previous' card, initially above
                face.style.transform = `rotateX(-90deg) translateZ(${faceOffset}px)`;
            } else {
                // Ensure other cards are out of view, e.g., rotated completely away
                face.style.transform = `rotateX(0deg) translateZ(-${faceOffset * 2}px)`; // Pushed back further
            }
        });

        // Set the initial current face state to make the first card visible
        updateActiveFaceState();
    }

    // Update which faces have the correct classes and inline styles (is-current, is-next-face, is-prev-face)
    function updateActiveFaceState() {
        servicesFaces.forEach((face, i) => {
            // Clear all animation/state classes
            face.classList.remove('is-current', 'is-entering', 'is-leaving', 'up', 'down');
            face.style.transition = 'none'; // Remove transition for immediate style changes

            if (i === currentIndex) { // This is the current, active face
                face.classList.add('is-current');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
                face.style.transform = `rotateX(0deg) translateZ(0)`;
            } else {
                face.style.opacity = 0;
                face.style.visibility = 'hidden'; // Default for non-current, non-adjacent
                
                // Position adjacent cards (next and previous) correctly for the flip effect
                // The `transform` values here represent their "ready" state before animating
                const nextIndex = (currentIndex + 1) % SERVICES_COUNT;
                const prevIndex = (currentIndex - 1 + SERVICES_COUNT) % SERVICES_COUNT;

                if (i === nextIndex) {
                    face.style.visibility = 'visible'; // Keep visible to prepare for animation
                    face.style.transform = `rotateX(90deg) translateZ(${faceOffset}px)`; // Positioned below
                } else if (i === prevIndex) {
                    face.style.visibility = 'visible'; // Keep visible to prepare for animation
                    face.style.transform = `rotateX(-90deg) translateZ(${faceOffset}px)`; // Positioned above
                } else {
                    // Ensure all other cards are completely out of view for clean transitions
                    face.style.transform = `rotateX(0deg) translateZ(-${faceOffset * 2}px)`;
                }
            }
        });
    }

    // Main animation function for a single card flip (DesignCube style)
    // Returns true if animation started, false if boundary reached or already animating
    function animateServices(direction) {
        if (isAnimating) return false;

        const nextIndex = (currentIndex + direction + SERVICES_COUNT) % SERVICES_COUNT;

        // Check for boundary conditions (non-looping)
        if ((direction === 1 && currentIndex === SERVICES_COUNT - 1) || // Scrolling down at last card
            (direction === -1 && currentIndex === 0)) { // Scrolling up at first card
            return false; // Indicate that carousel did not animate, allow page scroll
        }

        isAnimating = true;

        const outgoingFace = servicesFaces[currentIndex];
        const incomingFace = servicesFaces[nextIndex];
        
        // Remove 'is-current' from outgoing immediately
        outgoingFace.classList.remove('is-current');

        // Prepare incoming card for animation (ensure visibility before applying entering class)
        incomingFace.style.visibility = 'visible'; 
        incomingFace.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.65, 0.05, 0.36, 1), opacity 0.48s ease-in 0.72s`;

        // Apply classes and transforms for the flip animation
        if (direction === 1) { // Scrolling down: current flips up, next flips up from bottom
            outgoingFace.classList.add('is-leaving', 'up'); // Outgoing flips up
            outgoingFace.style.transform = `rotateX(-90deg) translateZ(${faceOffset}px)`; // Final transform for leaving
            
            incomingFace.classList.add('is-entering', 'down'); // Incoming flips up (from bottom)
            incomingFace.style.transform = `rotateX(0deg) translateZ(0)`; // Final transform for entering
        } else { // Scrolling up: current flips down, previous flips down from top
            outgoingFace.classList.add('is-leaving', 'down'); // Outgoing flips down
            outgoingFace.style.transform = `rotateX(90deg) translateZ(${faceOffset}px)`; // Final transform for leaving

            incomingFace.classList.add('is-entering', 'up'); // Incoming flips down (from top)
            incomingFace.style.transform = `rotateX(0deg) translateZ(0)`; // Final transform for entering
        }

        // Update current index after animation completes
        setTimeout(() => {
            currentIndex = nextIndex;
            updateActiveFaceState(); // Reset states for all faces
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
                setupFaces(); // Recalculate positions and states
            }
            // If it becomes visible while not animating, ensure its state is correct
            if (isServicesCarouselVisible && !isAnimating) {
                updateActiveFaceState(); // Ensures current face is correctly visible
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% of the carousel container is visible

    // Debounce scroll events
    const handleScroll = (event) => {
        // Only try to control scroll if the carousel is visible
        if (!isServicesCarouselVisible) return;

        // Prevent default if an animation is currently in progress
        if (isAnimating) {
            event.preventDefault(); // Crucial: Stop page scroll if carousel is animating
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
                // No need to explicitly preventDefault here as we want normal page scroll.
            }
        }, 100); // Debounce time (adjust as needed for responsiveness)
    };

    // Touch event handler for mobile swipe
    let touchMoved = false; // Flag to track if touch has moved significantly
    const handleTouchStart = (event) => {
        // Only try to control scroll if the carousel is visible
        if (!isServicesCarouselVisible) return;
        
        startY = event.touches[0].clientY;
        touchMoved = false; // Reset for new touch sequence
    };

    const handleTouchMove = (event) => {
        // Mark that touch has moved to potentially animate
        if (Math.abs(event.touches[0].clientY - startY) > 10) { // Small threshold for "moved"
            touchMoved = true;
        }
        // If animating, prevent scrolling the page during touchmove
        if (isAnimating && isServicesCarouselVisible) {
            event.preventDefault();
        }
    }

    const handleTouchEnd = (event) => {
        // Only try to control scroll if the carousel is visible and touch actually moved
        if (!isServicesCarouselVisible || !touchMoved) return;

        if (isAnimating) {
            event.preventDefault(); // Crucial: Stop page scroll if carousel is animating
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

    // Re-calculate faceOffset on window resize (important for responsive carousel)
    window.addEventListener('resize', () => {
        // Debounce resize events to prevent excessive recalculations
        clearTimeout(scrollTimeout); 
        scrollTimeout = setTimeout(() => {
            setupFaces(); 
        }, 200); 
    });
    
    // Start observing the services carousel container for scroll interaction
    if (servicesCarouselContainer) {
        servicesCarouselObserver.observe(servicesCarouselContainer);
    }

    // Attach global scroll listeners (they will check `isServicesCarouselVisible`)
    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true }); // passive:true for start is fine for performance
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs to be non-passive to call preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: false }); // passive:false for end to allow preventDefault
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
