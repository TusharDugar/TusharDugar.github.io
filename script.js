// script.js
// Global constants for animation timing
// ROTATION_INCREMENT_DEG and ANIMATION_DURATION_MS are now managed by GSAP for the cube animation
const SCROLL_THRESHOLD_PX = 30; // Minimum scroll pixels to trigger a swipe (less relevant with GSAP but kept for other interactions)
const SCROLL_DEBOUNCE_TIME_MS = 100; // Prevent rapid-fire wheel events from stacking (less relevant with GSAP)

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
        // NOTE: The services-section and cube-container no longer have 'reveal-item' in HTML
        // So this block will primarily apply to other sections/elements.
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

    // Initialize IntersectionObserver-based animations (for About section, Tools, Contact, and other reveal-items)
    initIntersectionObserverAnimations();

    // --- Services Section 3D Cube Animation (GSAP + ScrollTrigger) ---
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const servicesLeftColumn = document.querySelector('.services-left-column');
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length; // Should be 8.
    const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT; // 45 degrees for 8 faces

    if (!servicesSection || !servicesPinWrapper || !servicesLeftColumn || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        // Fallback: ensure section and faces are visible if animation fails
        if (servicesSection) {
            gsap.set(servicesSection, { opacity: 1, scale: 1, visibility: 'visible' });
        }
        faces.forEach(face => {
            gsap.set(face, { opacity: 1, visibility: 'visible', transform: 'none', position: 'relative' });
            face.style.transformStyle = 'flat'; // Ensure CSS takes over
        });
        if (cube) {
            gsap.set(cube, { transform: 'none' });
            cube.style.transformStyle = 'flat';
        }
        return; 
    }

    // Calculate `translateZ` distance for faces
    function calculateFaceOffset(cubeHeight) {
        if (!cubeHeight || SERVICES_COUNT === 0) return 0;
        // R = (H/2) / tan(PI/N)
        return (cubeHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    // Set up initial 3D positioning of each face
    function setupInitialCubeFaces(currentCubeSize) {
        const faceOffset = calculateFaceOffset(currentCubeSize);
        faces.forEach((face, i) => {
            const angleForFace = i * ROTATION_INCREMENT_DEG;
            // Position faces around the X-axis for a vertical prism
            gsap.set(face, { 
                transform: `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`,
                opacity: (i === 0) ? 1 : 0, // Only first face visible initially
                visibility: (i === 0) ? 'visible' : 'hidden',
                position: 'absolute', // Ensure 3D positioning
                transformStyle: 'preserve-3d' // Ensure backface-visibility works
            });
        });
        // Ensure cube itself is in 3D mode
        gsap.set(cube, { transformStyle: 'preserve-3d' });
    }

    let cubeAnimationTimeline; // Declare timeline outside to manage it globally

    // GSAP Responsive Media Queries (matchMedia)
    gsap.matchMedia().add({
        // Desktop Large (min-width: 1201px) - Cube 900px
        "largeDesktop": "(min-width: 1201px)",
        // Desktop Medium / Tablet Large (min-width: 769px and max-width: 1200px) - Cube 640px
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        // Mobile / Tablet Small (max-width: 768px) - Cube 300px, stacked layout
        "mobile": "(max-width: 768px)",
        // Reduced motion override (for all screen sizes)
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { // context.conditions will tell us which media queries matched
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;
        let currentCubeSize = 300; // Default smallest size

        // Kill any previous ScrollTrigger for this section to prevent duplicates on resize
        if (ScrollTrigger.getById('servicesCubePin')) {
            ScrollTrigger.getById('servicesCubePin').kill(true); // true to revert to original styles
            cubeAnimationTimeline.clear(); // Clear the timeline
        }

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout.");
            // Reset styles to flat/stacked appearance
            gsap.set(servicesSection, { opacity: 1, scale: 1, visibility: 'visible', position: 'relative', top: 'auto', left: 'auto', x: 0 });
            gsap.set(servicesLeftColumn, { opacity: 1, y: 0, x: 0 }); // Ensure left column is visible and not animated
            gsap.set(cubeContainer, { width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'all' // Important to remove any GSAP-set inline styles
                });
            });
            // Skip further animation setup
            return; 
        }

        // --- Determine Cube Size based on Breakpoints ---
        if (largeDesktop) {
            currentCubeSize = 900;
        } else if (mediumDesktop) {
            currentCubeSize = 640;
        } else if (mobile) {
            currentCubeSize = 300;
        }

        // Apply cube container size
        gsap.set(cubeContainer, { width: currentCubeSize, height: currentCubeSize, maxWidth: currentCubeSize, perspective: 1200 });
        setupInitialCubeFaces(currentCubeSize); // Initialize faces for 3D
        
        // --- Setup Cube Animation & Pinning ---
        let mainTimeline = gsap.timeline({
            scrollTrigger: {
                id: 'servicesCubePin', // Unique ID for this ScrollTrigger
                trigger: servicesPinWrapper,
                start: "top top",
                end: "bottom bottom",
                pin: servicesSection, // Pin the entire services-section
                scrub: true, // Link animation to scroll position
                snap: {
                    snapTo: "labels", // Snap to the labels defined in the timeline
                    duration: 0.6,    // Snap duration for smoother feel
                    ease: "power2.inOut" // Snap easing
                },
                pinSpacing: false, // Prevents ScrollTrigger from adding extra padding
                // Markers for debugging (can remove in production)
                // markers: { startColor: "green", endColor: "red", indent: 20 }, 
                onEnter: () => {
                    // Optional: Fade in left column text when entering section
                    gsap.to(servicesLeftColumn, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
                },
                onLeave: () => {
                     // Optional: Fade out left column text when leaving section (scrolling down)
                    gsap.to(servicesLeftColumn, { opacity: 0, y: -50, duration: 0.6, ease: "power2.in" });
                },
                onEnterBack: () => {
                    // Optional: Fade in left column text when re-entering section (scrolling up)
                    gsap.to(servicesLeftColumn, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
                },
                onLeaveBack: () => {
                    // Optional: Fade out left column text when leaving section (scrolling up)
                    gsap.to(servicesLeftColumn, { opacity: 0, y: 50, duration: 0.6, ease: "power2.in" });
                }
            }
        });

        // Initialize section opacity and scale if not already visible/scaled
        mainTimeline.fromTo(servicesSection, 
            { opacity: 0, scale: 0.8, yPercent: 10 }, 
            { opacity: 1, scale: 1, yPercent: 0, duration: 1, ease: "power2.out" }, 0) // Fade in and grow at the very start of the pin wrapper scroll
        .fromTo(servicesLeftColumn, // Animate left column text fade in/move up
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 0); // Start at the same time as section fades in


        // Add labels and rotation steps to the timeline
        faces.forEach((face, i) => {
            const currentFaceRotation = -i * ROTATION_INCREMENT_DEG;
            mainTimeline.addLabel(`face${i}`, i / SERVICES_COUNT); // Add label at a proportional point in the timeline

            // Tween the cube's rotation
            mainTimeline.to(cube, {
                rotateX: currentFaceRotation,
                duration: 1, // Normalized duration for GSAP
                ease: "power2.inOut",
                onUpdate: () => { // Manage individual face visibility
                    const progressInSegment = mainTimeline.scrollTrigger.progress;
                    const activeIndex = Math.round(progressInSegment * (SERVICES_COUNT - 1));

                    faces.forEach((f, idx) => {
                        if (idx === activeIndex) {
                            gsap.to(f, { opacity: 1, visibility: 'visible', duration: 0.3 });
                        } else {
                            gsap.to(f, { opacity: 0, visibility: 'hidden', duration: 0.3 });
                        }
                    });
                }
            }, `face${i}`);
        });

        // Store the timeline so we can kill/recreate on resize
        cubeAnimationTimeline = mainTimeline;
    }, cube); // cube is the scope for this matchMedia, ensures variables are cleaned up

    // Ensure initial setup runs on page load before any scroll
    // This is handled by matchMedia.add() which runs immediately if conditions met.
    // If not, then a default 'setupInitialCubeFaces(900)' might be needed outside matchMedia.
    // However, the current GSAP setup already ensures initial state properly.
});
