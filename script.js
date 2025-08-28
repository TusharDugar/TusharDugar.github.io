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
        
        // --- REFINED: Clamp faceDepth more aggressively ---
        // This brings faces closer to the viewer, making them appear larger and preventing disappearance.
        const maxFaceDepthFactor = 0.25; 
        if (faceDepth > currentCubeDimension * maxFaceDepthFactor) {
            faceDepth = currentCubeDimension * maxFaceDepthFactor; 
        }

        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            gsap.set(face, { 
                width: currentCubeDimension + "px",  
                height: currentCubeDimension + "px", 
                // --- CRITICAL FIX: Changed rotateX to rotateY here --- (if your desired rotation is horizontal)
                transform: `rotateY(${i * ROTATION_INCREMENT_DEG}deg) translateZ(${faceDepth}px)`, 
                autoAlpha: 1, // REFINED: Faces start fully visible, JS dims inactive ones
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        // Ensure cube itself is in 3D mode and at its initial rotation.
        // --- CRITICAL FIX: Changed rotateX to rotateY here --- (if your desired rotation is horizontal)
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
            gsap.set(cubeContainer, { autoAlpha: 1, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', y: 0, perspective: 'none' });
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
            gsap.set(servicesSection, { autoAlpha: 1, clearProps: 'autoAlpha' }); 
            const sectionPaddingTop = parseFloat(getComputedStyle(servicesSection).paddingTop);
            const sectionPaddingBottom = parseFloat(getComputedStyle(servicesSection).paddingBottom);
            
            gsap.set(servicesHeading, { autoAlpha: 1, transform: 'none', clearProps: 'autoAlpha,transform' });
            const headingHeight = servicesHeading.offsetHeight;
            const headingMarginBottom = parseFloat(getComputedStyle(servicesHeading).marginBottom);
            
            const viewportHeight = window.innerHeight;
            // The initial y:40 will manage spacing.
            const availableVerticalSpace = viewportHeight - sectionPaddingTop - sectionPaddingBottom - headingHeight - headingMarginBottom - 40; 

            effectiveCubeDimension = Math.min(availableVerticalSpace, maxDesiredCubeDimension);
            
            const minDesktopCubeDimension = 600; 
            if (effectiveCubeDimension < minDesktopCubeDimension) {
                effectiveCubeDimension = minDesktopCubeDimension; 
            }

            // --- REFINED: Simplified cubeContainer Positioning (for pinning compatibility) ---
            // Rely entirely on CSS margin:auto for horizontal centering.
            // GSAP will manage 'y' transform (for vertical offset) and other transforms.
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

            // --- REFINED: FromTo animation for cubeContainer ---
            // Only animates autoAlpha and initial y offset, NO SCALE.
            cubeAnimationTimeline.fromTo(cubeContainer,
                { autoAlpha: 0, y: 40 }, // Initial y offset for spacing under heading (y:40 is correct here)
                { autoAlpha: 1, y: 40, duration: 1, ease: "power2.out" }, 0); 

            // Cube rotation and face visibility control (01 -> 08)
            faces.forEach((face, i) => {
                const currentFaceRotation = i * ROTATION_INCREMENT_DEG;
                const labelProgress = i / SERVICES_COUNT;

                cubeAnimationTimeline.addLabel(`face${i}`, labelProgress);
                
                cubeAnimationTimeline.to(cube, {
                    // --- CRITICAL FIX: Changed rotateX to rotateY here ---
                    rotateY: currentFaceRotation, 
                    duration: 1, 
                    ease: "power2.inOut", 
                    onStart: () => {
                        // --- REFINED: Keep inactive faces partially visible for continuity ---
                        const inactiveAutoAlpha = 0.5; 
                        faces.forEach((f, idx) => {
                            // REFINED: Use autoAlpha directly (no scale)
                            gsap.to(f, { autoAlpha: (idx === i) ? 1 : inactiveAutoAlpha, duration: 0.4 }); 
                        });
                    }
                }, `face${i}`);
            });
            
            cubeAnimationTimeline.addLabel(`endRotation`, 1);
            cubeAnimationTimeline.to(cube, {
                // --- CRITICAL FIX: Changed rotateX to rotateY here ---
                rotateY: totalRotation, 
                duration: 1,
                ease: "power2.inOut"
            }, `endRotation-=0.5`);

            // --- REFINED: Final fade out for cubeContainer ---
            // Only autoAlpha, NO SCALE, consistent y offset.
            cubeAnimationTimeline.to([cubeContainer], 
                { autoAlpha: 0, y: 40, duration: 1, ease: "power2.in" }, `endRotation`); 
        }
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
    });
});
