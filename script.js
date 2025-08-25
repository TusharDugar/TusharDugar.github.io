// script.js
// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 1200; // UPDATED: Changed from 500ms to 1200ms
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

    // Initialize IntersectionObserver-based animations (for About section, Tools, and other reveal-items)
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

    // Calculates the `translateZ` distance for faces to form a seamless octagon
    function calculateFaceOffset() {
        if (!cubeContainer || SERVICES_COUNT === 0) return 0;
        
        const faceWidth = cubeContainer.offsetWidth; 
        const calculatedOffset = (faceWidth / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        // Use a reasonable fallback if calculated value is invalid or too small/large
        return isNaN(calculatedOffset) || calculatedOffset === 0 ? parseFloat(getComputedStyle(cubeContainer).getPropertyValue('--face-offset')) : calculatedOffset; 
    }

    // Sets up the initial 3D positioning of each face
    function setupCubeFaces() {
        if (!cube || SERVICES_COUNT === 0) return;
        const faceOffset = calculateFaceOffset();
        faces.forEach((face, i) => {
            face.style.transition = 'none'; // Clear transitions for setup
            face.style.visibility = 'hidden';
            face.style.opacity = 0; // Default hidden

            const angleForFace = i * ROTATION_INCREMENT_DEG; // 0, 45, 90...
            face.style.transform = `rotateY(${angleForFace}deg) translateZ(${faceOffset}px)`;
        });

        cube.style.transition = 'none'; // No transition for initial setup of cube's transform
        cube.style.transform = `rotateX(-25deg) rotateY(${-currentRotationAngle}deg)`; 
        
        // Initial visibility: only the first face is active
        if (faces[activeFaceIndex]) {
            faces[activeFaceIndex].style.visibility = 'visible';
            faces[activeFaceIndex].style.opacity = 1;
            faces[activeFaceIndex].style.transition = 'none'; // No transition initially
        }
    }

    // Enhanced updateFaceOpacityAndVisibility for two-face rule and fade timing during animation
    function updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, newActiveFaceIndex) {
        if (prefersReducedMotion) {
            // For reduced motion, ensure only the active face is fully visible
            faces.forEach((face, i) => {
                face.style.visibility = (i === newActiveFaceIndex) ? 'visible' : 'hidden';
                face.style.opacity = (i === newActiveFaceIndex) ? 1 : 0;
                face.style.transition = 'none';
                if (i === newActiveFaceIndex) {
                    face.style.transform = `rotateY(0deg) translateZ(${calculateFaceOffset()}px)`; // Flatten and bring to front if necessary
                } else {
                    face.style.transform = `rotateY(0deg) translateZ(${calculateFaceOffset()}px) rotateY(90deg)`; // Rotate out of flat view
                }
            });
            return;
        }

        faces.forEach((face, i) => {
            face.style.transition = 'opacity 0.01s linear'; // Very short transition for JS to control opacity
            face.style.visibility = 'hidden'; // Default hidden
            face.style.opacity = 0; // Default transparent
        });

        // Outgoing face fade out (from 0% to 40% of transition)
        if (faces[prevActiveFaceIndex]) {
            faces[prevActiveFaceIndex].style.visibility = 'visible';
            if (progress <= 0.4) {
                faces[prevActiveFaceIndex].style.opacity = 1 - (progress / 0.4);
            } else {
                faces[prevActiveFaceIndex].style.opacity = 0;
            }
        }

        // Incoming face fade in (from 60% to 100% of transition)
        if (faces[newActiveFaceIndex]) {
            faces[newActiveFaceIndex].style.visibility = 'visible';
            if (progress >= 0.6) {
                faces[newActiveFaceIndex].style.opacity = (progress - 0.6) / 0.4;
            } else {
                faces[newActiveFaceIndex].style.opacity = 0;
            }
        }
    }

    // Animates the cube to the next/previous face
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
        activeFaceIndex = newActiveFaceIndex;

        currentRotationAngle += direction * ROTATION_INCREMENT_DEG;
        cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.65, 0.05, 0.36, 1)`; // Re-apply transition with easing
        cube.style.transform = `rotateX(-25deg) rotateY(${-currentRotationAngle}deg)`; 
        
        let startTime = null;

        function animateFade(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1); // Animation progress from 0 to 1

            updateFaceOpacityAndVisibility(progress, prevActiveFaceIndex, activeFaceIndex);

            if (progress < 1) {
                requestAnimationFrame(animateFade);
            } else {
                // Animation complete
                isAnimatingCube = false;
                cube.style.transition = 'none'; // Remove transition for discrete control post-animation
                
                // Final state after animation: only the new active face is visible
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

    // --- Scroll & Touch Event Handlers ---
    let lastWheelTime = 0; 
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaY = 0; // Cumulative vertical touch movement

    // Handles global scroll events (desktop wheel)
    window.addEventListener('wheel', (event) => { 
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
            // Cube did not animate (hit boundary), allow normal page scroll.
            // No preventDefault here means the browser will scroll the page.
        }
    }, { passive: false }); // Needs to be passive: false to allow preventDefault

    // Handles touch start (mobile)
    cubeContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX; // Capture X for direction
        touchStartY = e.touches[0].clientY;
        touchDeltaY = 0; // Reset cumulative delta
    }, { passive: true }); // passive:true for start, performance gain

    // Handles touch move (mobile)
    cubeContainer.addEventListener('touchmove', (e) => {
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
        if (isAnimatingCube || prefersReducedMotion) return; // Prevent new animation if one is in progress

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
        // Re-calculate dimensions on window resize (important for responsive cube)
        window.addEventListener('resize', () => {
            setupCubeFaces(); // Re-initialize positions and states based on new sizes
        });
    }, 100); // Small delay to allow initial render
});
