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

// Global constant for services cube scroll length
const SCROLL_PER_FACE_VH = 400; // 400vh scroll space for each face rotation

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    
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
    const servicesPinWrapper = servicesSection; // REFINED: servicesSection is now the pin wrapper directly
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
    function calculateFaceDepth(sideLength) { 
        if (!sideLength || SERVICES_COUNT === 0) return 0;
        // REFINED: Force cube-style depth regardless of polygon math
        // This makes faces appear flat and close, like a cube face.
        return sideLength / 2; // Fixed to sideLength / 2
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeDimension) { 
        // REVISED: Get cubeSize from cubeContainer's offsetWidth
        const cubeSize = cubeContainer.offsetWidth; // Get dynamic width of cubeContainer
        let faceDepth = calculateFaceDepth(cubeSize); // Use cubeSize for faceDepth calculation
        
        // REVISED: Removed apothem clamping, as faceDepth is now fixed to cube-like depth
        // const maxFaceDepthFactor = 0.35; 
        // if (faceDepth > currentCubeDimension * maxFaceDepthFactor) {
        //     faceDepth = currentCubeDimension * maxFaceDepthFactor; 
        // }

        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            gsap.set(face, { 
                width: currentCubeDimension + "px",  
                height: currentCubeDimension + "px", 
                // REVISED: Ensure 45deg increments for 8 faces (360/8)
                transform: `rotateY(${i * ROTATION_INCREMENT_DEG}deg) translateZ(${faceDepth}px)`, 
                autoAlpha: 1, // REFINED: Faces start fully visible, JS dims inactive ones
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateY: 0, transformOrigin: 'center center' }); 
    }

    let cubeAnimationTimeline;

    const mm = gsap.matchMedia(); 

    mm.add({ 
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { 
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;
        let effectiveCubeDimension = 300; 

        // --- Kill/Revert previous animations for clean re-initialization ---
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        ScrollTrigger.getById('servicesCubePin')?.kill(true);

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout.");
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1, position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
            gsap.set(servicesHeading, { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { autoAlpha: 1, y: 0, x: 0 });
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

        // --- Determine Max Desired Cube Size based on Breakpoints ---
        let maxDesiredCubeDimension = 300; 
        if (largeDesktop) {
            maxDesiredCubeDimension = 850; 
        } else if (mediumDesktop) {
            maxDesiredCubeDimension = 650; 
        } 
        
        // --- Calculate Dynamic effectiveCubeDimension to fit within viewport ---
        if (!mobile) { 
            // REFINED: Set .services-section padding-top to 0 or very small in CSS for optimal calculation.
            gsap.set(servicesSection, { autoAlpha: 1, clearProps: 'autoAlpha' }); 
            const sectionPaddingTop = parseFloat(getComputedStyle(servicesSection).paddingTop); // This will now be 0 from CSS
            const sectionPaddingBottom = parseFloat(getComputedStyle(servicesSection).paddingBottom);
            
            gsap.set(servicesHeading, { autoAlpha: 1, transform: 'none', clearProps: 'autoAlpha,transform' });
            const headingHeight = servicesHeading.offsetHeight;
            const headingMarginBottom = parseFloat(getComputedStyle(servicesHeading).marginBottom); // This will now be 0 from CSS
            
            const viewportHeight = window.innerHeight;
            // REFINED: Simplified Available vertical space calculation
            // As CSS padding-top and heading margin-bottom are now 0, cubeTopOffset becomes the primary spacer.
            const availableVerticalSpace = viewportHeight; // Simplified for calculation
            
            // REFINED: Clamp effectiveCubeDimension more aggressively
            effectiveCubeDimension = Math.min(maxDesiredCubeDimension, viewportHeight * 0.8); // REFINED: Use viewportHeight * 0.8

            const minDesktopCubeDimension = 750; // REFINED: Changed min size to 750px
            if (effectiveCubeDimension < minDesktopCubeDimension) {
                effectiveCubeDimension = minDesktopCubeDimension; 
            }

            // REFINED: CubeContainer Positioning - relies on CSS for horizontal, GSAP for y
            gsap.set(cubeContainer, { 
                position: "relative" // Keep this for GSAP transforms to work correctly
            });

        } else {
             effectiveCubeDimension = maxDesiredCubeDimension; 
        }

        // Apply cube container size based on the calculated dimension
        gsap.set(cubeContainer, { 
            width: effectiveCubeDimension, 
            height: effectiveCubeDimension, 
            maxWidth: effectiveCubeDimension, 
            maxHeight: effectiveCubeDimension, 
            perspective: 2000 
        });
        
        setupInitialCubeFaces(effectiveCubeDimension); 


        // --- Setup Cube Animation & Pinning ---
        if (mobile) {
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,autoAlpha,scale' });
            gsap.set(servicesHeading, { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(cubeContainer, { 
                autoAlpha: 1, scale: 1, width: effectiveCubeDimension, height: effectiveCubeDimension, 
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
            // Desktop animation setup
            console.log(`Desktop layout active. Cube size: ${effectiveCubeDimension}px. Setting up 3D animation.`);

            gsap.set(servicesSection, { autoAlpha: 1, scale: 1 });

            servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh';
            const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;
            const totalRotation = SERVICES_COUNT * ROTATION_INCREMENT_DEG;

            cubeAnimationTimeline = gsap.timeline({
                scrollTrigger: {
                    id: 'servicesCubePin',
                    trigger: servicesPinWrapper,
                    start: "top top",
                    end: "bottom bottom",
                    pin: servicesSection,
                    scrub: 0.8, 
                    snap: {
                        snapTo: "labels",
                        duration: 0.4,    
                        ease: "power3.out" 
                    },
                    pinSpacing: false,
                    anticipatePin: 1, 
                }
            });

            // REFINED: Initial GSAP.set for cubeContainer (always visible at start, no fade-in/out, NO SCALE)
            // REFINED: cubeTopOffset now relies purely on headingHeight + 20 (since CSS margins are 0)
            const cubeTopOffset = servicesHeading.offsetHeight + 20; // Simplified
            gsap.set(cubeContainer, { autoAlpha: 1, y: cubeTopOffset }); // Always visible, positioned, NO SCALE

            // Cube animation timeline now starts with rotation directly
            cubeAnimationTimeline.to(cube, {
                rotateY: (SERVICES_COUNT - 1) * ROTATION_INCREMENT_DEG, 
                ease: "none", // Main rotation should be linear for scrub
            });

            // REFINED: Loop through faces to control their autoAlpha based on scroll progress
            faces.forEach((face, i) => {
                const startRotation = i * ROTATION_INCREMENT_DEG;
                const endRotation = (i + 1) * ROTATION_INCREMENT_DEG;
                
                // REVISED: Initial face alpha set at the start of its rotation block
                // This replaces the .01s instant dim, ensuring faces smoothly fade from active/dimmed to dimmed.
                cubeAnimationTimeline.to(face, 
                    { autoAlpha: (i === 0) ? 1 : 0.7, duration: 0.01 }, // Set initial alpha for each face when its block starts
                    startRotation / (totalRotation || 1)
                );

                // Fully activate the current face as it rotates into view
                cubeAnimationTimeline.to(face, 
                    { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 
                    (startRotation / (totalRotation || 1)) + 0.05 // Slightly after its rotation starts
                );

                // Dim the face again after it passes, but keep it visible
                cubeAnimationTimeline.to(face, 
                    { autoAlpha: 0.7, duration: 0.4, ease: "power2.in" }, 
                    (endRotation / (totalRotation || 1)) - 0.05 // Slightly before next rotation completes
                );
            });

            // The main cube rotation should happen over the entire timeline
            cubeAnimationTimeline.to(cube, {
                rotateY: totalRotation, // Ensure it completes a full 360-degree rotation
                duration: 1, // Normalized duration for GSAP (will be scaled by scrub)
                ease: "none", // Keep linear for scrub to work smoothly
            }, 0); // Start at the beginning of the timeline

            // REFINED: Removed the final fade out for cubeContainer.
            // The cubeContainer remains at autoAlpha:1 and y:cubeTopOffset until the pin ends.
            // No explicit fade-out from the timeline.
        }
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
    });
});
