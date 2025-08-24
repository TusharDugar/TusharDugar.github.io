// Global constants for animation timing
const ROTATE_INCREMENT = 90; // Degrees for a 90-degree card flip (like a cube face)
const SCROLL_FACTOR_PER_CARD = 1.0; // Multiplier for viewport height per card scroll (e.g., 1.0 means 100vh per card)

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


    // --- NEW 3D SERVICES CAROUSEL JAVASCRIPT (DesignCube Scroll-Scrubbing) ---
    const servicesSection = document.getElementById('services'); // The scroll-driving section
    const servicesCarouselContainer = document.querySelector('.services-3d-carousel-container'); // The sticky container
    const servicesWrapper = document.querySelector('.services-3d-carousel-wrapper'); // The rotating wrapper
    const servicesFaces = document.querySelectorAll('.services-carousel-face');
    const SERVICES_COUNT = servicesFaces.length; // Should be 8

    let faceOffset = 0; // Calculated dynamically for 3D depth
    let scrollRangeStart = 0; // window.scrollY where carousel animation starts
    let scrollRangeEnd = 0;   // window.scrollY where carousel animation ends
    let totalAnimationScrollHeight = 0; // Total scrollable pixels dedicated to the carousel
    let animationFrameId = null; // For requestAnimationFrame

    // Calculates dynamic dimensions and scroll boundaries
    function calculateDynamicDimensions() {
        if (!servicesSection || !servicesCarouselContainer || SERVICES_COUNT === 0) return;

        // 1. Determine `faceOffset` (half height of card for `translateZ`)
        faceOffset = servicesFaces[0].offsetHeight / 2;
        if (faceOffset === 0 || isNaN(faceOffset)) {
            console.warn("Could not determine faceOffset dynamically. Using fallback height.");
            faceOffset = servicesCarouselContainer.offsetHeight / 2;
            if (faceOffset === 0 || isNaN(faceOffset)) faceOffset = 150; // Absolute fallback
        }
        servicesCarouselContainer.style.setProperty('--face-offset', `${faceOffset}px`);

        // 2. Position each face statically within the wrapper for the cube effect
        servicesFaces.forEach((face, i) => {
            // Cards are positioned such that index 0 is front, index 1 is below, index SERVICES_COUNT-1 is above, etc.
            // This is a static setup relative to the wrapper. The wrapper itself then rotates.
            face.style.transition = 'none'; // Clear transitions for setup
            face.style.opacity = 0; // Start hidden, JS will control visibility
            face.style.visibility = 'hidden';

            // For a 90-degree flip setup, faces can be positioned like this:
            // 0: front-facing (rotateX(0), translateZ(0))
            // 1: bottom-facing (rotateX(90), translateZ(faceOffset))
            // 2: back-facing (rotateX(180), translateZ(0)) - or just push it back
            // 3: top-facing (rotateX(-90), translateZ(faceOffset))
            // The others are placed to allow a smooth transition sequence.
            
            // For a single "cube" with 8 faces on its perimeter rotating,
            // the faces need to be "around" the rotation axis.
            // Let's go for a simpler "card stack" flip where current goes up/down, next comes in.
            // Face positions:
            // current (0deg, 0px)
            // next (90deg, faceOffset)
            // prev (-90deg, faceOffset)
            // other faces (180deg, 0)
            
            // Ensure cards are far enough in Z-space to not intersect on flip if backface is shown
            // A more robust setup: all faces flat, wrapper just rotates.
            
            // Re-think: The DesignCube reference works by the *wrapper* rotating, and the *content itself*
            // is drawn on the sides of that rotating wrapper. The cards are essentially fixed "textures" on the cube's sides.
            // My current face positioning logic needs to reflect this for 8 "sides".

            // Corrected static positioning of faces relative to the rotating wrapper:
            // Each face is conceptually a side of an 8-sided prism that rotates.
            // The distance from the center of rotation to the plane of the face (translateZ) needs to be calculated
            // so that all 8 faces form a seamless octagonal prism.
            const angleForFace = i * ROTATE_INCREMENT; // Total angle for this face if it were visible
            face.style.transform = `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`;
            face.style.transition = 'none'; // Ensure no transitions during setup
        });


        // 3. Define the scrollable height for the services section
        // We want (SERVICES_COUNT - 1) full screen heights dedicated to the animation
        const viewportHeight = window.innerHeight;
        totalAnimationScrollHeight = (SERVICES_COUNT - 1) * viewportHeight * SCROLL_FACTOR_PER_CARD;
        
        // Add additional height to the section itself for the scroll-driven animation
        // This makes the `services-section` element vertically "stretch" in the document.
        servicesSection.style.minHeight = `${servicesCarouselContainer.offsetHeight + totalAnimationScrollHeight + viewportHeight}px`; 
        // Additional viewportHeight added for "buffer" above/below the interactive zone

        // 4. Calculate the precise scroll range for the carousel animation
        const sectionTop = servicesSection.offsetTop;
        const sectionBottom = sectionTop + servicesSection.offsetHeight;
        
        // The carousel animation starts when the sticky container is in view and has scrolled enough
        // We want the carousel to activate when its sticky container is roughly in the middle of the viewport
        scrollRangeStart = sectionTop + (viewportHeight / 2) - (servicesCarouselContainer.offsetHeight / 2);
        
        // The carousel animation ends after the scrollable height for all cards has been traversed
        scrollRangeEnd = scrollRangeStart + totalAnimationScrollHeight;

        // Ensure current scroll progress is updated after recalculating boundaries
        updateCarouselAnimation();
    }

    // This function maps window.scrollY to the rotation of the servicesWrapper
    function updateCarouselAnimation() {
        if (!servicesSection || !servicesWrapper || SERVICES_COUNT === 0) return;

        const currentWindowScrollY = window.scrollY;
        
        // Determine scroll progress specific to the carousel's animation range
        let progress = 0;
        if (currentWindowScrollY <= scrollRangeStart) {
            progress = 0;
        } else if (currentWindowScrollY >= scrollRangeEnd) {
            progress = 1;
        } else {
            progress = (currentWindowScrollY - scrollRangeStart) / totalAnimationScrollHeight;
        }

        // Calculate the total rotation based on progress (from 0 to (SERVICES_COUNT-1)*ROTATE_INCREMENT degrees)
        const totalRotationDegrees = progress * (SERVICES_COUNT - 1) * ROTATE_INCREMENT;

        // Apply rotation to the wrapper. Negative rotation for visually scrolling down.
        servicesWrapper.style.transform = `rotateX(${-totalRotationDegrees}deg)`;

        // Update face visibility/opacity based on the current rotation angle
        updateFaceVisibility(totalRotationDegrees);
    }

    // Dynamically update opacity and visibility of faces based on the wrapper's current rotation
    function updateFaceVisibility(currentTotalRotationDegrees) {
        servicesFaces.forEach((face, i) => {
            // Get the face's static angle (where it is physically placed in the 3D space)
            const faceStaticAngle = i * ROTATE_INCREMENT;

            // Calculate the face's effective current angle relative to the viewport's front (0deg)
            // It's the static angle minus the wrapper's current rotation.
            let effectiveAngle = (faceStaticAngle - currentTotalRotationDegrees) % 360;

            // Normalize angle to be within -180 to 180 for easier logic
            if (effectiveAngle > 180) effectiveAngle -= 360;
            if (effectiveAngle < -180) effectiveAngle += 360;

            // Define angles for visibility:
            // - Front: -ROTATE_INCREMENT/2 to +ROTATE_INCREMENT/2 (e.g., -45 to 45)
            // - Adjacent (top/bottom): Covers the ranges like 45 to 135 and -45 to -135
            const tolerance = ROTATE_INCREMENT / 2 + 5; // A little buffer
            const isFrontFacing = Math.abs(effectiveAngle) < tolerance;
            const isNearAdjacent = Math.abs(effectiveAngle) < (ROTATE_INCREMENT * 1.5) + 5; // Covers front and immediate adjacent
            
            // Opacity calculation for fading
            let opacity = 0;
            if (isFrontFacing) {
                // Fully visible when directly front-facing
                opacity = 1;
            } else if (isNearAdjacent) {
                // Fade out/in for faces rotating in/out
                // Closer to 0 (front) means higher opacity
                // Closer to +/-90 (top/bottom) means lower opacity
                const angleFromCenter = Math.abs(effectiveAngle);
                // Linear fade between 0 and 90 degrees of rotation (half the ROTATE_INCREMENT as center)
                opacity = 1 - (angleFromCenter / ROTATE_INCREMENT); // Fades from 1 at 0deg to 0 at 90deg
                opacity = Math.max(0, Math.min(1, opacity)); // Clamp between 0 and 1
            }

            // Apply opacity and visibility
            face.style.opacity = opacity;
            face.style.visibility = (opacity > 0) ? 'visible' : 'hidden';
            face.style.transition = `opacity 0.15s ease-out`; // Smooth opacity changes
        });
    }

    // --- Event Handlers ---
    const handleGlobalScroll = (event) => {
        // Only prevent default if we are within the carousel's active scroll range
        // This allows normal page scroll outside the carousel.
        const currentWindowScrollY = window.scrollY;
        const isActiveScrollRange = currentWindowScrollY >= scrollRangeStart && currentWindowScrollY <= scrollRangeEnd;

        if (isActiveScrollRange) {
            event.preventDefault(); // Block normal page scroll
        }
        
        // Request animation frame to update carousel animation, always
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateCarouselAnimation);
        }
    };

    let initialTouchY = 0;
    let initialScrollYOnTouchStart = 0; // The window.scrollY when touch begins

    const handleTouchStart = (event) => {
        initialTouchY = event.touches[0].clientY;
        initialScrollYOnTouchStart = window.scrollY; // Capture scroll position at touch start
    };

    const handleTouchMove = (event) => {
        const currentTouchY = event.touches[0].clientY;
        const deltaTouchY = currentTouchY - initialTouchY;

        // Calculate a "target scroll Y" based on touch movement.
        // The touch input directly translates to how much we want the page to conceptually scroll.
        const newVirtualScrollY = initialScrollYOnTouchStart - deltaTouchY;

        // Determine if this touch event is within or pushing into the carousel's scroll range
        const currentWindowScrollY = window.scrollY;
        const isTouchingCarouselActiveRange = currentWindowScrollY >= scrollRangeStart && currentWindowScrollY <= scrollRangeEnd;

        if (isTouchingCarouselActiveRange) {
            event.preventDefault(); // Prevent default page scroll within the carousel range

            // Manually set window.scrollY to move the page, which then triggers our carousel animation via the scroll listener
            // This is the common vanilla JS pattern to synchronize touch-scroll with an internal scroll-driven animation.
            window.scrollTo({
                top: newVirtualScrollY,
                behavior: 'auto' // Don't animate window scroll, let touch be immediate
            });
            
            // Request animation frame to update carousel animation
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(updateCarouselAnimation);
            }
        }
        // If outside the active range, allow default touch-scroll to take over (no preventDefault)
    };

    // --- Initialization and Event Listeners ---
    
    // Initial setup of faces and calculation of dimensions/scroll ranges
    setupFaces();

    // Re-calculate dimensions and scroll boundaries on window resize
    window.addEventListener('resize', () => {
        // Debounce resize events to prevent excessive recalculations
        if (animationFrameId) cancelAnimationFrame(animationFrameId); // Cancel any pending animation frame
        animationFrameId = requestAnimationFrame(() => {
            setupFaces(); // Recalculate everything
            updateCarouselAnimation(); // Apply new state immediately
            animationFrameId = null;
        });
    });
    
    // Attach global scroll/touch listeners
    window.addEventListener('scroll', handleGlobalScroll, { passive: false }); // Needs to be non-passive for preventDefault
    window.addEventListener('touchstart', handleTouchStart, { passive: true }); // passive:true for start is fine for performance
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs to be non-passive to call preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: true }); // No preventDefault needed here

    // Initial call to update carousel animation state in case it's visible on load
    updateCarouselAnimation(); 
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
