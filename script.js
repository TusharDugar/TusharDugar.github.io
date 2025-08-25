// script.js
// Global constants for animation timing
const ROTATION_INCREMENT_DEG = 45; // Degrees for an 8-sided prism (360 / 8 = 45)
const ANIMATION_DURATION_MS = 1200; // Match CSS transition duration for .cube
const SCROLL_DEBOUNCE_TIME_MS = 50; // Debounce for very rapid scroll events (though ScrollTrigger handles most)

// GSAP and ScrollTrigger registration
gsap.registerPlugin(ScrollTrigger);

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
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    
    if (!servicesSection || !cubeContainer || !cube) {
        console.error("One or more required elements for Services 3D cube animation not found.");
        return;
    }
    
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length; // Should be 8.

    let currentRotationAngle = 0; // Tracks the cube's rotation for the active face
    let activeFaceIndex = 0;      // Index of the face currently 'front'
    let isAnimatingCube = false;  // Flag to prevent multiple animations at once
    
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

        // Outgoing face snaps to opacity: 0 at 40% progress
        if (faces[prevActiveFaceIndex]) {
            faces[prevActiveFaceIndex].style.visibility = 'visible';
            if (progress <= 0.4) {
                faces[prevActiveFaceIndex].style.opacity = 1; // Full opacity until 40%
            } else {
                faces[prevActiveFaceIndex].style.opacity = 0; // Instantly hidden after 40%
            }
        }

        // Incoming face snaps to opacity: 1 at 60% progress
        if (faces[newActiveFaceIndex]) {
            faces[newActiveFaceIndex].style.visibility = 'visible';
            if (progress >= 0.6) {
                faces[newActiveFaceIndex].style.opacity = 1; // Instantly visible after 60%
            } else {
                faces[newActiveFaceIndex].style.opacity = 0; // Hidden until 60%
            }
        }
    }

    // Refactored function to rotate cube to a specific face index (called by ScrollTrigger)
    function rotateCubeToFace(targetFaceIndex, direction) {
        if (isAnimatingCube || prefersReducedMotion) return;

        const prevActiveFaceIndex = activeFaceIndex; 
        activeFaceIndex = targetFaceIndex; // Update active index

        isAnimatingCube = true;

        currentRotationAngle = targetFaceIndex * ROTATION_INCREMENT_DEG; // Set rotation directly

        cube.style.transition = `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.65, 0.05, 0.36, 1)`; 
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
                // Animation complete
                isAnimatingCube = false;
                cube.style.transition = 'none';
                
                // Final state after animation: only the new active face is fully visible
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
    }

    // --- GSAP ScrollTrigger for Pinning, Snapping, and Scroll Lock ---
    if (!prefersReducedMotion) {
        ScrollTrigger.create({
            trigger: servicesSection,
            start: "center center", // Pin when the middle of the section hits the middle of the viewport
            end: () => `+=${window.innerHeight * (SERVICES_COUNT - 1)}`, // Scroll duration for all faces
            pin: true,
            snap: {
                snapTo: 1 / (SERVICES_COUNT - 1), // Snap to each face (0, 1/7, 2/7, ..., 1)
                duration: {min: 0.2, max: 0.8}, // Snap animation duration
                ease: "power1.inOut" // Snap easing
            },
            onUpdate: (self) => {
                const progress = self.progress; // 0 to 1 over the entire pinned section
                const targetFace = Math.round(progress * (SERVICES_COUNT - 1)); // Target face index (0 to 7)

                // Only trigger rotation if the target face has changed and no animation is in progress
                if (targetFace !== activeFaceIndex && !isAnimatingCube) {
                    const direction = targetFace > activeFaceIndex ? 1 : -1;
                    rotateCubeToFace(targetFace, direction);
                }
            },
            // Scroll Lock: onEnter/onLeave manage body overflow
            onEnter: () => { 
                document.body.style.overflow = 'hidden'; 
                // Ensure initial state for cube if entering from above
                if (activeFaceIndex !== 0) { // If entering not at face 0, reset to 0
                    rotateCubeToFace(0, -1);
                }
            },
            onLeaveBack: () => { 
                document.body.style.overflow = 'auto'; // Allow scroll up
                // Ensure state for cube if leaving back upwards
                if (activeFaceIndex !== 0) {
                    rotateCubeToFace(0, -1); // Reset to face 0
                }
            },
            onLeave: () => { 
                document.body.style.overflow = 'auto'; // Allow scroll down
                // Ensure state for cube if leaving downwards
                if (activeFaceIndex !== SERVICES_COUNT - 1) {
                    rotateCubeToFace(SERVICES_COUNT - 1, 1); // Reset to last face
                }
            },
            onEnterBack: () => { 
                document.body.style.overflow = 'hidden'; // Lock scroll on re-entering
                // Ensure state for cube if re-entering from below
                if (activeFaceIndex !== SERVICES_COUNT - 1) {
                    rotateCubeToFace(SERVICES_COUNT - 1, 1); // Reset to last face
                }
            }
        });
    }


    // Initial setup when DOM is ready
    setTimeout(() => {
        setupCubeFaces(); 
        // If reduced motion is preferred, immediately update visibility to show all faces flat
        if (prefersReducedMotion) {
            faces.forEach(face => {
                face.style.transition = 'none';
                face.style.opacity = 1;
                face.style.visibility = 'visible';
            });
            cube.style.transform = 'none'; // Ensure cube is also flattened
            // Remove ScrollTrigger if exists for reduced motion
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            document.body.style.overflow = 'auto'; // Ensure body is scrollable
        }
        // Recalculate dimensions on window resize (important for responsive cube)
        window.addEventListener('resize', () => {
            setupCubeFaces(); // Re-initialize positions and states based on new sizes
            if (prefersReducedMotion) {
                faces.forEach(face => {
                    face.style.transition = 'none';
                    face.style.opacity = 1;
                    face.style.visibility = 'visible';
                });
                cube.style.transform = 'none';
            }
            // Refresh ScrollTrigger positions on resize
            ScrollTrigger.refresh();
        });
    }, 100); // Small delay to allow initial render
});
