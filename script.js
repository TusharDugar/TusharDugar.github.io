// script.js
// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 1200; // Match CSS transition duration for .cube
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a flip
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

    window.dispatchEvent(new Event('scroll'));

    // --- Services Section 3D Cube Animation (Discrete Step) ---
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    if (!cube) {
        console.error("services-cube element not found. 3D cube animation cannot initialize.");
        return;
    }
    
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length;

    let currentRotationAngle = 0; 
    let activeFaceIndex = 0; 
    let isAnimatingCube = false; 
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Calculates the `translateZ` distance for faces to form an 8-sided prism based on height for X-axis rotation
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        
        const faceHeight = cubeContainer.offsetHeight; // Use height for X-axis rotation
        // R = (H/2) / tan(PI/N) formula for a regular N-sided polygon, where H is the dimension along the rotation plane.
        const calculatedOffset = (faceHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        // Return a sensible fallback if calculated value is invalid or too small/large
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

    // Manages opacity and visibility of faces during a 3D transition for rotateX
    function updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, newActiveFaceIndex) {
        if (prefersReducedMotion) {
            // In reduced motion, CSS handles the flattened layout. JS ensures current one is visible.
            // All faces become `position: relative; transform: none; opacity: 1; visibility: visible;`
            // via CSS for reduced motion, so no complex JS opacity/visibility needed here.
            return; 
        }

        faces.forEach((face, i) => {
            face.style.transition = 'opacity 0.01s linear'; // Very short transition for JS to control opacity smoothly
            face.style.visibility = 'hidden'; // Default hidden
            face.style.opacity = 0; // Default transparent
        });

        // Outgoing face fades out (0% to 40% of transition)
        if (faces[prevActiveFaceIndex]) {
            faces[prevActiveFaceIndex].style.visibility = 'visible';
            if (progress <= 0.4) {
                faces[prevActiveFaceIndex].style.opacity = 1 - (progress / 0.4);
            } else {
                faces[prevActiveFaceIndex].style.opacity = 0;
            }
        }

        // Incoming face fades in (60% to 100% of transition)
        if (faces[newActiveFaceIndex]) {
            faces[newActiveFaceIndex].style.visibility = 'visible';
            if (progress >= 0.6) {
                faces[newActiveFaceIndex].style.opacity = (progress - 0.6) / 0.4;
            } else {
                faces[newActiveFaceIndex].style.opacity = 0;
            }
        }
    }

    // Animates the cube to the next/previous face using rotateX
    function animateCube(direction) {
        if (isAnimatingCube || prefersReducedMotion) return false;

        const prevActiveFaceIndex = activeFaceIndex; 
        let newActiveFaceIndex = activeFaceIndex + direction;

        // Loop around for seamless carousel
        if (newActiveFaceIndex < 0) {
            newActiveFaceIndex = SERVICES_COUNT - 1;
        } else if (newActiveFaceIndex >= SERVICES_COUNT) {
            newActiveFaceIndex = 0;
        }

        isAnimatingCube = true;
        activeFaceIndex = newActiveFaceIndex; // Update active index immediately

        currentRotationAngle += direction * ROTATION_INCREMENT_DEG;
        cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.65, 0.05, 0.36, 1)`; // Re-apply transition with easing
        cube.style.transform = `rotateX(${-currentRotationAngle}deg)`; // Dynamic rotateX for the cube
        
        let startTime = null;

        function animateFade(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1); // Animation progress from 0 to 1

            updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, activeFaceIndex);

            if (progress < 1) {
                requestAnimationFrame(animateFade);
            } else {
                // Animation complete - this is the ONLY place to handle completion
                isAnimatingCube = false;
                cube.style.transition = 'none'; // Clear cube transition after animation
                
                // Final state after animation: only the new active face is fully visible
                faces.forEach((face, i) => {
                    face.style.visibility = 'hidden';
                    face.style.opacity = 0;
                });
                if (faces[activeFaceIndex]) {
                    faces[activeFaceIndex].style.visibility = 'visible';
                    faces[activeFaceIndex].style.opacity = 1;
                    faces[activeFaceIndex].style.transition = 'none'; // Clear transition after final state
                }
            }
        }

        requestAnimationFrame(animateFade); // Start the fade animation alongside transform
        
        return true;
    }

    // --- Scroll & Touch Event Handlers for 3D Cube ---
    let lastWheelTime = 0; 
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaY = 0; // Cumulative vertical touch movement

    // Handles global scroll events (desktop wheel)
    window.addEventListener('wheel', (event) => { 
        // Only proceed if 3D animation is enabled
        if (prefersReducedMotion) return;

        const rect = cubeContainer.getBoundingClientRect();
        // Check if the cube container is in a reasonable active viewport area for interaction
        const isCubeInView = rect.top < window.innerHeight - 100 && rect.bottom > 100; // Visible almost fully

        if (!isCubeInView) return; // Not in view, let page scroll normally

        // Prevent rapid-fire wheel events (debounce)
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
            // Cube did not animate (hit boundary, e.g., if there were non-looping logic), allow normal page scroll.
        }
    }, { passive: false }); // Needs to be passive: false to allow preventDefault

    // Handles touch start (mobile)
    cubeContainer.addEventListener('touchstart', (e) => {
        if (prefersReducedMotion) return;
        touchStartX = e.touches[0].clientX; 
        touchStartY = e.touches[0].clientY;
        touchDeltaY = 0; // Reset cumulative delta
    }, { passive: true }); // passive:true for start, performance gain

    // Handles touch move (mobile)
    cubeContainer.addEventListener('touchmove', (e) => {
        if (prefersReducedMotion) return;
        const deltaY = touchStartY - e.touches[0].clientY;
        const deltaX = touchStartX - e.touches[0].clientX; // Check horizontal swipe
        
        // Prevent page scroll only if a significant vertical movement and predominantly vertical
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) { // 10px threshold for meaningful swipe
            e.preventDefault(); 
            touchDeltaY = deltaY; // Accumulate for `touchend` decision
        } else {
            // If horizontal swipe or minor movement, don't preventDefault, allow native scroll
        }
    }, { passive: false }); // passive:false, needed for preventDefault

    // Handles touch end (mobile)
    cubeContainer.addEventListener('touchend', () => {
        if (isAnimatingCube || prefersReducedMotion) return; 

        const rect = cubeContainer.getBoundingClientRect();
        const isCubeInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isCubeInView && Math.abs(touchDeltaY) > SCROLL_THRESHOLD_PX) {
            const direction = touchDeltaY > 0 ? 1 : -1; // Swipe up means scroll down (direction 1)
            animateCube(direction);
        }
        touchStartX = 0; // Reset
        touchStartY = 0; // Reset
        touchDeltaY = 0; // Reset
    }, { passive: true }); // passive:true, interaction finished.


    // Initial setup when DOM is ready
    setTimeout(() => {
        setupCubeFaces(); 
        // If reduced motion is preferred, immediately update visibility to show all faces flat
        if (prefersReducedMotion) {
            // In reduced motion, CSS is configured to show all faces as relative blocks.
            // We just ensure this state is fully applied on load/resize.
            faces.forEach(face => {
                face.style.transition = 'none';
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            });
            cube.style.transform = 'none'; // Ensure cube is also flattened
        }
        // Re-calculate dimensions on window resize (important for responsive cube)
        window.addEventListener('resize', () => {
            setupCubeFaces(); // Re-initialize positions and states based on new sizes
            if (prefersReducedMotion) {
                // For reduced motion on resize, re-apply flattened view explicitly
                faces.forEach(face => {
                    face.style.transition = 'none';
                    face.style.opacity = 1;
                    face.style.visibility = 'visible';
                });
                cube.style.transform = 'none';
            }
        });
    }, 100); // Small delay to allow initial render
});
