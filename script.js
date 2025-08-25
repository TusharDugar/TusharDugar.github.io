// script.js
// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 1200; // Match CSS transition duration for .cube
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a swipe
const SCROLL_DEBOUNCE_TIME_MS = 50; // Prevent rapid-fire wheel events from stacking

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
            mouseFollowerGlow.style.transform = `translate(-50%, -50%) translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
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
    const cube = document.getElementById('services-cube');
    
    if (!servicesSection || !servicesPinWrapper || !cubeContainer || !cube) {
        console.error("One or more required elements for Services 3D cube animation not found.");
        return;
    }
    
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length; // Should be 8.

    let currentRotationAngle = 0; // Tracks the cube's rotation for the active face
    let activeFaceIndex = 0;      // Index of the face currently 'front'
    let isAnimatingCube = false;  // Flag to prevent multiple animations at once
    let isServicesSectionPinned = false; // Flag for pinning state
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Calculates the `translateZ` distance for faces to form an 8-sided prism based on height for X-axis rotation
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        
        const faceHeight = cubeContainer.offsetHeight; // Use height for X-axis rotation
        // R = (H/2) / tan(PI/N) formula for a regular N-sided polygon, where H is the dimension along the rotation plane.
        const calculatedOffset = (faceHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        return isNaN(calculatedOffset) || calculatedOffset === 0 ? 300 : calculatedOffset; // Default to 300px if calculation fails
    }

    // Sets up the initial 3D positioning of each face for rotateX
    function setupCubeFaces() {
        if (!cube || SERVICES_COUNT === 0) return;
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

    // Manages opacity and visibility of faces during a 3D transition for rotateX (instant snaps)
    function updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, newActiveFaceIndex) {
        if (prefersReducedMotion) {
            // In reduced motion, CSS handles the flattened layout and visibility.
            return; 
        }

        faces.forEach((face, i) => {
            face.style.transition = 'none'; // Instant opacity changes
            face.style.visibility = 'hidden'; // Default hidden
            face.style.opacity = 0; // Default transparent
        });

        // Outgoing face snaps to opacity: 0 at 50% progress
        if (faces[prevActiveFaceIndex]) { // The old face
            faces[prevActiveFaceIndex].style.visibility = 'visible';
            if (progress < 0.5) { // Visible until just before 50%
                faces[prevActiveFaceIndex].style.opacity = 1;
            } else { // Instantly hidden at 50% and beyond
                faces[prevActiveFaceIndex].style.opacity = 0;
            }
        }

        // Incoming face snaps to opacity: 1 at 50% progress
        if (faces[newActiveFaceIndex]) { // The new face
            faces[newActiveFaceIndex].style.visibility = 'visible';
            if (progress < 0.5) { // Hidden until just before 50%
                faces[newActiveFaceIndex].style.opacity = 0;
            } else { // Instantly visible at 50% and beyond
                faces[newActiveFaceIndex].style.opacity = 1;
            }
        }
    }

    // Animates the cube to the next/previous face using rotateX
    function animateCube(direction) {
        if (isAnimatingCube || prefersReducedMotion) return false;

        let targetActiveFaceIndex = activeFaceIndex + direction;

        // Determine if we hit a boundary that should allow page scroll
        const willHitStartBoundary = activeFaceIndex === 0 && direction === -1;
        const willHitEndBoundary = activeFaceIndex === SERVICES_COUNT - 1 && direction === 1;

        if (willHitStartBoundary || willHitEndBoundary) {
            // Cube animation cannot proceed, signal to unpin/scroll page
            return false; 
        }

        const prevActiveFaceIndex = activeFaceIndex; 
        activeFaceIndex = targetActiveFaceIndex;

        isAnimatingCube = true;

        currentRotationAngle += direction * ROTATION_INCREMENT_DEG;
        cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1)`; // Ensure easing is applied
        cube.style.transform = `rotateX(${-currentRotationAngle}deg)`; 
        
        let startTime = null;
        let animationFrameId;

        function animateFade(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

            updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, activeFaceIndex);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateFade);
            } else {
                isAnimatingCube = false;
                cube.style.transition = 'none'; // Clear transition after animation
                
                faces.forEach((face, i) => {
                    face.style.visibility = 'hidden';
                    face.style.opacity = 0;
                });
                if (faces[activeFaceIndex]) {
                    faces[activeFaceIndex].style.visibility = 'visible';
                    faces[activeFaceIndex].style.opacity = 1;
                    faces[activeFaceIndex].style.transition = 'none';
                }
            }
        }

        animationFrameId = requestAnimationFrame(animateFade);
        return true; // Cube animation started
    }


    // --- Manual Scroll Pinning and Locking for Services Section ---
    const servicesPinObserver = new IntersectionObserver((entries) => {
        if (prefersReducedMotion) return; // Disable pinning/locking for reduced motion

        entries.forEach(entry => {
            const servicesSectionRect = servicesSection.getBoundingClientRect(); // Get rect of the actual section
            const viewportHeight = window.innerHeight;
            
            // Pin when the top of the services section hits near the top of the viewport
            // and the bottom of the services section is still within or below the viewport.
            // This is a robust check for when the section is "active" in the view.
            if (servicesSectionRect.top <= 0 && servicesSectionRect.bottom >= viewportHeight) {
                 if (!isServicesSectionPinned) {
                    servicesSection.classList.add('is-pinned');
                    isServicesSectionPinned = true;
                    document.body.style.overflow = 'hidden'; // Lock page scroll
                }
            } else {
                // Unpin logic: if section is pinned and it's no longer fully visible (or scrolling past its wrapper)
                if (isServicesSectionPinned) {
                    servicesSection.classList.remove('is-pinned');
                    isServicesSectionPinned = false;
                    document.body.style.overflow = 'auto'; // Unlock page scroll
                }
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '0px',
        threshold: [0, 0.01, 0.99, 1] // Observe when entering, leaving, and fully visible
    });

    servicesPinObserver.observe(servicesPinWrapper);

    // --- Manual Wheel/Touch Event Handlers for Cube Rotation & Page Scroll ---
    let lastWheelTime = 0; 
    let lastTouchY = 0;

    const handleScrollEvent = (event) => {
        if (prefersReducedMotion) return;

        // If the services section is pinned, prevent default page scroll and handle cube rotation
        if (isServicesSectionPinned) {
            event.preventDefault(); 
            
            const now = Date.now();
            if (now - lastWheelTime < SCROLL_DEBOUNCE_TIME_MS) {
                return; // Debounce rapid wheel events
            }
            lastWheelTime = now;

            const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up
            const didAnimate = animateCube(direction);

            if (!didAnimate) {
                // If animateCube returns false (hit boundary 01 or 08),
                // it means the cube cannot rotate further. Unpin the section
                // to allow the user to scroll to the next/previous section.
                servicesSection.classList.remove('is-pinned');
                isServicesSectionPinned = false;
                document.body.style.overflow = 'auto'; 

                // Attempt to initiate page scroll slightly after unpinning
                // This makes the transition feel more natural.
                window.scrollBy({ top: direction * 50, behavior: 'smooth' }); 
            }
        }
    };

    const handleTouchStart = (e) => {
        if (prefersReducedMotion || !isServicesSectionPinned) return;
        lastTouchY = e.touches[0].clientY;
        // Don't prevent default here to allow native scroll if not pinned
    };

    const handleTouchMove = (e) => {
        if (prefersReducedMotion || !isServicesSectionPinned || isAnimatingCube) return;

        const currentTouchY = e.touches[0].clientY;
        const touchDelta = lastTouchY - currentTouchY; // Positive for swipe up, negative for swipe down

        if (Math.abs(touchDelta) > SCROLL_THRESHOLD_PX) {
            e.preventDefault(); // Prevent page scroll if significant swipe
            const direction = touchDelta > 0 ? 1 : -1; // Swipe up (delta > 0) is scroll down (dir 1)
            const didAnimate = animateCube(direction);
            
            if (!didAnimate) {
                // Unpin if at boundary
                servicesSection.classList.remove('is-pinned');
                isServicesSectionPinned = false;
                document.body.style.overflow = 'auto';
                window.scrollBy({ top: direction * 50, behavior: 'smooth' }); 
            }
            lastTouchY = currentTouchY; // Reset for next move detection
        }
    };

    window.addEventListener('wheel', handleScrollEvent, { passive: false });
    // Use the #services-pin-wrapper for touch events to ensure event listener is active over the entire scroll area
    servicesPinWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    servicesPinWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });


    // Initial setup and resize handling
    const initializeServices = () => {
        setupCubeFaces(); 

        if (prefersReducedMotion) {
            servicesSection.classList.remove('is-pinned');
            document.body.style.overflow = 'auto';
            faces.forEach(face => {
                face.style.transition = 'none';
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            });
            cube.style.transform = 'none';
            if (cubeContainer) {
                cubeContainer.style.position = 'relative'; // Revert cube-container sticky/transform
                cubeContainer.style.top = 'auto';
                cubeContainer.style.transform = 'none';
            }
            servicesPinObserver.unobserve(servicesPinWrapper); // Stop observing
        } else {
            // Ensure section is not pinned initially and body is scrollable
            servicesSection.classList.remove('is-pinned');
            document.body.style.overflow = 'auto';
            // Start observing the pin wrapper if not already
            servicesPinObserver.observe(servicesPinWrapper);
        }
    };

    window.addEventListener('resize', initializeServices);
    initializeServices(); // Call on initial load

    // Trigger a scroll event immediately to ensure initial IntersectionObserver checks
    window.dispatchEvent(new Event('scroll'));
});
