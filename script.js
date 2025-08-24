// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45) - (from previous relevant code)
const ANIMATION_DURATION_MS = 500; // Match CSS transition duration for .cube - (from previous relevant code)
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a flip - (from previous relevant code)
const SCROLL_DEBOUNCE_TIME_MS = 50; // Prevent rapid-fire wheel events from stacking - (from previous relevant code)

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
  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Handle reveal-item (single item reveal like headers, individual cards)
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        // Handle reveal-parent (for About section staggered children)
        else if (entry.target.classList.contains("reveal-parent")) {
          const children = entry.target.querySelectorAll(".reveal-child"); 
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("visible");
            }, index * 100); // Apply stagger delay (100ms)
          });
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
    // IMPORTANT: This also helps trigger initial IntersectionObserver checks.
    window.dispatchEvent(new Event('scroll'));

    // --- Services Section 3D Cube Animation (Discrete Step) ---
    const servicesSection = document.getElementById('services'); // Not directly used in the provided cube JS, but kept for context.
    const cubeContainer = document.querySelector('.cube-container'); // This is the new container for the 3D effect.
    const cube = document.getElementById('services-cube'); // The actual rotating element.
    if (!cube) { // Exit if element doesn't exist
        console.error("services-cube element not found. 3D cube animation cannot initialize.");
        return;
    }
    
    const faces = document.querySelectorAll('.face'); // The individual service cards.
    const SERVICES_COUNT = faces.length; // Should be 8.

    let currentRotation = 0; // Tracks the current rotation of the cube element.
    let isScrolling = false; // Flag to lock interaction during a cube flip.
    let lastScrollTop = 0; // For scroll direction detection.
    const rotationIncrement = 45; // 45° per step for an 8-sided prism.

    // Function to calculate face offset (from previous relevant code, adapted for cube-container)
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        const faceWidth = cubeContainer.offsetWidth; // Use container width for calculation
        // R = (W/2) / tan(PI/N) formula for a regular N-sided polygon.
        const calculatedOffset = (faceWidth / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        return isNaN(calculatedOffset) || calculatedOffset === 0 ? 450 : calculatedOffset; 
    }

    // Sets up the initial 3D positioning of each face (adapted from previous relevant code)
    function setupCubeFaces() {
        if (!cube || SERVICES_COUNT === 0) return;
        const faceOffset = calculateFaceOffset();
        faces.forEach((face, i) => {
            face.style.transition = 'none'; // Clear transitions for setup
            // This transform is crucial for positioning each face in the 3D ring.
            face.style.transform = `rotateY(${i * rotationIncrement}deg) translateZ(${faceOffset}px)`;
        });
        // Apply initial isometric tilt (rotateX) and current Y rotation to the cube itself.
        cube.style.transition = 'none';
        cube.style.transform = `rotateX(-25deg) rotateY(${currentRotation}deg)`;
        updateActiveFace(currentRotation); // Set initial visibility
    }

    // Calculate which face should be active based on current Y rotation.
    const calculateActiveFace = (rotation) => {
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        // Adjust for isometric tilt's visual effect if necessary, but direct calculation is usually fine for discrete steps.
        return Math.round(normalizedRotation / rotationIncrement) % SERVICES_COUNT;
    };

    // Update active face display (visibility and opacity).
    const updateActiveFace = (rotation) => {
        const activeIndex = calculateActiveFace(rotation);
        faces.forEach((face, i) => {
            face.classList.remove('is-active'); // Clear active class first
            face.style.transition = 'opacity 0.3s ease-out'; // Default transition for visibility changes

            // Determine if this face is 'front-facing' within a tolerance.
            // This is simplified for a discrete step model where only one face is truly 'active'.
            if (i === activeIndex) {
                 face.classList.add('is-active');
                 face.style.opacity = 1;
                 face.style.visibility = 'visible';
            } else {
                 face.style.opacity = 0;
                 face.style.visibility = 'hidden';
            }
        });
    };

    // Scroll event handler for cube rotation (adapted from your provided snippet)
    window.addEventListener('scroll', () => {
        if (isScrolling) return;
        
        const st = window.scrollY;
        const direction = st > lastScrollTop ? 1 : -1;
        lastScrollTop = st;

        // Check if cube container is in viewport
        const rect = cubeContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const threshold = window.innerWidth < 768 ? 0.3 : 0.2; // More generous on mobile
        
        if (rect.top < viewportHeight * (1 - threshold) && rect.bottom > viewportHeight * threshold) {
            // Only attempt animation if not at the "edge" of the services (non-looping)
            let newProposedRotation = currentRotation + direction * rotationIncrement;
            
            // Limit rotation to 0 to 360 degrees for 8 faces (0 to 7 * 45 = 315)
            // This creates a "stop" at the first and last face.
            const maxVisibleRotation = (SERVICES_COUNT - 1) * rotationIncrement;
            
            if (newProposedRotation >= 0 && newProposedRotation <= maxVisibleRotation) {
                isScrolling = true;
                
                currentRotation = newProposedRotation;
                
                cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms ease`; // Apply transition
                cube.style.transform = `rotateX(-25deg) rotateY(${currentRotation}deg)`; // Apply isometric tilt + new Y rotation
                
                // Update active face after animation completes
                setTimeout(() => { 
                    isScrolling = false; 
                    updateActiveFace(currentRotation);
                    cube.style.transition = 'none'; // Remove transition for discrete control post-animation
                }, ANIMATION_DURATION_MS); 
            }
            // Prevent default scroll behavior only if cube actually rotates
            if (newProposedRotation >= 0 && newProposedRotation <= maxVisibleRotation) {
                 event.preventDefault();
            }
        }
    });

    // Handle touch events for scrolling the cube (adapted from your provided snippet)
    let touchStartY = 0;
    let touchMoveY = 0;

    cubeContainer.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchMoveY = touchStartY; // Reset move Y
    }, { passive: true });

    cubeContainer.addEventListener('touchmove', (e) => {
        const deltaY = touchStartY - e.touches[0].clientY;
        if (Math.abs(deltaY) > 10) { // Small threshold
             e.preventDefault(); // Prevent page scroll only if significant movement
             touchMoveY = e.touches[0].clientY;
        }
    }, { passive: false });

    cubeContainer.addEventListener('touchend', () => {
        if (isScrolling) return;

        const deltaY = touchStartY - touchMoveY;
        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isCubeInView && Math.abs(deltaY) > SCROLL_THRESHOLD_PX) {
            const direction = deltaY > 0 ? 1 : -1; // Swipe up means scroll down (direction 1)
            
            let newProposedRotation = currentRotation + direction * rotationIncrement;
            const maxVisibleRotation = (SERVICES_COUNT - 1) * rotationIncrement;

            if (newProposedRotation >= 0 && newProposedRotation <= maxVisibleRotation) {
                isScrolling = true;
                currentRotation = newProposedRotation;

                cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms ease`;
                cube.style.transform = `rotateX(-25deg) rotateY(${currentRotation}deg)`;

                setTimeout(() => {
                    isScrolling = false;
                    updateActiveFace(currentRotation);
                    cube.style.transition = 'none';
                }, ANIMATION_DURATION_MS);
            }
        }
        touchStartY = 0; // Reset
        touchMoveY = 0; // Reset
    }, { passive: true });


    // Initial setup when DOM is ready
    setTimeout(() => {
        setupCubeFaces(); 
        // Re-calculate dimensions on window resize (important for responsive cube)
        window.addEventListener('resize', () => {
            setupCubeFaces(); // Re-initialize positions and states based on new sizes
        });
    }, 100); // Small delay to allow initial render
});
