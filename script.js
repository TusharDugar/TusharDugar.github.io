// Global constants for animation timing
const ROTATE_INCREMENT = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
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

        // 1. Determine `faceOffset` (radius of the octagon for `translateZ`)
        // The side length of the octagon is the width of the card.
        // Radius R = (side_length / 2) / tan(PI / N)
        // Here, side_length = servicesCarouselContainer.offsetWidth
        faceOffset = (servicesCarouselContainer.offsetWidth / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        if (faceOffset === 0 || isNaN(faceOffset)) {
            console.warn("Could not determine faceOffset dynamically. Using fallback value.");
            faceOffset = 300; // Absolute fallback if calculation fails
        }
        servicesCarouselContainer.style.setProperty('--face-offset', `${faceOffset}px`); // Set CSS variable

        // 2. Position each face statically within the wrapper to form the octagonal prism
        servicesFaces.forEach((face, i) => {
            face.style.transition = 'none'; // Clear transitions for setup
            face.style.opacity = 0; // Start hidden
            face.style.visibility = 'hidden';

            const angleForFace = i * ROTATE_INCREMENT; // Each face is rotated by 45deg from the next/prev
            face.style.transform = `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`;
        });

        // 3. Define the scrollable height for the services section
        // We want (SERVICES_COUNT) full viewport heights dedicated to the animation for a smooth scrub.
        const viewportHeight = window.innerHeight;
        // Total scroll needed to flip through all cards
        totalAnimationScrollHeight = SERVICES_COUNT * viewportHeight * SCROLL_FACTOR_PER_CARD; // One full viewport height per card transition

        // 4. Calculate the precise scroll range for the carousel animation
        const sectionRect = servicesSection.getBoundingClientRect();
        const sectionTopAbsolute = sectionRect.top + window.scrollY;

        // The carousel animation starts when the section itself is just entering the viewport
        scrollRangeStart = sectionTopAbsolute;
        
        // The carousel animation ends after the scrollable height for all cards has been traversed
        // Adding container.offsetHeight as buffer to ensure it stays in view during last scroll portion
        scrollRangeEnd = scrollRangeStart + totalAnimationScrollHeight;

        // Ensure the services section has enough height to allow scrolling through the animation
        // This makes the `services-section` element vertically "stretch" in the document.
        servicesSection.style.minHeight = `${totalAnimationScrollHeight + servicesCarouselContainer.offsetHeight + viewportHeight * 0.5}px`; 
        // Added buffer for scroll before/after the interactive zone.

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

        // Calculate the total rotation based on progress (from 0 to (SERVICES_COUNT)*ROTATE_INCREMENT degrees)
        // Multiply by SERVICES_COUNT, not (SERVICES_COUNT - 1), because we are mapping scroll to rotation of the *wrapper*,
        // which will rotate 360 degrees if we were looping through all 8 faces in an 8-sided prism.
        // For non-looping, we stop after 7 full 45-degree rotations.
        const totalRotationDegrees = progress * SERVICES_COUNT * ROTATE_INCREMENT; // 8 * 45 = 360 degrees for full cycle

        // Apply rotation to the wrapper. Negative rotation visually scrolls down as scrollY increases.
        servicesWrapper.style.transform = `rotateX(${-totalRotationDegrees}deg)`;

        // Update face visibility/opacity based on the current rotation angle
        updateFaceVisibility(totalRotationDegrees);
    }

    // Dynamically update opacity and visibility of faces based on the wrapper's current rotation
    function updateFaceVisibility(currentTotalRotationDegrees) {
        servicesFaces.forEach((face, i) => {
            const faceIndex = parseInt(face.dataset.index, 10); // Get actual index from data-index attribute

            // Calculate the face's effective current angle relative to the viewport's front (0deg)
            // It's the face's static position angle minus the wrapper's current total rotation.
            let effectiveAngle = (faceIndex * ROTATE_INCREMENT - currentTotalRotationDegrees) % 360;

            // Normalize angle to be within -180 to 180 for easier logic (front is 0, top -90, bottom 90, back 180/-180)
            if (effectiveAngle > 180) effectiveAngle -= 360;
            if (effectiveAngle < -180) effectiveAngle += 360;

            // Opacity calculation for fading:
            // - Fully opaque when directly front-facing (effectiveAngle ~0)
            // - Fades out as it rotates towards +/-90 degrees (top/bottom)
            // - Fully transparent when beyond +/-90 degrees (going to back or from back)
            let opacity = 0;
            const thresholdAngle = ROTATE_INCREMENT / 2; // e.g., 22.5 degrees for 45deg increment

            if (Math.abs(effectiveAngle) < ROTATE_INCREMENT) { // If it's rotating through the front +/- 45 deg or so
                // Linear fade: 1 at 0deg, 0 at +/-45deg
                opacity = 1 - (Math.abs(effectiveAngle) / ROTATE_INCREMENT);
                opacity = Math.max(0, Math.min(1, opacity)); // Clamp between 0 and 1
            } else if (Math.abs(effectiveAngle) > 360 - ROTATE_INCREMENT) { // For wrap-around when nearing 360 or 0
                // Handle wrap-around effect if needed, but the basic rotation takes care of it
                // For a simpler approach, only consider angles around the front
            }

            // Apply opacity and visibility
            face.style.opacity = opacity;
            face.style.visibility = (opacity > 0.01) ? 'visible' : 'hidden'; // Keep visible if even slightly opaque
            face.style.transition = `opacity 0.15s ease-out`; // Smooth opacity changes
        });
    }

    // --- Event Handlers ---
    
    // Observer for the services section to know when it's in view
    const servicesSectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            // This flag is crucial for conditional scroll handling
            isServicesCarouselVisible = entry.isIntersecting;
            if (isServicesCarouselVisible) {
                // When section becomes visible, ensure dimensions are recalculated
                calculateDynamicDimensions();
                updateCarouselAnimation(); // Update animation immediately to current scroll position
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the section is visible

    // Global scroll handler (desktop)
    const handleGlobalScroll = (event) => {
        // Prevent default only if scroll is within the carousel's active range AND it's visible
        const currentWindowScrollY = window.scrollY;
        const isActiveScrollRange = currentWindowScrollY >= scrollRangeStart && currentWindowScrollY <= scrollRangeEnd;

        if (isServicesCarouselVisible && isActiveScrollRange) {
            event.preventDefault(); // Block normal page scroll
        }
        
        // Request animation frame to update carousel animation, always
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updateCarouselAnimation);
        }
    };

    // Touch event handlers (mobile)
    let initialTouchY = 0;
    let initialScrollYOnTouchStart = 0; // window.scrollY when touch started

    const handleTouchStart = (event) => {
        if (!isServicesCarouselVisible) return;
        initialTouchY = event.touches[0].clientY;
        initialScrollYOnTouchStart = window.scrollY; // Capture scroll position at touch start
    };

    const handleTouchMove = (event) => {
        if (!isServicesCarouselVisible) return;

        const currentTouchY = event.touches[0].clientY;
        const deltaTouchY = currentTouchY - initialTouchY;

        // Map touch delta to a virtual scroll position
        // This is a direct simulation of scroll, so we calculate a new window.scrollY equivalent
        const newVirtualScrollY = initialScrollYOnTouchStart - deltaTouchY;

        // Clamp the virtual scroll to the carousel's actual scroll range to ensure non-looping at boundaries
        const clampedVirtualScrollY = Math.max(scrollRangeStart, Math.min(scrollRangeEnd, newVirtualScrollY));
        
        // Only prevent default if we are within or trying to enter the carousel's active scroll range
        const isTouchingCarouselActiveRange = window.scrollY >= scrollRangeStart && window.scrollY <= scrollRangeEnd;
        
        if (isTouchingCarouselActiveRange || (newVirtualScrollY >= scrollRangeStart && newVirtualScrollY <= scrollRangeEnd)) {
            event.preventDefault(); // Prevent default page scroll
            // Manually scroll the window to the new virtual position.
            // This then triggers our `handleGlobalScroll` via the browser's native scroll event.
            window.scrollTo({
                top: clampedVirtualScrollY,
                behavior: 'auto' // Crucial: 'auto' for immediate scroll response to touch
            });
        }
    };

    // --- Initialization and Event Listeners ---
    
    // Initial setup of faces and calculation of dimensions/scroll ranges
    calculateDynamicDimensions(); // Call once initially

    // Re-calculate dimensions and scroll boundaries on window resize
    window.addEventListener('resize', () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId); // Cancel any pending animation frame
        animationFrameId = requestAnimationFrame(() => {
            calculateDynamicDimensions(); // Recalculate everything
            updateCarouselAnimation(); // Apply new state immediately
            animationFrameId = null;
        });
    });
    
    // Start observing the services section for scroll interaction
    if (servicesSection) {
        servicesSectionObserver.observe(servicesSection);
    }

    // Attach global scroll/touch listeners
    // Wheel event to control desktop scrolling
    window.addEventListener('scroll', handleGlobalScroll, { passive: false }); // Needs to be non-passive for preventDefault
    // Touch events for mobile swiping
    window.addEventListener('touchstart', handleTouchStart, { passive: true }); 
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // Needs to be non-passive to call preventDefault
    window.addEventListener('touchend', handleTouchEnd, { passive: true }); // No preventDefault needed here

    // Initial call to update carousel animation state in case it's visible on load
    updateCarouselAnimation(); 
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
