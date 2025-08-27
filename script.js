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
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
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
        gsap.set(cubeContainer, { opacity: 1, scale: 1, visibility: 'visible', width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
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
        // Formula for apothem (a) of a regular N-sided polygon, where S is the side length: a = S / (2 * tan(π/N))
        return sideLength / (2 * Math.tan(Math.PI / SERVICES_COUNT));
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeDimension) { 
        let faceDepth = calculateFaceDepth(currentCubeDimension);
        
        // --- NEW/Refined: Clamp faceDepth to ensure faces are not pushed too far back ---
        // This prevents excessive shrinking and disappearance, keeping them closer and larger.
        const maxFaceDepthFactor = 0.6; // Adjusted to 0.6 as per latest prompt
        if (faceDepth > currentCubeDimension * maxFaceDepthFactor) {
            faceDepth = currentCubeDimension * maxFaceDepthFactor; 
        }

        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            gsap.set(face, { 
                // --- NEW/Refined: Explicitly set width and height of faces to fill the cube container ---
                width: currentCubeDimension + "px",  
                height: currentCubeDimension + "px", 
                transform: `rotateX(${i * ROTATION_INCREMENT_DEG}deg) translateZ(${faceDepth}px)`,
                autoAlpha: (i === 0) ? 1 : 0, // Use autoAlpha for robust visibility
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        // Ensure cube itself is in 3D mode and at its initial rotation.
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0, transformOrigin: 'center center' });
    }

    let cubeAnimationTimeline;

    // GSAP Responsive Media Queries (matchMedia)
    gsap.matchMedia().add({
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => {
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;
        let effectiveCubeDimension = 300; // Will be calculated dynamically or set by breakpoint

        // --- Kill/Revert previous animations for clean re-initialization ---
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        ScrollTrigger.getById('servicesCubePin')?.kill(true);

        // --- Handle Reduced Motion First ---
        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout.");
            // Use autoAlpha consistently for visibility
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1, position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0 });
            gsap.set(servicesHeading, { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(cubeContainer, { autoAlpha: 1, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    autoAlpha: 1, // Use autoAlpha
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,autoAlpha,position,transformStyle'
                });
            });
            return; 
        }

        // --- Determine Max Desired Cube Size based on Breakpoints ---
        let maxDesiredCubeDimension = 300; // Default for mobile and smaller desktops
        if (largeDesktop) {
            maxDesiredCubeDimension = 850; // NEW: Increased to allow faces to be larger
        } else if (mediumDesktop) {
            maxDesiredCubeDimension = 650; // NEW: Increased
        } 
        
        // --- Calculate Dynamic effectiveCubeDimension to fit within viewport ---
        if (!mobile) { // Only calculate for desktop where pinning/3D applies
            // Ensure the section and heading are visible to get correct computed styles for height calculation
            gsap.set(servicesSection, { autoAlpha: 1, clearProps: 'autoAlpha' }); 
            const sectionPaddingTop = parseFloat(getComputedStyle(servicesSection).paddingTop);
            const sectionPaddingBottom = parseFloat(getComputedStyle(servicesSection).paddingBottom);
            
            // Re-set heading visibility/opacity just in case, for accurate height measurement
            gsap.set(servicesHeading, { autoAlpha: 1, transform: 'none', clearProps: 'autoAlpha,transform' });
            const headingHeight = servicesHeading.offsetHeight;
            const headingMarginBottom = parseFloat(getComputedStyle(servicesHeading).marginBottom);
            
            const viewportHeight = window.innerHeight;
            // Optimized buffer to give more vertical room for the cube, making faces larger without overlap
            const additionalBuffer = 80; // Maintained at 80px
            const availableVerticalSpace = viewportHeight - sectionPaddingTop - sectionPaddingBottom - headingHeight - headingMarginBottom - additionalBuffer; 

            // The effective cube size should not exceed the max desired size nor the available vertical space
            effectiveCubeDimension = Math.min(availableVerticalSpace, maxDesiredCubeDimension);
            
            // --- NEW/Refined: Enforce a minimum cube dimension for desktop ---
            // This is crucial to ensure faces are always a readable size.
            const minDesktopCubeDimension = 550; // Adjusted to 550 as per latest prompt
            if (effectiveCubeDimension < minDesktopCubeDimension) {
                effectiveCubeDimension = minDesktopCubeDimension; 
            }
        } else {
             // On mobile, just use the max desired size (which is 300 by default) for layout
             // No minimum enforced here as mobile layout is stacked and responsive by CSS.
             effectiveCubeDimension = maxDesiredCubeDimension; 
        }

        // Apply cube container size based on the calculated dimension
        // Crucially, increased perspective for less distortion and larger face appearance
        gsap.set(cubeContainer, { 
            width: effectiveCubeDimension, 
            height: effectiveCubeDimension, 
            maxWidth: effectiveCubeDimension, 
            maxHeight: effectiveCubeDimension, 
            perspective: 2500 // Significantly increased perspective
        });
        
        // Initialize faces with the new calculated size
        setupInitialCubeFaces(effectiveCubeDimension); 


        // --- Setup Cube Animation & Pinning ---
        if (mobile) {
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,autoAlpha,scale' });
            gsap.set(servicesHeading, { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { autoAlpha: 1, y: 0, x: 0 });
            gsap.set(cubeContainer, { autoAlpha: 1, scale: 1, width: effectiveCubeDimension, height: effectiveCubeDimension, maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', y: 0, perspective: 'none' }); // Used autoAlpha here for consistency
            gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    autoAlpha: 1, 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,autoAlpha,position,transformStyle' // Clear autoAlpha
                });
            });
        } else {
            // Desktop animation setup
            console.log(`Desktop layout active. Cube size: ${effectiveCubeDimension}px. Setting up 3D animation.`);

            // Ensure the servicesSection itself is visible immediately, not animated with opacity/scale
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
                    scrub: 0.8, // Increased scrub for more fluidity
                    snap: {
                        snapTo: "labels",
                        duration: 0.6,    // Slightly longer snap duration for more momentum
                        ease: "power3.out" // More pronounced ease for snap (e.g., elastic/overshoot feel)
                    },
                    pinSpacing: false,
                    anticipatePin: 1, 
                    // markers: { startColor: "green", endColor: "red", indent: 20 },
                }
            });

            // Only animate the cubeContainer into view. servicesSection (and heading) remains static.
            cubeAnimationTimeline.fromTo(cubeContainer,
                { autoAlpha: 0, scale: 0.8 },
                { autoAlpha: 1, scale: 1, duration: 1, ease: "power2.out" }, 0); 

            // Heading is static by CSS and JS guard (not animated here).

            // Cube rotation and face visibility control (01 -> 08)
            faces.forEach((face, i) => {
                const currentFaceRotation = i * ROTATION_INCREMENT_DEG;
                const labelProgress = i / SERVICES_COUNT;

                cubeAnimationTimeline.addLabel(`face${i}`, labelProgress);
                
                cubeAnimationTimeline.to(cube, {
                    rotateX: currentFaceRotation,
                    duration: 1, 
                    ease: "power2.inOut", 
                    onStart: () => {
                        faces.forEach((f, idx) => {
                            if (idx === i) {
                                gsap.to(f, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }); 
                            } else {
                                gsap.to(f, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }); 
                            }
                        });
                    }
                }, `face${i}`);
            });
            
            cubeAnimationTimeline.addLabel(`endRotation`, 1);
            cubeAnimationTimeline.to(cube, {
                rotateX: totalRotation,
                duration: 1,
                ease: "power2.inOut",
                onStart: () => {
                    faces.forEach(f => gsap.to(f, { autoAlpha: 0, duration: 0.4, ease: "power2.in" })); 
                }
            }, `endRotation-=0.5`);

            // Only fade out cubeContainer at the very end. servicesSection (and thus the heading) should remain visible.
            cubeAnimationTimeline.to([cubeContainer], 
                { autoAlpha: 0, scale: 0.8, duration: 1, ease: "power2.in" }, `endRotation`); 
        }
    });

    // Refresh ScrollTrigger and re-evaluate matchMedia conditions on resize
    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
        gsap.matchMedia().revert(); 
        gsap.matchMedia().add(gsap.matchMedia().conditions); 
    });
});
