// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const value = button.dataset.contact || ''; 

    if (value) {
        navigator.clipboard.writeText(value)
            .then(() => {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers or if clipboard API fails
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

// Unified Function to reveal elements on scroll (Intersection Observer)
function initIntersectionObserverAnimations() {
  const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        else if (entry.target.classList.contains("reveal-parent")) {
          const childrenToStagger = entry.target.querySelectorAll(".reveal-child"); 
          childrenToStagger.forEach((child, index) => {
            setTimeout(() => { child.classList.add("visible"); }, index * 100);
          });
        }
        else if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            setTimeout(() => { child.classList.add("visible"); }, index * 100);
          });
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Exclude services-heading from IntersectionObserver animations
  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => {
    // Only observe if the element or its closest ancestor is NOT the services-heading
    // We check '.services-heading' as it's the class on the h2 itself
    if (!el.closest('.services-heading')) { 
      observer.observe(el);
    } else {
        // If it's the services heading, ensure it's immediately visible and static
        gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' });
        if (el.matches('.services-heading')) { // If it's the h2 itself
            gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
        }
    }
  });
}

// Global constant for services cube scroll length
const SCROLL_PER_FACE_VH = 400; // 400vh scroll space for each face rotation

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Mouse Follower Glow
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            gsap.to(mouseFollowerGlow, { x: event.clientX, y: event.clientY, duration: 0.1, ease: "power2.out" }); // Adjusted duration to 0.1s for smoother feel
        });
    }

    // Initialize contact button functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize all other reveal-on-scroll animations
    initIntersectionObserverAnimations();

    // --- Services Section 3D Cube Animation (GSAP + ScrollTrigger) ---
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const servicesHeading = servicesSection ? servicesSection.querySelector('.services-heading') : null; // Get heading from section
    const cubeContainer = servicesSection ? servicesSection.querySelector('.cube-container') : null;
    const cube = servicesSection ? document.getElementById('services-cube') : null;
    const faces = servicesSection ? servicesSection.querySelectorAll('.face') : [];
    const SERVICES_COUNT = faces.length;

    // --- Fallback if essential elements are missing ---
    if (!servicesSection || !servicesPinWrapper || !servicesHeading || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        // Ensure servicesSection is visible (it's no longer animated by these specific fromTo's)
        gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible' }); 
        // Ensure heading is fully visible and static
        gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); 
        if (servicesHeading) {
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
        }
        // Ensure cube container and faces are fully visible and static (no 3D)
        gsap.set(cubeContainer, { opacity: 1, scale: 1, visibility: 'visible', width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
        gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
        faces.forEach(face => {
            gsap.set(face, { 
                opacity: 1, 
                visibility: 'visible', 
                transform: 'none', 
                position: 'relative', 
                transformStyle: 'flat',
                clearProps: 'transform,opacity,visibility,position,transformStyle' // Clear GSAP inline styles
            });
        });
        return; 
    }

    // --- Core 3D Cube Logic ---

    // Calculate `translateZ` distance for faces (apothem of a regular polygon)
    function calculateFaceDepth(cubeHeight) {
        if (!cubeHeight || SERVICES_COUNT === 0) return 0;
        return (cubeHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeSize) {
        const faceDepth = calculateFaceDepth(currentCubeSize);
        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            const angleForFace = i * ROTATION_INCREMENT_DEG;
            gsap.set(face, { 
                transform: `rotateX(${angleForFace}deg) translateZ(${faceDepth}px)`,
                transformOrigin: `center center -${faceDepth}px`, // Critical for correct rotation around shared axis
                opacity: (i === 0) ? 1 : 0, // Only first face visible initially
                visibility: (i === 0) ? 'visible' : 'hidden',
                position: 'absolute', // Ensure 3D positioning
                transformStyle: 'preserve-3d', // Ensure backface-visibility works
            });
        });
        // Ensure cube itself is in 3D mode and at its initial rotation
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0 });
    }

    let cubeAnimationTimeline; // Declare timeline outside to manage it globally

    // GSAP Responsive Media Queries (matchMedia)
    gsap.matchMedia().add({
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => {
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;
        let currentCubeSize = 300; // Default smallest size for mobile

        // --- Kill/Revert previous animations for clean re-initialization ---
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        ScrollTrigger.getById('servicesCubePin')?.kill(true); // Kill specific ScrollTrigger by ID

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout.");
            // Set elements to their final, non-animated, fully visible state
            gsap.set(servicesSection, { opacity: 1, scale: 1, visibility: 'visible', position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); // Static heading
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 }); // Static heading spans
            gsap.set(cubeContainer, { opacity: 1, scale: 1, visibility: 'visible', width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,opacity,visibility,position,transformStyle'
                });
            });
            return; 
        }

        // --- Determine Cube Size based on Breakpoints ---
        if (largeDesktop) {
            currentCubeSize = 900;
        } else if (mediumDesktop) {
            currentCubeSize = 640;
        } 
        // 'mobile' condition (max-width: 768px) already implies currentCubeSize = 300
        
        // Apply cube container size
        gsap.set(cubeContainer, { width: currentCubeSize, height: currentCubeSize, maxWidth: currentCubeSize, perspective: 1200 });
        setupInitialCubeFaces(currentCubeSize); // Initialize faces for 3D

        // --- Setup Cube Animation & Pinning ---
        if (mobile) {
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            // Clear any previous fixed/animation styles for the section
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,opacity,scale,visibility' });
            // Ensure heading and its spans are fully visible and static
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            // Ensure cube container and faces are fully visible and static (no 3D)
            gsap.set(cubeContainer, { opacity: 1, scale: 1, visibility: 'visible', width: currentCubeSize, height: currentCubeSize, maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', y: 0, perspective: 'none' });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,opacity,visibility,position,transformStyle'
                });
            });
        } else {
            // Desktop animation setup
            console.log(`Desktop layout active. Cube size: ${currentCubeSize}px. Setting up 3D animation.`);

            // Set the height of the servicesPinWrapper dynamically
            servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh';
            const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;
            const totalRotation = SERVICES_COUNT * ROTATION_INCREMENT_DEG; // Should be 360 degrees

            cubeAnimationTimeline = gsap.timeline({
                scrollTrigger: {
                    id: 'servicesCubePin',
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
                    anticipatePin: 1, 
                    // markers: { startColor: "green", endColor: "red", indent: 20 }, // For debugging
                }
            });

            // 1. Initial fade-in and scale-up for the servicesSection (its background) AND cubeContainer
            cubeAnimationTimeline.fromTo(servicesSection, 
                { opacity: 0, scale: 0.8, visibility: 'hidden' }, 
                { opacity: 1, scale: 1, visibility: 'visible', duration: 1, ease: "power2.out" }, 0); 
            
            // NEW: Only animate the cubeContainer into view. servicesSection already brought in.
            cubeAnimationTimeline.fromTo(cubeContainer,
                { opacity: 0, scale: 0.8, visibility: 'hidden' },
                { opacity: 1, scale: 1, visibility: 'visible', duration: 1, ease: "power2.out" }, 0); 

            // 2. Heading: NO ANIMATION. It's now statically visible by CSS and excluded from IO.

            // 3. Cube rotation and face visibility control (01 -> 08)
            faces.forEach((face, i) => {
                const currentFaceRotation = i * ROTATION_INCREMENT_DEG; // Positive rotation for 01 -> 08
                const labelProgress = i / SERVICES_COUNT; // Position label proportionally

                cubeAnimationTimeline.addLabel(`face${i}`, labelProgress);
                
                // Tween the cube's rotation to show the current face
                cubeAnimationTimeline.to(cube, {
                    rotateX: currentFaceRotation, // Apply positive rotation
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
            
            // To ensure it rotates a full 360 degrees, we need an extra step for the last face to smoothly transition off
            cubeAnimationTimeline.addLabel(`endRotation`, 1); // Mark the end of the full rotation
            cubeAnimationTimeline.to(cube, {
                rotateX: totalRotation, // Ensure it completes a full 360-degree rotation
                duration: 1,
                ease: "power2.inOut",
                onStart: () => {
                    // All faces hidden as we transition out
                    faces.forEach(f => gsap.to(f, { opacity: 0, visibility: 'hidden', duration: 0.4, ease: "power2.in" }));
                }
            }, `endRotation-=0.5`); // Start this slightly before the very end label

            // 4. Fade out section and cubeContainer at the very end of the pin wrapper scroll
            cubeAnimationTimeline.to([servicesSection, cubeContainer], // Target both section (background) and cubeContainer for fade out
                { opacity: 0, scale: 0.8, visibility: 'hidden', duration: 1, ease: "power2.in" }, `endRotation`); // Fade out after last face animation
        }
    });

    // Refresh ScrollTrigger after all initial setup (especially important after dynamic height change)
    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
