// script.js
// Global constants for animation timing - these are now primarily controlled by GSAP
const SCROLL_THRESHOLD_PX = 30; // Kept for other potential interactions, but not directly used by GSAP cube
const SCROLL_DEBOUNCE_TIME_MS = 100; // Kept for other potential interactions

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
                gsap.to(mouseFollowerGlow, { x: event.clientX, y: event.clientY, duration: 0.1, ease: "power2.out" });
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
    const SCROLL_PER_FACE_VH = 400; // How much scroll space for each face rotation

    if (!servicesSection || !servicesPinWrapper || !servicesLeftColumn || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        // Fallback: ensure section and faces are visible if animation fails
        gsap.set(servicesSection, { opacity: 1, scale: 1, visibility: 'visible', position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
        gsap.set(servicesLeftColumn, { opacity: 1, y: 0, x: 0 });
        gsap.set(cubeContainer, { width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
        gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
        faces.forEach(face => {
            gsap.set(face, { 
                opacity: 1, 
                visibility: 'visible', 
                transform: 'none', 
                position: 'relative', 
                transformStyle: 'flat',
                clearProps: 'all' // Important to remove any GSAP-set inline styles
            });
        });
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
                transformStyle: 'preserve-3d', // Ensure backface-visibility works
                transition: 'opacity 0.4s ease-in-out' // Add transition for smooth opacity changes
            });
        });
        // Ensure cube itself is in 3D mode
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0 }); // Reset cube rotation
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
        let currentCubeSize = 300; // Default smallest size for mobile
        
        // --- Kill/Revert previous animations ---
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        // Revert section's inline styles from previous pinning/animations
        ScrollTrigger.getById('servicesCubePin')?.kill(true); // Kill specific ScrollTrigger by ID

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout.");
            // Reset styles to flat/stacked appearance
            gsap.set(servicesSection, { opacity: 1, scale: 1, visibility: 'visible', position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
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
                    clearProps: 'transform,opacity,visibility,position,transformStyle,transition' // Clear GSAP inline styles
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
        } // 'mobile' condition (max-width: 768px) already defaults currentCubeSize to 300

        // Apply cube container size
        gsap.set(cubeContainer, { width: currentCubeSize, height: currentCubeSize, maxWidth: currentCubeSize, perspective: 1200 });
        setupInitialCubeFaces(currentCubeSize); // Initialize faces for 3D
        
        // --- Setup Cube Animation & Pinning ---
        if (mobile) {
            // On mobile, keep the cube flat and remove pinning
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,opacity,scale,visibility' }); // Clear any previous fixed styles
            gsap.set(servicesLeftColumn, { opacity: 1, y: 0 }); // Ensure text is visible
            gsap.set(cubeContainer, { 
                width: currentCubeSize, 
                height: currentCubeSize, 
                maxWidth: '100%', // Allow mobile to use 100% width, limited by its own max-width
                aspectRatio: 1, // Keep aspect ratio
                position: 'relative', 
                top: 'auto', 
                y: 0, 
                perspective: 'none' // Flatten perspective
            });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,opacity,visibility,position,transformStyle,transition'
                });
            });
            // No ScrollTrigger created for mobile in this case
        } else {
            // Desktop animation setup
            console.log(`Desktop layout active. Cube size: ${currentCubeSize}px. Setting up 3D animation.`);

            // Set the height of the servicesPinWrapper dynamically
            // This needs to be done *before* ScrollTrigger.create() so it knows the full scrollable height
            servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh';

            cubeAnimationTimeline = gsap.timeline({
                scrollTrigger: {
                    id: 'servicesCubePin', // Unique ID for this ScrollTrigger
                    trigger: servicesPinWrapper,
                    start: "top top",
                    end: "bottom bottom",
                    pin: servicesSection, // Pin the entire services-section
                    scrub: 0.6, // Smoothly links animation to scroll position
                    snap: {
                        snapTo: "labels", // Snap to the labels defined in the timeline
                        duration: 0.5,    // Snap duration for smoother feel
                        ease: "power2.inOut" // Snap easing
                    },
                    pinSpacing: false, // Prevents ScrollTrigger from adding extra padding
                    // markers: { startColor: "green", endColor: "red", indent: 20 }, // For debugging
                    onEnter: () => console.log("Services section entered!"),
                    onLeave: () => console.log("Services section left (scrolling down)"),
                    onEnterBack: () => console.log("Services section re-entered (scrolling up)"),
                    onLeaveBack: () => console.log("Services section left (scrolling up)")
                }
            });

            // 1. Initial fade-in and scale-up for the entire section
            cubeAnimationTimeline.fromTo(servicesSection, 
                { opacity: 0, scale: 0.8, visibility: 'hidden' }, 
                { opacity: 1, scale: 1, visibility: 'visible', duration: 1, ease: "power2.out" }, 0); // At the very start of the pin scroll

            // 2. Left column text animation (fade/move)
            cubeAnimationTimeline.fromTo(servicesLeftColumn, 
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 0); // Start with section fade-in


            // 3. Cube rotation and face visibility control
            faces.forEach((face, i) => {
                const currentFaceRotation = -i * ROTATION_INCREMENT_DEG;
                const labelProgress = i / SERVICES_COUNT; // Position label proportionally

                cubeAnimationTimeline.addLabel(`face${i}`, labelProgress);
                
                // Tween the cube's rotation to show the current face
                cubeAnimationTimeline.to(cube, {
                    rotateX: currentFaceRotation,
                    duration: 1, // Normalized duration for GSAP (will be scaled by scrub)
                    ease: "power2.inOut",
                    onStart: () => { // When this specific face's rotation starts to become active
                        // Ensure current face is visible, others are hidden
                        faces.forEach((f, idx) => {
                            if (idx === i) {
                                gsap.to(f, { opacity: 1, visibility: 'visible', duration: 0.4, ease: "power2.out" });
                            } else {
                                gsap.to(f, { opacity: 0, visibility: 'hidden', duration: 0.4, ease: "power2.in" });
                            }
                        });
                    }
                }, `face${i}`);
            });

            // 4. Fade out section at the very end of the pin wrapper scroll
            cubeAnimationTimeline.to(servicesSection, 
                { opacity: 0, scale: 0.8, visibility: 'hidden', duration: 1, ease: "power2.in" }, `face${SERVICES_COUNT - 1}+=1`); // Fade out after last face animation
        }
    });

    // Refresh ScrollTrigger after all initial setup (especially important after dynamic height change)
    ScrollTrigger.refresh();
});
