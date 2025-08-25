// script.js
// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 1200; // Match CSS transition duration for .cube
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a swipe
const SCROLL_DEBOUNCE_TIME_MS = 100; // Prevent rapid-fire wheel events from stacking

// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const valueElement = button.querySelector('.button-value');
    const value = valueElement ? valueElement.textContent.trim() : ''; // Trim whitespace

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
                // Fallback for older browsers or if clipboard API fails (e.g., execCommand)
                const textarea = document.createElement('textarea');
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.classList.remove('copied');
                    }, 2000);
                } catch (ex) {
                    console.error('Failed to copy using execCommand: ', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
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
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }

        // Handle reveal-item (single item reveal like headers, individual cards, 3D cube container)
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        // Handle reveal-parent (for About section staggered children)
        else if (entry.target.classList.contains("reveal-parent")) {
          // Select ALL direct and indirect .reveal-child elements within this parent
          const childrenToStagger = entry.target.querySelectorAll(".reveal-child"); 
          
          childrenToStagger.forEach((child, index) => {
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
  let current = ""; 
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });
});


// Mouse Follower Glow (implementation)
document.addEventListener('DOMContentLoaded', () => {
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            // Using requestAnimationFrame for smooth mouse tracking for performance
            requestAnimationFrame(() => {
                mouseFollowerGlow.style.transform = `translate(-50%, -50%) translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
            });
        });
    }

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Tools, Contact, and the 3D cube container itself)
    initIntersectionObserverAnimations();

    // --- Services Section 3D Cube Animation (Discrete Step) ---
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper'); // The new wrapper div for pinning
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube'); // Corrected ID usage from HTML
    
    // Log elements to confirm they are found
    console.log("DOMContentLoaded triggered");
    console.log({ servicesSection, servicesPinWrapper, cubeContainer, cube });

    if (!servicesSection || !servicesPinWrapper || !cubeContainer || !cube) {
        console.error("Missing key elements. Aborting cube animation setup.");
        return; // Exit if elements are missing
    }
    
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length; // Should be 8.

    let currentRotationAngle = 0; // Tracks the cube's rotation for the active face
    let activeFaceIndex = 0;      // Index of the face currently 'front'
    let isCubeTransitioning = false;  // Flag to prevent multiple animations at once
    let isServicesSectionPinned = false; // Flag for pinning state
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Calculates the `translateZ` distance for faces to form an 8-sided prism based on height for X-axis rotation
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        
        const faceHeight = cubeContainer.offsetHeight; // Use height for X-axis rotation
        // R = (H/2) / tan(PI/N) formula for a regular N-sided polygon, where H is the dimension along the rotation plane.
        // This is the apothem (distance from center to face).
        const calculatedOffset = (faceHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        return isNaN(calculatedOffset) || calculatedOffset === 0 ? 300 : calculatedOffset; // Default to 300px if calculation fails
    }

    // Sets up the initial 3D positioning of each face for rotateX
    function setupCubeFaces() {
        if (prefersReducedMotion || !cube || SERVICES_COUNT === 0) {
            // If reduced motion or elements are missing, ensure faces are displayed flat/stacked
            faces.forEach(face => {
                face.style.transition = 'none';
                face.style.visibility = 'visible';
                face.style.opacity = 1;
                face.style.position = 'relative'; // Stack them
                face.style.transform = 'none'; // Flatten any 3D transforms
            });
            if (cube) cube.style.transform = 'none'; // Flatten cube
            return;
        }

        const faceOffset = calculateFaceOffset();

        faces.forEach((face, i) => {
            face.style.transition = 'none'; // Clear transitions for setup
            face.style.visibility = 'hidden'; // Hide all initially
            face.style.opacity = 0; // Set opacity to 0

            const angleForFace = i * ROTATION_INCREMENT_DEG;
            // Position faces around the X-axis for a vertical prism
            face.style.transform = `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`;
        });

        cube.style.transition = 'none'; // No transition for initial cube setup
        cube.style.transform = `rotateX(${-currentRotationAngle}deg)`; // Apply initial cube rotation (dynamic X-axis)
        
        // Initial visibility: only the first face is fully visible
        if (faces[activeFaceIndex]) {
            faces[activeFaceIndex].style.visibility = 'visible';
            faces[activeFaceIndex].style.opacity = 1;
        }
    }

    // Animates the cube to the next/previous face using rotateX
    function animateCube(direction) {
        // console.log("Animating cube in direction:", direction, "Current index:", activeFaceIndex); // Debug log
        if (isCubeTransitioning || prefersReducedMotion) return false;

        let nextActiveFaceIndex = activeFaceIndex + direction;

        // Determine if we hit a boundary that should allow page scroll
        const atStartBoundary = activeFaceIndex === 0 && direction === -1;
        const atEndBoundary = activeFaceIndex === SERVICES_COUNT - 1 && direction === 1;

        if (atStartBoundary || atEndBoundary) {
            // Cube animation cannot proceed, signal to unpin/scroll page
            return false; 
        }

        // Valid rotation, update the active face
        const previousActiveFaceIndex = activeFaceIndex;
        activeFaceIndex = nextActiveFaceIndex;

        isCubeTransitioning = true; // Set flag to block new animations

        // Hide the previous active face content immediately (with a subtle fade from CSS)
        if (faces[previousActiveFaceIndex]) {
            faces[previousActiveFaceIndex].style.opacity = 0;
            // visibility hidden is applied after opacity transition for accessibility/DOM interaction
            setTimeout(() => {
                if (!isServicesSectionPinned) return; // Only hide if still pinned
                faces[previousActiveFaceIndex].style.visibility = 'hidden';
            }, 300); // Matches face opacity transition duration
        }

        // Calculate new rotation angle
        currentRotationAngle += direction * ROTATION_INCREMENT_DEG;

        // Apply the transition to the cube's rotation
        cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
        cube.style.transform = `rotateX(${-currentRotationAngle}deg)`;

        // Listen for the end of the CSS transform transition on the cube
        const onTransitionEnd = () => {
            cube.removeEventListener('transitionend', onTransitionEnd); // Clean up listener
            
            // After transition, make the new active face visible and opaque
            if (faces[activeFaceIndex]) {
                faces[activeFaceIndex].style.visibility = 'visible';
                faces[activeFaceIndex].style.opacity = 1;
            }

            isCubeTransitioning = false; // Reset flag
            cube.style.transition = 'none'; // Clear transition property to prevent interference on subsequent direct transforms
        };

        cube.addEventListener('transitionend', onTransitionEnd);

        return true; // Cube animation successfully started
    }


    // --- Manual Scroll Pinning and Locking for Services Section ---
    const servicesPinObserver = new IntersectionObserver((entries) => {
        if (prefersReducedMotion) return; // Disable pinning/locking for reduced motion

        entries.forEach(entry => {
            console.log('Observer fired (servicesPinWrapper):', { // Debug log
                targetId: entry.target.id,
                isIntersecting: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio,
                isServicesSectionPinned: isServicesSectionPinned // Log current state
            });
            
            if (entry.target.id === 'services-pin-wrapper') {
                if (entry.isIntersecting && entry.intersectionRatio > 0) { // When servicesPinWrapper is at least partly visible
                    if (!isServicesSectionPinned) {
                        servicesSection.classList.add('is-pinned');
                        isServicesSectionPinned = true;
                        document.body.style.overflow = 'hidden'; // Lock page scroll
                        console.log('SERVICES SECTION PINNED! Body overflow hidden.'); // Debug log
                    }
                } else { // servicesPinWrapper has left the viewport (either above or below)
                    if (isServicesSectionPinned) { // Only unpin if it was previously pinned
                        servicesSection.classList.remove('is-pinned');
                        isServicesSectionPinned = false;
                        document.body.style.overflow = 'auto'; // Unlock page scroll
                        console.log('SERVICES SECTION UNPINNED! Body overflow auto.'); // Debug log
                    }
                }
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '0px',
        threshold: [0, 0.1, 0.9, 1] // Observe when any part enters/leaves, and when nearly full
    });

    servicesPinObserver.observe(servicesPinWrapper);

    // --- Manual Wheel/Touch Event Handlers for Cube Rotation & Page Scroll ---
    let lastWheelTime = 0; 
    let lastTouchY = 0;
    let touchMoveAccumulator = 0; // Accumulate small touch deltas

    const handleScrollEvent = (event) => {
        // console.log("Scroll event fired, isPinned:", isServicesSectionPinned, "Animating:", isCubeTransitioning); // Debug log

        if (prefersReducedMotion) return;

        // If the services section is pinned, prevent default page scroll and handle cube rotation
        if (isServicesSectionPinned) {
            event.preventDefault(); // Always prevent default if currently pinned
            
            const now = Date.now();
            if (now - lastWheelTime < SCROLL_DEBOUNCE_TIME_MS) {
                return; // Debounce rapid wheel events
            }
            lastWheelTime = now;

            const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up
            const didAnimate = animateCube(direction);

            if (!didAnimate) {
                // If animateCube returns false (hit boundary),
                // it means the cube cannot rotate further.
                // We must explicitly unpin the section and re-enable body scroll.
                servicesSection.classList.remove('is-pinned');
                isServicesSectionPinned = false;
                document.body.style.overflow = 'auto'; 
                console.log('Unpinning at boundary, re-enabling page scroll.'); // Debug log
            }
        }
    };

    const handleTouchStart = (e) => {
        if (prefersReducedMotion || !isServicesSectionPinned) return;
        lastTouchY = e.touches[0].clientY;
        touchMoveAccumulator = 0; // Reset accumulator
        // If pinned, prevent default on start to reduce initial native scroll attempt
        e.preventDefault(); 
    };

    const handleTouchMove = (e) => {
        if (prefersReducedMotion || !isServicesSectionPinned || isCubeTransitioning) return;

        const currentTouchY = e.touches[0].clientY;
        const deltaY = lastTouchY - currentTouchY; // Positive for swipe up (scroll down), negative for swipe down (scroll up)
        lastTouchY = currentTouchY; // Update for next move

        touchMoveAccumulator += deltaY;

        if (Math.abs(touchMoveAccumulator) > SCROLL_THRESHOLD_PX) {
            e.preventDefault(); // Prevent page scroll if significant swipe
            const direction = touchMoveAccumulator > 0 ? 1 : -1; // Swipe up (positive accumulator) is scroll down (dir 1)
            const didAnimate = animateCube(direction);
            
            if (!didAnimate) {
                // Cube hit boundary, unpin and allow page scroll
                servicesSection.classList.remove('is-pinned');
                isServicesSectionPinned = false;
                document.body.style.overflow = 'auto';
                console.log('Unpinning at touch boundary, re-enabling page scroll.'); // Debug log
            }
            touchMoveAccumulator = 0; // Reset accumulator after processing a swipe
        } else {
            e.preventDefault(); // Still prevent default if pinned, even if not enough delta for cube rotation
        }
    };

    // Use passive: false to allow event.preventDefault() for scroll locking
    window.addEventListener('wheel', handleScrollEvent, { passive: false });
    servicesPinWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    servicesPinWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });


    // Initial setup and resize handling
    const initializeServices = () => {
        // Run setupCubeFaces which internally checks for prefersReducedMotion
        setupCubeFaces(); 

        if (prefersReducedMotion) {
            servicesSection.classList.remove('is-pinned');
            isServicesSectionPinned = false; // Ensure flag is false
            document.body.style.overflow = 'auto';
            // Stop observing if reduced motion is preferred
            servicesPinObserver.unobserve(servicesPinWrapper); 
            console.log('Reduced motion active: Services section initialized flat.'); // Debug log
        } else {
            // Ensure section is not pinned initially and body is scrollable
            servicesSection.classList.remove('is-pinned');
            isServicesSectionPinned = false; // Ensure flag is false
            document.body.style.overflow = 'auto'; // Make sure body is scrollable by default
            
            // Start observing the pin wrapper
            // Remove previous observation if any, then re-observe to ensure fresh state
            try { servicesPinObserver.unobserve(servicesPinWrapper); } catch (e) { /* ignore if not observed */ }
            servicesPinObserver.observe(servicesPinWrapper);
            console.log('Services section initialized for 3D animation and pinning.'); // Debug log
        }
    };

    window.addEventListener('resize', initializeServices);
    initializeServices(); // Call on initial load

    // Trigger a scroll event immediately to ensure initial IntersectionObserver checks
    // This is still good practice to ensure the observer fires early.
    window.dispatchEvent(new Event('scroll'));
});
