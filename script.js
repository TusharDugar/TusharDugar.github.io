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
  // ✅ Mobile-specific threshold for earlier reveals if window is narrow
  const observerOptions = { 
    root: null, 
    rootMargin: "0px", 
    threshold: window.innerWidth < 1024 ? 0.05 : 0.1 // Adjust threshold for smaller screens
  };

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
    // Exclude services-heading from standard reveal-item check if it's already handled
    // The services-heading is made visible via gsap.set inside the matchMedia block
    if (el.closest('.services-heading')) {
      // For the services-heading, ensure it's immediately visible and static
      gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      if (el.matches('.services-heading')) { 
          gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      }
    } else {
      // For all other reveal elements:
      const rect = el.getBoundingClientRect();
      const isInitiallyVisible = (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
      );

      if (isInitiallyVisible) {
          if (el.classList.contains("reveal-item")) {
              gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-parent")) {
              gsap.set(el.querySelectorAll(".reveal-child"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-stagger-container")) {
              gsap.set(el.querySelectorAll(".reveal-stagger"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          }
      } else {
          observer.observe(el);
      }
    }
  });
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");

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

    const scrollArea = servicesSection ? servicesSection.querySelector('.scroll-area') : null;
    const stickyCubeWrapper = servicesSection ? servicesSection.querySelector('.sticky-cube-wrapper') : null;
    const cubeContainer = stickyCubeWrapper ? stickyCubeWrapper.querySelector('.cube-container') : null; 


    // --- Fallback if essential elements are missing ---
    if (!servicesSection || !servicesHeading || !cubeContainer || !cube || !scrollArea || !stickyCubeWrapper || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        // Ensure elements are visible and in a static state if GSAP setup fails
        gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible', clearProps: 'all' }); 
        gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0, clearProps: 'all' }); 
        if (servicesHeading) {
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, clearProps: 'all' });
        }
        if (cubeContainer) gsap.set(cubeContainer, { opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', perspective: 'none', transform: 'none', clearProps: 'all' }); 
        if (cube) gsap.set(cube, { transform: 'none', transformStyle: 'flat', clearProps: 'all' });
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
        if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative', clearProps: 'height,position' });
        if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none', clearProps: 'position,top,height,perspective' });
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
        // console.log(`Setting up initial cube faces with width: ${currentCubeWidth}, height: ${currentCubeHeight}`); // Debugging removed
        let faceDepth = calculateFaceDepth(currentCubeHeight); 
        
        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            const rotation = i * ROTATION_INCREMENT_DEG;
            gsap.set(face, { 
                clearProps: 'transform,opacity,visibility,position,transformStyle', 
                width: currentCubeWidth + "px",  
                height: currentCubeHeight + "px", 
                transform: `rotateX(${rotation}deg) translateZ(${faceDepth}px)`, 
                opacity: 1, 
                visibility: 'visible',
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        gsap.set(cube, { 
            clearProps: 'transform,transformStyle,transformOrigin,rotateX,rotateY',
            transformStyle: 'preserve-3d', 
            rotateX: 0, 
            rotateY: 0, 
            transformOrigin: 'center center' 
        }); 
    }

    const mm = gsap.matchMedia(); 

    // ✅ FINAL CORRECTED MATCHMEDIA LOGIC FOR ROBUST DEVICE DETECTION
    mm.add({
      reducedMotion: "(prefers-reduced-motion: reduce)"
    }, (context) => {
        const screenWidth = window.innerWidth;
        const reducedMotion = context.conditions.reducedMotion;
        const isMobileDevice = /Mobi|Android|iPhone|iPad|Mobile|Tablet/i.test(navigator.userAgent);

        // Desktop is when screen is wide, it's not detected as a mobile device, AND not reduced motion.
        const desktop = screenWidth > 1023 && !isMobileDevice && !reducedMotion;
        // Mobile is simply when it's NOT desktop (covers true mobile, narrow desktop windows, or user agent-detected mobile).
        const mobile = !desktop; 

        console.log("Device Detection:", {
            screenWidth,
            isMobileDevice,
            desktop,
            mobile,
            reducedMotion
        }); // ✅ Keep this log for final verification!

        // Kill any existing ScrollTriggers for the cube to prevent duplicates
        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        // console.log("Previous ScrollTrigger for cube pin killed."); // Debugging removed

        // IMPORTANT: Aggressively clear ALL GSAP-set inline styles on key elements
        // at the start of ANY matchMedia callback. This ensures no lingering
        // styles from a previous breakpoint conflict with the new one.
        gsap.set([servicesSection, servicesHeading, servicesHeading.querySelectorAll('span'), 
                  cubeContainer, cube, faces, scrollArea, stickyCubeWrapper], 
                  { clearProps: 'all' });


        if (reducedMotion || mobile) {
            // console.log("Reduced motion or mobile detected. Applying flat layout for cube."); // Debugging removed
            // Explicitly set non-3D, flat properties for mobile/reduced motion.
            gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible' }); 
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0 }); 
            if (servicesHeading) {
                gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0 });
            }
            if (cubeContainer) {
                gsap.set(cubeContainer, { 
                    opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', 
                    position: 'relative', top: 'auto', transform: 'none', perspective: 'none'
                });
            }
            if (cube) { // Flatten cube element
                gsap.set(cube, { transform: 'none', transformStyle: 'flat', rotateX: 0, rotateY: 0, scale: 1, opacity: 1 });
            }
            faces.forEach(face => {
                // Faces now rely on the .reveal-item class for their mobile animation (HTML already updated)
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat', 
                    filter: 'none' 
                });
            });
            if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative' }); 
            if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none' });
            return; 
        }

        // --- Desktop 3D Cube Animation Logic (only if desktop = true) ---
        if (desktop) { 
            // console.log(`Desktop layout active. Setting up 3D animation.`); // Debugging removed
            gsap.set(servicesSection, { autoAlpha: 1, scale: 1 });

            const viewportHeight = window.innerHeight;
            const maxDesiredCubeBaseDimension = 400;
            let effectiveCubeBaseDimension = Math.min(maxDesiredCubeBaseDimension, viewportHeight * 0.6); 
            const minAllowedCubeDimension = 300;
            effectiveCubeBaseDimension = Math.max(effectiveCubeBaseDimension, minAllowedCubeDimension);

            const fixedFaceHeight = 250;
            const cubeHeight = fixedFaceHeight;
            const cubeWidth = effectiveCubeBaseDimension * 1.5;

            gsap.set(cubeContainer, { 
                width: cubeWidth, 
                height: cubeHeight, 
                maxWidth: cubeWidth, 
                maxHeight: cubeHeight, 
                zIndex: 1, 
                perspective: 'none', 
                transform: 'none'
            });
            
            setupInitialCubeFaces(cubeWidth, cubeHeight); 

            const totalScrollLength = (SERVICES_COUNT - 1) * fixedFaceHeight; 
            scrollArea.style.height = `${totalScrollLength}px`;
            // console.log("ScrollTrigger is initializing with end:", totalScrollLength); // Debugging removed
            
            gsap.fromTo(cube,
                { opacity: 0, y: 100, scale: 0.8, rotateX: 0 },
                { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out",
                    scrollTrigger: {
                        trigger: servicesSection, 
                        start: "top 80%", 
                        end: "top 40%", 
                        scrub: false, 
                        toggleActions: "play none none reverse", 
                        // onEnter: () => console.log("Cube entry animation triggered (fromTo)."), // Debugging removed
                        // onLeaveBack: () => console.log("Cube entry animation reversed (fromTo)."), // Debugging removed
                    }
                }
            );

            gsap.to(cube, {
              rotateX: (SERVICES_COUNT - 1) * (360 / SERVICES_COUNT),
              ease: "none",
              scrollTrigger: {
                id: 'servicesCubePin',
                trigger: scrollArea, 
                start: "top top",
                end: `+=${totalScrollLength}`,
                scrub: true,        
                pin: stickyCubeWrapper, 
                anticipatePin: 1,
                snap: {
                    snapTo: 1 / (SERVICES_COUNT - 1),
                    duration: 0.8, 
                    ease: "power2.inOut"
                },
                onUpdate: (self) => {
                  let activeFaceIndex = Math.round(self.progress * (SERVICES_COUNT - 1)); 
                  activeFaceIndex = Math.max(0, Math.min(activeFaceIndex, SERVICES_COUNT - 1)); 

                  faces.forEach((f, i) => {
                    const isActive = (i === activeFaceIndex);
                    gsap.to(f, {
                        filter: isActive ? "brightness(1.1)" : "brightness(0.3)", 
                        duration: 0.3,
                        ease: "power1.inOut"
                    });
                  });
                },
                onLeave: () => { 
                    gsap.to(cube, { opacity: 0, y: -150, duration: 1.2, ease: "power2.out" }); 
                    // console.log("Cube animating out onLeave."); // Debugging removed
                },
                onEnterBack: () => { 
                    gsap.fromTo(cube, { opacity: 0, y: -150 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
                    // console.log("Cube animating in onEnterBack."); // Debugging removed
                }
              }
            });
            // console.log("Desktop cube animation setup complete with new logic."); // Debugging removed
        }
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
        // console.log("Window resized. ScrollTrigger refreshed."); // Debugging removed
    });

    setTimeout(() => {
        document.querySelectorAll('.reveal-item, .reveal-child, .reveal-stagger').forEach(el => {
            if (!el.classList.contains('visible') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add("visible");
                // console.log("Reveal fallback triggered for:", el); // Debugging removed
            }
        });
    }, 2000);
});
