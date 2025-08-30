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
    const servicesHeading = servicesSection ? servicesSection.querySelector('.services-heading') : null;
    const cube = servicesSection ? document.getElementById('services-cube') : null;
    const faces = servicesSection ? servicesSection.querySelectorAll('.face') : [];
    const SERVICES_COUNT = faces.length;

    // --- NEW: Select new cube related wrappers ---
    const scrollArea = servicesSection ? servicesSection.querySelector('.scroll-area') : null;
    const stickyCubeWrapper = servicesSection ? servicesSection.querySelector('.sticky-cube-wrapper') : null;
    const cubeContainer = stickyCubeWrapper ? stickyCubeWrapper.querySelector('.cube-container') : null; // RE-SELECTED: correct parent for cubeContainer


    // --- Fallback if essential elements are missing ---
    if (!servicesSection || !servicesHeading || !cubeContainer || !cube || !scrollArea || !stickyCubeWrapper || SERVICES_COUNT === 0) { // Added checks for new elements
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible' }); 
        gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); 
        if (servicesHeading) {
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
        }
        if (cubeContainer) gsap.set(cubeContainer, { opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', perspective: 'none' }); // Ensure visible
        if (cube) gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
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
        // Also ensure scrollArea and stickyWrapper for reduced motion/mobile are static
        if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative' });
        if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none' });
        return; 
    }

    // --- Core 3D Cube Logic ---

    // Calculate `translateZ` distance for faces (apothem of a regular polygon)
    function calculateFaceDepth(sideHeight) { 
        if (!sideHeight || SERVICES_COUNT === 0) return 0;
        return (sideHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeWidth, currentCubeHeight) { 
        console.log(`Setting up initial cube faces with width: ${currentCubeWidth}, height: ${currentCubeHeight}`); // Debugging
        let faceDepth = calculateFaceDepth(currentCubeHeight); 
        
        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            const rotation = i * ROTATION_INCREMENT_DEG;
            const correctedRotation = rotation; 

            gsap.set(face, { 
                width: currentCubeWidth + "px",  
                height: currentCubeHeight + "px", 
                transform: `rotateX(${correctedRotation}deg) translateZ(${faceDepth}px)`, 
                opacity: 1, // All faces start visible, brightness filter handles dimming
                visibility: 'visible',
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0, rotateY: 0, transformOrigin: 'center center' }); 
    }

    const mm = gsap.matchMedia(); 

    mm.add({ 
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { 
        console.log("MatchMedia callback fired. Conditions:", context.conditions); 
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;

        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        console.log("Previous ScrollTrigger for cube pin killed.");

        if (reducedMotion) {
            console.log("Reduced motion detected. Applying flat layout for cube.");
            gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible' }); 
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); 
            if (servicesHeading) {
                gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            }
            if (cubeContainer) gsap.set(cubeContainer, { opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', perspective: 'none' });
            if (cube) gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    clearProps: 'transform,opacity,visibility,position,transformStyle',
                    filter: 'none' // Reset filter for reduced motion
                });
            });
            if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative' }); 
            if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none' });
            return; 
        }

        const stripedRevealMask = document.querySelector('.striped-reveal-mask');
        if (stripedRevealMask && !mobile && !reducedMotion) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        console.log("Left column striped overlay removed."); 

                        gsap.from(".about-left-content .reveal-stagger-child", {
                            opacity: 0,
                            y: 25,            
                            duration: 0.5,    
                            stagger: 0.1,     
                            delay: 0.2,       
                            ease: "power2.out",
                            clearProps: "all"
                        });
                        console.log("Left column children staggered reveal triggered with GSAP.");
                        observer.unobserve(entry.target); 
                    }
                });
            }, { rootMargin: "0px", threshold: 0.1 });
            revealObserver.observe(stripedRevealMask);
        } else if (stripedRevealMask) {
            stripedRevealMask.classList.add('revealed');
            console.log("Left column striped reveal instantly revealed (mobile or reduced motion).");
            gsap.set(".about-left-content .reveal-stagger-child", { opacity: 1, y: 0, clearProps: "all" });
        }


        let maxDesiredCubeBaseDimension = 300; 
        if (largeDesktop) {
            maxDesiredCubeBaseDimension = 400; 
        } else if (mediumDesktop) {
            maxDesiredCubeBaseDimension = 350; 
        } 
        
        let effectiveCubeBaseDimension = 300; 

        if (!mobile) { 
            gsap.set(servicesSection, { autoAlpha: 1, clearProps: 'autoAlpha' }); 
            const viewportHeight = window.innerHeight;
            
            effectiveCubeBaseDimension = Math.min(maxDesiredCubeBaseDimension, viewportHeight * 0.6); 

            const minAllowedCubeDimension = 300;
            if (effectiveCubeBaseDimension < minAllowedCubeDimension) {
                effectiveCubeBaseDimension = minAllowedCubeDimension;
            }

            if (scrollArea) {
                const faceCount = faces.length;
                const fixedFaceHeight = 250; // Matches CSS .face height
                const scrollMultiplier = 1; // 1x viewport height per face transition
                const totalScrollLength = (faceCount - 1) * fixedFaceHeight * scrollMultiplier; 

                scrollArea.style.height = `${totalScrollLength}px`;
                console.log(`Scroll area height set to: ${totalScrollLength}px`);
            }

        } else {
             effectiveCubeBaseDimension = 300; 
             if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative' }); 
             if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none' });
        }

        const cubeHeight = effectiveCubeBaseDimension * 0.8; // Reduced height by 20%
        const cubeWidth = effectiveCubeBaseDimension * 1.5; 

        gsap.set(cubeContainer, { 
            width: cubeWidth, 
            height: cubeHeight, 
            maxWidth: cubeWidth, 
            maxHeight: cubeHeight, 
            zIndex: 1, // Cube is behind heading (z-index 2)
        });
        
        setupInitialCubeFaces(cubeWidth, cubeHeight); 

        if (mobile) {
            console.log("Mobile layout active. Disabling 3D scroll animation.");
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,autoAlpha,scale' });
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 });
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            if (cubeContainer) gsap.set(cubeContainer, { opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 1, position: 'relative', top: 'auto', perspective: 'none' });
            if (cube) gsap.set(cube, { transform: 'none', transformStyle: 'flat' });
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
            console.log(`Desktop layout active. Cube size: ${cubeWidth}x${cubeHeight}px. Setting up 3D animation.`); 
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1 });

            // Initial state for cube container (hidden for fade-in)
            gsap.set(cubeContainer, { opacity: 0, y: 50 }); // Set initial state for cubeContainer (used by entry animation)

            gsap.fromTo(cubeContainer, // Target cubeContainer for initial fade-in/scale up
                { opacity: 0, y: 100, scale: 0.8 }, // Smaller initial scale, moves up
                { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out", // Final state
                    scrollTrigger: {
                        trigger: servicesSection, // Trigger on the main services section
                        start: "top 80%", // Start when top of section is 80% from top of viewport
                        end: "top 40%", // Finish before pin starts
                        scrub: false, 
                        toggleActions: "play none none reverse", 
                        onEnter: () => console.log("Cube container entry animation triggered (fromTo)."),
                        onLeaveBack: () => console.log("Cube container entry animation reversed (fromTo)."),
                    }
                }
            );

            gsap.to(cube, {
              rotateX: (SERVICES_COUNT - 1) * (360 / SERVICES_COUNT), // Total rotation to land on Face 08
              ease: "none",
              scrollTrigger: {
                id: 'servicesCubePin',
                trigger: scrollArea, // Trigger on the scroll-area wrapper
                start: "top top",
                end: `+=${(SERVICES_COUNT - 1) * window.innerHeight * 0.95}`, // FIX: Dynamic end to eliminate blank space. Pacing adjustment.
                scrub: true,        
                pin: stickyCubeWrapper, 
                anticipatePin: 1,
                snap: {
                    snapTo: 1 / (SERVICES_COUNT - 1),
                    duration: 1, // Increased duration for smoother snap
                    ease: "power2.inOut"             // Gentler easing
                },
                onUpdate: (self) => {
                  let idx = Math.round(self.progress * (SERVICES_COUNT - 1)); 
                  idx = Math.min(idx, SERVICES_COUNT - 1); 

                  faces.forEach((f, i) => {
                    const isBright = (i === 0 || i === 4); // Face 01 (index 0) and Face 05 (index 4)
                    gsap.to(f, {
                        filter: isBright ? "brightness(1.1)" : "brightness(0.3)", // Apply brightness filter
                        opacity: 1, // Keep opacity at 1
                        visibility: "visible", // Ensure visibility is always set to visible
                        duration: 0.3,
                        ease: "power1.inOut"
                    });
                  });
                },
                onLeave: () => { 
                    gsap.to(cubeContainer, { opacity: 0, y: -150, duration: 1.2, ease: "power2.out" }); 
                    console.log("Cube container animating out onLeave.");
                },
                onEnterBack: () => { 
                    gsap.fromTo(cubeContainer, { opacity: 0, y: -150 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }); 
                    console.log("Cube container animating in onEnterBack.");
                }
              }
            });
            console.log("Desktop cube animation setup complete with new logic."); 
        }
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
        console.log("Window resized. ScrollTrigger refreshed."); 
    });

    setTimeout(() => {
        document.querySelectorAll('.reveal-item, .reveal-child, .reveal-stagger').forEach(el => {
            if (!el.classList.contains('visible') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add("visible");
                console.log("Reveal fallback triggered for:", el);
            }
        });
    }, 2000);
});
