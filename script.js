// Global constants for animation timing
const ANIMATION_DURATION = 1200; // 1.2s in milliseconds
const ROTATE_INCREMENT = 45; // Degrees per transition step for an 8-sided prism (360/8 = 45)

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

        // Calculate faceOffset for an 8-sided prism
        // This calculates the radius from the center of the prism to the face, ensuring faces meet.
        const containerHeight = servicesCarouselContainer.offsetHeight;
        if (containerHeight === 0) {
            console.warn("servicesCarouselContainer has 0 height, cannot calculate faceOffset. Using fallback.");
            faceOffset = 150; // Absolute fallback if height is still 0
        } else {
            faceOffset = (containerHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        }

        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';
            face.style.transition = 'none'; // Clear any CSS transition during setup

            // Each face is rotated by `i * 45deg` around the X-axis and translated `faceOffset` along Z
            // to form an 8-sided vertical prism.
            const angle = i * ROTATE_INCREMENT; 
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

            // This ensures only the active, next, and previous faces are "visible" to the eye
            // The others are fully hidden (opacity: 0, visibility: hidden)
            if (diff === 0) { // This is the current, active face
                face.classList.add('is-current');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            } else if (diff === 1) { // This is the face that is "below" the current one (next when scrolling down)
                face.classList.add('is-next-face');
                face.style.opacity = 0;
                face.style.visibility = 'visible';
            } else if (diff === SERVICES_COUNT - 1) { // This is the face that is "above" the current one (previous when scrolling up)
                face.classList.add('is-prev-face');
                face.style.opacity = 0;
                face.style.visibility = 'visible';
            } else { // All other faces are completely out of view
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
        if ((direction === 1 && currentIndex === SERVICES_COUNT - 1) || // Scrolling down at last card
            (direction === -1 && currentIndex === 0)) { // Scrolling up at first card
            // Do not animate, allow normal page scroll to resume
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
        // Corrected direction for rotating the prism:
        // Scrolling down (direction = 1): `currentRotation` increases, rotating the prism 'downwards' visually.
        // Scrolling up (direction = -1): `currentRotation` decreases, rotating the prism 'upwards' visually.
        currentRotation += direction * ROTATE_INCREMENT; // Rotate the entire prism by 45 degrees per step
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
    // Corrected passive property for touch events to allow preventDefault
    window.addEventListener('touchstart', handleTouchStart, { passive: true }); // passive:true for start is fine for performance
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs to be non-passive to call preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: false }); // passive:false for end to allow preventDefault
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
