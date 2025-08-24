// Global constants for animation timing
const ANIMATION_DURATION = 1200; // 1.2s in milliseconds for the rotation transition
const ROTATE_INCREMENT = 90; // Degrees for a 90-degree card flip (like a cube face)

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
    const SERVICES_COUNT = servicesFaces.length; // Should be 8

    let currentIndex = 0;
    let currentScrollProgress = 0; // Tracks scroll progress within the carousel's scrollable height
    let isAnimating = false; // Flag to lock scroll during transition
    let startY = 0; // For touch swipe
    let faceOffset = 0; // Calculated dynamically for 3D depth

    let carouselMinScroll = 0; // The window.scrollY where the carousel starts its interaction
    let carouselMaxScroll = 0; // The window.scrollY where the carousel ends its interaction
    let carouselScrollHeight = 0; // The total scrollable height dedicated to the carousel
    let isServicesCarouselVisible = false; // Flag for IntersectionObserver

    // Helper to calculate total scrollable height for carousel and its boundaries
    function calculateCarouselScrollBoundaries() {
        if (!servicesCarouselContainer || SERVICES_COUNT === 0) return;

        // The number of "scroll steps" required to go through all cards
        const totalSteps = SERVICES_COUNT - 1; 

        // Set an arbitrary scrollable height for the carousel section.
        // This height needs to be large enough to allow smooth scroll-driven rotation.
        // For N cards, total scroll height might be (N-1) * (some value).
        // Let's make each "step" cover 100vh for a desktop-like experience for 3D effect.
        // This determines how much real page scroll is dedicated to one card flip.
        const scrollPerCard = window.innerHeight * 1.0; // Each card takes 100% of viewport height to scroll through its flip
        carouselScrollHeight = totalSteps * scrollPerCard; // Total scroll required to go through all cards.

        // Get the top position of the carousel container relative to the document
        const rect = servicesCarouselContainer.getBoundingClientRect();
        const containerTopAbs = rect.top + window.scrollY;

        // `carouselMinScroll` is when the carousel starts driving rotation
        // We want the carousel to be visually centered during its interaction
        carouselMinScroll = containerTopAbs - (window.innerHeight / 2) + (servicesCarouselContainer.offsetHeight / 2);
        
        // `carouselMaxScroll` is when the last card is fully in view, and we can scroll past
        carouselMaxScroll = carouselMinScroll + carouselScrollHeight;

        // Ensure carousel section itself has enough height to allow scrolling within its range
        // This might require a placeholder div or setting min-height on the section itself.
        // For this specific DesignCube-like effect, the container typically has fixed height
        // and a parent wrapper provides the scrollable area.
        // For simplicity, we'll assume the overall page scroll range can handle this,
        // and rely on preventDefault to "lock" scroll.
    }

    // Function to set initial 3D positions of all faces for the flip effect
    function setupFaces() {
        if (SERVICES_COUNT === 0) return;

        if (!servicesCarouselContainer) {
            console.error("Services 3D carousel container not found.");
            return;
        }

        // faceOffset is half the height of the card, used for translateZ
        faceOffset = servicesFaces[0].offsetHeight / 2;
        if (faceOffset === 0 || isNaN(faceOffset)) {
            console.warn("Could not determine faceOffset dynamically. Using fallback height.");
            faceOffset = servicesCarouselContainer.offsetHeight / 2;
            if (faceOffset === 0 || isNaN(faceOffset)) faceOffset = 150; // Absolute fallback
        }

        // Set CSS variable for use in CSS (e.g., for calc in translateZ of leaving/entering cards)
        servicesCarouselContainer.style.setProperty('--face-offset', `${faceOffset}px`);
       
        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';
            face.style.transition = 'none'; // Clear any CSS transition during setup
            face.style.opacity = 0; // Default to hidden for all faces
            face.style.visibility = 'hidden';
            face.style.transformOrigin = 'center center'; // For local card rotation perspective

            // Initial positioning for 8 cards in a cube-like flip:
            // - current (0) is flat in front
            // - next (1) is rotated down, below current
            // - previous (7) is rotated up, above current
            // - others are rotated further away or just out of view
            if (i === 0) {
                face.style.transform = `rotateX(0deg) translateZ(0)`;
            } else if (i === 1) { // The 'next' card
                face.style.transform = `rotateX(90deg) translateZ(${faceOffset}px)`;
            } else if (i === SERVICES_COUNT - 1) { // The 'previous' card
                face.style.transform = `rotateX(-90deg) translateZ(${faceOffset}px)`;
            } else {
                // All other cards rotated completely out of view, e.g., to the "back"
                face.style.transform = `rotateX(180deg) translateZ(0)`; // Or any other state that's hidden
            }
        });

        // Calculate scroll boundaries when setup is complete and sizes are known
        calculateCarouselScrollBoundaries();

        // Update face opacity and visibility for the initial state
        updateFaceOpacity();
    }

    // This function maps scroll progress to rotation and updates card opacities
    function updateCarouselAnimation() {
        if (!isServicesCarouselVisible || SERVICES_COUNT === 0) return;

        const currentWindowScrollY = window.scrollY;

        // Calculate scroll progress within the dedicated carousel scroll height
        let progress = 0;
        if (currentWindowScrollY <= carouselMinScroll) {
            progress = 0;
        } else if (currentWindowScrollY >= carouselMaxScroll) {
            progress = 1;
        } else {
            progress = (currentWindowScrollY - carouselMinScroll) / carouselScrollHeight;
        }

        // Map progress to current index
        let newIndex = Math.round(progress * (SERVICES_COUNT - 1));
        newIndex = Math.max(0, Math.min(SERVICES_COUNT - 1, newIndex));

        // Update current index only if it changes
        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
        }

        // Calculate the target rotation based on the progress
        // This is the total rotation of the wrapper itself
        const targetRotation = progress * (SERVICES_COUNT - 1) * ROTATE_INCREMENT;

        // Apply rotation to the wrapper
        servicesWrapper.style.transition = 'none'; // Ensure no CSS transition during direct scroll control
        servicesWrapper.style.transform = `rotateX(${-targetRotation}deg)`; // Negative to make it scroll down visually

        // Update individual card opacities based on their proximity to the front-facing plane
        updateFaceOpacity();
    }

    // Manages opacity and visibility of faces based on their current actual rotation
    function updateFaceOpacity() {
        servicesFaces.forEach((face, i) => {
            const faceAngleRelative = (i * ROTATE_INCREMENT) + currentScrollProgress; // Where this face *would* be if wrapper wasn't rotating
            const currentTotalRotation = currentScrollProgress; // The current effective rotation of the whole setup

            // Calculate current rotation of THIS specific face relative to the viewport (front is 0deg)
            // The `+ currentTotalRotation` is because the wrapper is rotating.
            // Adjust to keep angle within -180 to 180 range for easier checks
            let actualFaceAngle = (i * ROTATE_INCREMENT + currentTotalRotation) % 360;
            if (actualFaceAngle > 180) actualFaceAngle -= 360;
            if (actualFaceAngle < -180) actualFaceAngle += 360;

            // Check if face is "front-ish" (within ~+/- 45 degrees of 0) or "back-ish" (within ~+/- 45 degrees of 180)
            const isFrontFacing = Math.abs(actualFaceAngle) <= (ROTATE_INCREMENT / 2) + 1; // within ~45 deg
            const isLeavingOrEntering = Math.abs(actualFaceAngle) > (ROTATE_INCREMENT / 2) - 1 && Math.abs(actualFaceAngle) < (ROTATE_INCREMENT * 1.5) + 1; // Approx. 45 to 135 deg
            
            // Remove previous state classes and transitions before re-applying
            face.classList.remove('is-current', 'is-leaving', 'is-entering');
            face.style.transition = 'none'; // Temporarily disable transitions

            if (isFrontFacing) {
                face.classList.add('is-current');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            } else if (isLeavingOrEntering) {
                 // Cards transitioning in/out should be visible but controlled by opacity
                face.style.opacity = 0; // Default hidden for incoming/outgoing
                face.style.visibility = 'visible';
                // These specific transforms are handled by the main scroll update via `servicesWrapper` rotation.
                // We're setting opacity based on the *state* of rotation.
            } else {
                face.style.opacity = 0;
                face.style.visibility = 'hidden';
            }
        });
    }

    // --- Scroll Event Handling ---
    let scrollAnimationFrameId = null; // Used to debounce scroll updates
    let lastScrollY = window.scrollY; // Track previous scroll position for direction

    // This function is the core of the scroll-driven animation
    const animateScrollStep = () => {
        if (!isServicesCarouselVisible) {
            scrollAnimationFrameId = null;
            return;
        }

        const currentWindowScrollY = window.scrollY;
        
        // Only update if scroll has actually changed
        if (currentWindowScrollY === lastScrollY) {
            scrollAnimationFrameId = null;
            return;
        }
        lastScrollY = currentWindowScrollY;

        // Calculate progress within the dedicated carousel scroll height
        let progress = 0;
        if (currentWindowScrollY <= carouselMinScroll) {
            progress = 0;
        } else if (currentWindowScrollY >= carouselMaxScroll) {
            progress = 1;
        } else {
            progress = (currentWindowScrollY - carouselMinScroll) / carouselScrollHeight;
        }

        // Map progress to the current index
        let newIndex = Math.round(progress * (SERVICES_COUNT - 1));
        newIndex = Math.max(0, Math.min(SERVICES_COUNT - 1, newIndex));

        // Update currentIndex if it changed
        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
        }

        // Calculate the target rotation based on the current progress
        // Total angle to rotate through (e.g., 7 flips * 90 degrees/flip = 630 degrees)
        const totalRotationAngle = (SERVICES_COUNT - 1) * ROTATE_INCREMENT;
        currentScrollProgress = progress * totalRotationAngle; // This is the total angle, but in degrees.

        // Apply rotation to the wrapper (negative to visually scroll down when scrolling down the page)
        servicesWrapper.style.transform = `rotateX(${-currentScrollProgress}deg)`;

        // Update individual card opacities
        updateFaceOpacity();
        
        scrollAnimationFrameId = null; // Clear ID to allow next animation frame
    };

    const handleScroll = (event) => {
        // Only prevent default if carousel is active AND within its scrollable range
        // This is key for non-looping and allowing normal scroll outside the carousel
        const isWithinCarouselScrollRange = window.scrollY > carouselMinScroll - 100 && window.scrollY < carouselMaxScroll + 100; // Add some buffer

        if (isServicesCarouselVisible && isWithinCarouselScrollRange) {
            event.preventDefault(); // Prevent default page scroll
            if (!scrollAnimationFrameId) {
                scrollAnimationFrameId = requestAnimationFrame(animateScrollStep);
            }
        }
    };

    // Touch event handling needs to track vertical movement to map to scroll progress
    let initialTouchY = 0;
    let currentCarouselScrollY = 0; // The virtual scroll position for the carousel
    let initialScrollYOnTouch = 0; // window.scrollY when touch started

    const handleTouchStart = (event) => {
        if (!isServicesCarouselVisible) return;
        initialTouchY = event.touches[0].clientY;
        initialScrollYOnTouch = window.scrollY;
        // This ensures the carousel's rotation is continuous from where the page was scrolled
        currentScrollProgress = (initialScrollYOnTouch - carouselMinScroll) / carouselScrollHeight * ((SERVICES_COUNT - 1) * ROTATE_INCREMENT);
    };

    const handleTouchMove = (event) => {
        if (!isServicesCarouselVisible) return;

        const deltaTouchY = event.touches[0].clientY - initialTouchY; // Delta in touch coordinates
        
        // Map touch delta to a scroll-like value for the carousel
        // Adjust sensitivity as needed
        const touchSensitivity = 1.5; // How much touch movement translates to carousel scroll
        const virtualScrollDelta = -deltaTouchY * touchSensitivity; // Negative because scrolling down (deltaY > 0) means page.scrollY increases

        let newVirtualScrollY = initialScrollYOnTouch + virtualScrollDelta;

        // Clamp the virtual scroll to the carousel's actual scroll range
        newVirtualScrollY = Math.max(carouselMinScroll, Math.min(carouselMaxScroll, newVirtualScrollY));
        
        // This part needs to *drive* the carousel animation without changing actual window.scrollY
        // Map this virtual scroll to the rotation.
        let progress = 0;
        if (newVirtualScrollY <= carouselMinScroll) {
            progress = 0;
        } else if (newVirtualScrollY >= carouselMaxScroll) {
            progress = 1;
        } else {
            progress = (newVirtualScrollY - carouselMinScroll) / carouselScrollHeight;
        }

        const totalRotationAngle = (SERVICES_COUNT - 1) * ROTATE_INCREMENT;
        currentScrollProgress = progress * totalRotationAngle;

        servicesWrapper.style.transform = `rotateX(${-currentScrollProgress}deg)`;
        updateFaceOpacity();

        // If within carousel range, prevent default page scroll
        if (newVirtualScrollY > carouselMinScroll && newVirtualScrollY < carouselMaxScroll) {
             event.preventDefault();
        }
    };

    const handleTouchEnd = (event) => {
        // No specific action needed here if handleTouchMove is continuously updating
        // The release just stops the touch input.
        // The carousel state and actual window.scrollY will then dictate the next behavior.
    };


    // Initialize faces when the DOM is ready
    setupFaces();

    // Re-calculate faceOffset and scroll boundaries on window resize
    window.addEventListener('resize', () => {
        calculateCarouselScrollBoundaries(); // Recalculate boundaries for scroll control
        setupFaces(); // Re-initialize positions and states based on new sizes
    });
    
    // Start observing the carousel container to know when to activate scroll handling
    if (servicesCarouselContainer) {
        servicesCarouselObserver.observe(servicesCarouselContainer);
    }

    // Attach global scroll/touch listeners
    // Wheel event to control desktop scrolling
    window.addEventListener('wheel', handleScroll, { passive: false });
    // Touch events for mobile swiping
    window.addEventListener('touchstart', handleTouchStart, { passive: true }); 
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs to be non-passive for preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Initial call to update carousel animation state in case it's visible on load
    updateCarouselAnimation(); 
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
