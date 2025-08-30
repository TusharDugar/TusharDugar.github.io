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
        // If reduced motion is preferred, just make it visible without animation and unobserve
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }
        // Otherwise, apply animations
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

  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => {
    if (el.closest('.services-heading')) {
      // If it's the services heading, ensure it's immediately visible and static (as per previous requirements)
      gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' });
      if (el.matches('.services-heading')) { 
          gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
      }
    } else {
      // For all other reveal elements:
      // Check if the element is already in the viewport on page load
      const rect = el.getBoundingClientRect();
      const isInitiallyVisible = (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
      );

      if (isInitiallyVisible) {
          // If it's initially visible, immediately set it to its final visible state using GSAP.
          // This prevents elements at the top from staying invisible if IO doesn't trigger fast enough.
          // We also don't observe it, as it's already "revealed".
          if (el.classList.contains("reveal-item")) {
              gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-parent")) {
              // For reveal-parent, explicitly set all its reveal-child elements
              gsap.set(el.querySelectorAll(".reveal-child"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-stagger-container")) {
              // For reveal-stagger-container, explicitly set all its reveal-stagger elements
              gsap.set(el.querySelectorAll(".reveal-stagger"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          }
      } else {
          // If not initially visible, observe it for scroll animation as normal.
          observer.observe(el);
      }
    }
  });
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired."); // Debugging: Confirm DOM is ready

    // Mouse Follower Glow
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            gsap.to(mouseFollowerGlow, { x: event.clientX, y: event.clientY, duration: 0.1, ease: "power2.out" });
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
    const servicesPinWrapper = servicesSection; // servicesSection is now the pin wrapper directly
    const servicesHeading = servicesSection ? servicesSection.querySelector('.services-heading') : null;
    const cubeContainer = servicesSection ? servicesSection.querySelector('.cube-container') : null;
    const cube = servicesSection ? document.getElementById('services-cube') : null;
    const faces = servicesSection ? servicesSection.querySelectorAll('.face') : [];
    const SERVICES_COUNT = faces.length;

    // --- Fallback if essential elements are missing ---
    if (!servicesSection || !servicesPinWrapper || !servicesHeading || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible' }); 
        gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); 
        if (servicesHeading) {
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
        }
        gsap.set(cubeContainer, { autoAlpha: 1, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
        gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
        faces.forEach(face => {
            gsap.set(face, { 
                opacity: 1, 
                visibility: 'visible', 
                transform: 'none', 
                position: 'relative', 
                transformStyle: 'flat',
                clearProps: 'transform,opacity,visibility,position,transformStyle'
            });
        });
        return; 
    }

    // --- Core 3D Cube Logic ---

    // Calculate `translateZ` distance for faces (apothem of a regular polygon)
    // `sideLength` here is the width/height of a square face.
    function calculateFaceDepth(sideHeight) { 
        if (!sideHeight || SERVICES_COUNT === 0) return 0;
        // Corrected to Math.tan for proper 3D depth
        return (sideHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeWidth, currentCubeHeight) { 
        console.log(`Setting up initial cube faces with width: ${currentCubeWidth}, height: ${currentCubeHeight}`); // Debugging
        let faceDepth = calculateFaceDepth(currentCubeHeight); // Use currentCubeHeight for depth calculation
        
        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            const rotation = i * ROTATION_INCREMENT_DEG;
            // Faces are positioned relative to the cube's center without an additional local offset.
            // The cube's global rotation (in the ScrollTrigger) will handle initial alignment.
            const correctedRotation = rotation; 

            gsap.set(face, { 
                width: currentCubeWidth + "px",  
                height: currentCubeHeight + "px", 
                // Using rotateX for vertical spin, translateZ for depth
                transform: `rotateX(${correctedRotation}deg) translateZ(${faceDepth}px)`, 
                autoAlpha: 1, // All faces start visible, relying on perspective to hide others
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        // Set up cube with preserve-3d and initial rotation (0)
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0, rotateY: 0, transformOrigin: 'center center' }); 
    }

    // No longer using cubeAnimationTimeline directly with MatchMedia for this specific cube logic
    // Instead, defining the ScrollTrigger directly.
    const mm = gsap.matchMedia(); 

    mm.add({ 
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { 
        console.log("MatchMedia callback fired. Conditions:", context.conditions); // Debugging: Confirm matchMedia fires
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;

        // --- Kill/Revert previous ScrollTrigger for clean re-initialization ---
        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        console.log("Previous ScrollTrigger for cube pin killed.");

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout for cube.");
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1, position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            gsap.set(cubeContainer, { autoAlpha: 1, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', y: 0, perspective: 'none' });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    autoAlpha: 1, 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,autoAlpha,position,transformStyle'
                });
            });
            return; 
        }

        // --- Left Column Striped Reveal Activation ---
        const stripedRevealMask = document.querySelector('.striped-reveal-mask');
        if (stripedRevealMask && !mobile && !reducedMotion) {
            // Use IntersectionObserver to trigger the reveal when it enters the viewport
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        console.log("Left column striped overlay removed."); // Overlay is hidden by CSS 'revealed' class

                        // Animate children after overlay is gone
                        gsap.from(".about-left-content .reveal-stagger-child", {
                            opacity: 0,
                            y: 40,
                            duration: 0.8,        // Slower overall animation for children
                            stagger: 0.15,        // Delay each child a bit more
                            delay: 0.5,           // Start a bit after overlay removal
                            ease: "power2.out",
                            clearProps: "all"     // Remove GSAP styles after animation
                        });
                        console.log("Left column children staggered reveal triggered with GSAP.");
                        observer.unobserve(entry.target); // Stop observing once revealed
                    }
                });
            }, { rootMargin: "0px", threshold: 0.1 });
            revealObserver.observe(stripedRevealMask);
        } else if (stripedRevealMask) {
            // For mobile or reduced motion, ensure it's immediately revealed (no animation)
            stripedRevealMask.classList.add('revealed');
            console.log("Left column striped reveal instantly revealed (mobile or reduced motion).");
            // Also ensure children are visible if no stagger animation is intended
            gsap.set(".about-left-content .reveal-stagger-child", { opacity: 1, y: 0, clearProps: "all" });
        }


        // --- Determine Max Desired Cube Size based on Breakpoints ---
        let maxDesiredCubeBaseDimension = 300; // Base value for height
        if (largeDesktop) {
            maxDesiredCubeBaseDimension = 400; // Cap for large desktop
        } else if (mediumDesktop) {
            maxDesiredCubeBaseDimension = 350; // Cap for medium desktop
        } 
        
        let effectiveCubeBaseDimension = 300; // Default for mobile fallback

        // --- Calculate Dynamic effectiveCubeBaseDimension to fit within viewport ---
        if (!mobile) { 
            gsap.set(servicesSection, { autoAlpha: 1, clearProps: 'autoAlpha' }); 
            const viewportHeight = window.innerHeight;
            
            // Apply new scaling factor and caps
            effectiveCubeBaseDimension = Math.min(maxDesiredCubeBaseDimension, viewportHeight * 0.6); 

            // Ensure a minimum size on desktop
            const minAllowedCubeDimension = 300;
            if (effectiveCubeBaseDimension < minAllowedCubeDimension) {
                effectiveCubeBaseDimension = minAllowedCubeDimension;
            }

            gsap.set(cubeContainer, { 
                position: "relative" 
            });

        } else {
             effectiveCubeBaseDimension = 300; // Keep mobile fixed at 300
        }

        // NEW: Define cubeWidth and cubeHeight based on effectiveCubeBaseDimension
        const cubeHeight = effectiveCubeBaseDimension * 0.85; // Reduced height by 15%
        const cubeWidth = effectiveCubeBaseDimension * 1.5; // Adjusted ratio (1.5x wider)

        // Apply cube container size based on the calculated dimensions
        gsap.set(cubeContainer, { 
            width: cubeWidth, 
            height: cubeHeight, 
            maxWidth: cubeWidth, 
            maxHeight: cubeHeight, 
            // Perspective is now primarily set in CSS to 1600px.
        });
        
        setupInitialCubeFaces(cubeWidth, cubeHeight); // Pass calculated width and height


        // --- Setup Cube Animation & Pinning ---
        if (mobile) {
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,autoAlpha,scale' });
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            gsap.set(cubeContainer, { 
                autoAlpha: 1, scale: 1, width: effectiveCubeBaseDimension, height: effectiveCubeBaseDimension, // Square for mobile
                maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', y: 0, perspective: 'none',
                left: 'auto', 
                xPercent: 0, 
                transform: 'none' 
            }); 
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    autoAlpha: 1, 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,autoAlpha,position,transformStyle'
                });
            });
        } else {
            console.log(`Desktop layout active. Cube size: ${cubeWidth}x${cubeHeight}px. Setting up 3D animation.`); // Debugging: Confirm desktop branch
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1 });

            // No manual servicesPinWrapper height needed; ScrollTrigger 'end' manages spacing.
            const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

            // Start state: Face 01 fully visible
            gsap.set(faces, { autoAlpha: 0.5 }); // Dim all faces initially
            gsap.set(faces[0], { autoAlpha: 1 }); // Start with face 01 (index 0) highlighted

            // FIX: Add a fade-in animation for the entire cube container when it enters the pinned section
            gsap.from(cubeContainer, {
                opacity: 0,
                y: 50, // Slightly move up from bottom
                duration: 1.5, // FIX: Increased duration for a slower fade-in
                delay: 0.2, // Small delay after section pins
                ease: "power2.out",
                scrollTrigger: { // Use a separate, immediate ScrollTrigger for its entry
                    trigger: servicesPinWrapper,
                    start: "top bottom", // Trigger when the top of the trigger hits bottom of viewport
                    end: "top top+=10%", // Finishes quickly
                    scrub: false, // Not scrubbed, it's a 'from' animation on entry
                    toggleActions: "play none none none", // Play once on entry
                    onEnter: () => console.log("Cube container fade-in triggered."),
                    onLeaveBack: () => gsap.set(cubeContainer, { opacity: 0, y: 50 }), // Reset if scrolled back up
                }
            });


            gsap.to(cube, {
              rotateX: (SERVICES_COUNT - 1) * 45, // FIX: Total rotation for 8 faces (0-7), 7 steps of 45 degrees = 315 degrees
              ease: "none",
              scrollTrigger: {
                id: 'servicesCubePin',
                trigger: servicesPinWrapper, // Pin the section wrapper
                start: "top top",
                end: `+=${(SERVICES_COUNT - 1) * 100}%`, // FIX: Proportional scroll length (1 viewport height per face)
                scrub: true,        // Ensures forward/backward sync with scroll
                pin: servicesSection, // Pin the visible services section
                anticipatePin: 1,
                // markers: true, // DEBUG: Temporarily enable to debug ScrollTrigger
                onUpdate: (self) => {
                  // Calculate active face index based on scroll progress
                  // Math.round is more appropriate here to snap to the closest face visually
                  let idx = Math.round(self.progress * (SERVICES_COUNT - 1)); 
                  idx = Math.min(idx, SERVICES_COUNT - 1); // Clamp to max index (0-7)

                  faces.forEach((f, i) => {
                    // Highlight the active face, dim others
                    gsap.set(f, { autoAlpha: i === idx ? 1 : 0.2 }); // FIX: More obvious dimming
                  });
                }
              }
            });
            console.log("Desktop cube animation setup complete with new logic."); // Debugging
        }
    });

    // Call ScrollTrigger.refresh() on resize
    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
        console.log("Window resized. ScrollTrigger refreshed."); // Debugging
    });

    // Fallback: Force all revealable elements to become visible after 2s if IO hasn't triggered them
    setTimeout(() => {
        document.querySelectorAll('.reveal-item, .reveal-child, .reveal-stagger').forEach(el => {
            // Only apply fallback if prefers-reduced-motion is NOT active
            if (!el.classList.contains('visible') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add('visible');
                console.log("Reveal fallback triggered for:", el); // Debugging
            }
        });
    }, 2000);
});
