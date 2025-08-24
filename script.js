// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 500; // Match CSS transition duration for .cube
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a flip
const SCROLL_DEBOUNCE_TIME_MS = 50; // Prevent rapid-fire wheel events from stacking

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
        // Handle reveal-parent (for staggered children like About section and Services section)
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
        // No explicit handling for .reveal-child or .reveal-stagger directly, as their parents trigger them.
        
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
    window.dispatchEvent(new Event('scroll'));

    // --- Services Section 3D Cube Animation (Discrete Step) ---
    const servicesSection = document.getElementById('services');
    const cubeContainer = document.querySelector('.cube-container'); // The sticky container
    const cube = document.getElementById('services-cube'); // The rotating cube element
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length; // Should be 8

    let currentRotationAngle = 0; // Tracks the current rotation of the cube element
    let activeFaceIndex = 0; // Which face is currently active/front-facing
    let isAnimatingCube = false; // Flag to lock interaction during a cube flip

    // Calculates the `translateZ` distance for faces to form a seamless octagon
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        // For an N-sided regular polygon where the faces are squares of width 'W',
        // the distance 'R' from the center to the face (translateZ) is R = (W/2) / tan(PI/N)
        const faceWidth = cubeContainer.offsetWidth; // The width of the container/face
        const calculatedOffset = (faceWidth / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        return isNaN(calculatedOffset) ? 450 : calculatedOffset; // Fallback if calculation is bad (e.g., width 0)
    }

    // Sets up the initial 3D positioning of each face
    function setupCubeFaces() {
        if (!cube || SERVICES_COUNT === 0) return;

        const faceOffset = calculateFaceOffset();
        cubeContainer.style.setProperty('--face-offset', `${faceOffset}px`); // Set CSS variable

        faces.forEach((face, i) => {
            face.style.transition = 'none'; // Clear transitions for setup
            face.style.opacity = 0;
            face.style.visibility = 'hidden';

            // Each face is statically positioned relative to the cube's origin
            // Index 0 is front, index 1 is 45deg down, etc.
            const angleForFace = i * ROTATION_INCREMENT_DEG;
            face.style.transform = `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`;
        });

        updateFaceVisibility(); // Set initial visibility for face 0
    }

    // Updates the visibility (opacity/display) of faces based on cube's rotation
    function updateFaceVisibility() {
        faces.forEach((face, i) => {
            face.classList.remove('is-active'); // Clear active class first
            face.style.transition = 'opacity 0.3s ease-out'; // Default transition for visibility changes

            // Calculate the face's effective current angle relative to the viewport's front (0deg)
            // It's the face's static setup angle minus the cube's current rotation.
            let effectiveAngle = (i * ROTATION_INCREMENT_DEG - currentRotationAngle) % 360;

            // Normalize angle to be within -180 to 180 for consistent checks
            if (effectiveAngle > 180) effectiveAngle -= 360;
            if (effectiveAngle < -180) effectiveAngle += 360;

            // Define tolerance for "front-facing"
            const frontFacingTolerance = ROTATION_INCREMENT_DEG / 2; // e.g., +/- 22.5 degrees

            if (Math.abs(effectiveAngle) < frontFacingTolerance) {
                // This face is currently visible (or nearly so)
                face.classList.add('is-active');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            } else {
                // This face is rotated away
                face.style.opacity = 0;
                face.style.visibility = 'hidden';
            }
        });
    }

    // Animates the cube to the next/previous face
    // Returns true if animation started, false if at boundary or already animating
    function animateCube(direction) {
        if (isAnimatingCube) return false;

        let newActiveFaceIndex = activeFaceIndex + direction;

        // Boundary check for non-looping
        if (newActiveFaceIndex < 0) {
            newActiveFaceIndex = 0; // Clamp at first card
            return false; // Allow page to scroll up
        }
        if (newActiveFaceIndex >= SERVICES_COUNT) {
            newActiveFaceIndex = SERVICES_COUNT - 1; // Clamp at last card
            return false; // Allow page to scroll down
        }

        isAnimatingCube = true;
        activeFaceIndex = newActiveFaceIndex;

        // Update cube's rotation (negative for scroll-down visual effect)
        currentRotationAngle += direction * ROTATION_INCREMENT_DEG; // Accumulate rotation
        cube.style.transform = `rotateX(${-currentRotationAngle}deg)`; // Apply to cube

        // Once animation completes, reset flag and update visibility
        setTimeout(() => {
            isAnimatingCube = false;
            updateFaceVisibility();
        }, ANIMATION_DURATION_MS); // Match CSS transition duration

        return true;
    }

    // --- Scroll & Touch Event Handlers ---
    let lastWheelTime = 0; // For debounce on wheel events
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaY = 0;

    // Handles global scroll events (desktop wheel)
    const handleGlobalScroll = (event) => {
        // Check if the cube container is in the active viewport area for interaction
        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (!isCubeInView) return; // Not in view, let page scroll normally

        // Prevent rapid-fire wheel events
        const now = Date.now();
        if (now - lastWheelTime < SCROLL_DEBOUNCE_TIME_MS) {
            event.preventDefault(); // Temporarily prevent if too fast
            return;
        }
        lastWheelTime = now;

        // Determine scroll direction
        const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up

        // Attempt to animate the cube
        const didAnimate = animateCube(direction);

        if (didAnimate) {
            event.preventDefault(); // ONLY prevent default if the cube actually animated
        } else {
            // Cube did not animate (hit boundary), allow normal page scroll.
            // No preventDefault here means the browser will scroll the page.
        }
    };

    // Handles touch start (mobile)
    const handleTouchStart = (event) => {
        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isCubeInView) return;

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchDeltaY = 0;
    };

    // Handles touch move (mobile)
    const handleTouchMove = (event) => {
        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isCubeInView) return;

        const deltaY = event.touches[0].clientY - touchStartY;
        const deltaX = event.touches[0].clientX - touchStartX;

        // Only consider vertical scroll for cube animation
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SCROLL_THRESHOLD_PX) {
            event.preventDefault(); // Prevent page scroll when a significant vertical swipe starts in cube's area
            touchDeltaY = deltaY; // Store delta for touch end
        }
    };

    // Handles touch end (mobile)
    const handleTouchEnd = (event) => {
        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isCubeInView) return;

        if (Math.abs(touchDeltaY) > SCROLL_THRESHOLD_PX) {
            const direction = touchDeltaY < 0 ? 1 : -1; // 1 for swipe up (scroll down), -1 for swipe down (scroll up)
            animateCube(direction);
        }
        touchDeltaY = 0; // Reset
    };

    // Initial setup when DOM is ready
    setupCubeFaces();

    // Re-calculate dimensions on window resize
    window.addEventListener('resize', () => {
        setupCubeFaces(); // Re-initialize positions and states based on new sizes
    });
    
    // Attach global event listeners
    // 'scroll' handles desktop mouse wheel indirectly by checking scrollY change.
    // However, for the discrete step, we need direct wheel events or similar debounce.
    // The previous implementation for `window.addEventListener('scroll')` to `updateCarouselAnimation`
    // is replaced by direct wheel/touch handling for discrete steps.

    // Using `wheel` event directly for desktop interaction.
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    // Touch events for mobile swiping
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs passive: false to preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: true }); // No preventDefault needed here, gesture already finished.
    // --- END Services Section 3D Cube Animation ---
});
