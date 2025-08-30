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
      gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' }); // Added clearProps: 'all' to ensure no previous transforms
      if (el.matches('.services-heading')) { 
          gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' }); // Added clearProps: 'all'
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

    const scrollArea = servicesSection ? servicesSection.querySelector('.scroll-area') : null;
    const stickyCubeWrapper = servicesSection ? servicesSection.querySelector('.sticky-cube-wrapper') : null;
    const cubeContainer = stickyCubeWrapper ? stickyCubeWrapper.querySelector('.cube-container') : null; 


    // --- Fallback if essential elements are missing ---
    if (!servicesSection || !servicesHeading || !cubeContainer || !cube || !scrollArea || !stickyCubeWrapper || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        gsap.set(servicesSection, { position: 'relative', top: 'auto', left: 'auto', x: 0, y: 0, opacity: 1, scale: 1, visibility: 'visible', clearProps: 'all' }); 
        gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0, clearProps: 'all' }); 
        if (servicesHeading) {
            gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, clearProps: 'all' });
        }
        if (cubeContainer) gsap.set(cubeContainer, { opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', position: 'relative', top: 'auto', perspective: 'none', transform: 'none' }); 
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
            gsap.set(face, { 
                width: currentCubeWidth + "px",  
                height: currentCubeHeight + "px", 
                transform: `rotateX(${rotation}deg) translateZ(${faceDepth}px)`, 
                opacity: 1, 
                visibility: 'visible',
                position: 'absolute',
                transformStyle: 'preserve-3d',
                clearProps: 'transform,opacity,visibility,position,transformStyle' // Clear previous inline styles before setting
            });
        });
        // Ensure cube itself is a 3D container, starting at 0 rotation
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0, rotateY: 0, transformOrigin: 'center center', clearProps: 'transform,transformStyle,transformOrigin,rotateX,rotateY' }); 
    }

    const mm = gsap.matchMedia(); 

    mm.add({ 
        "desktop": "(min-width: 1024px)", // Unified desktop breakpoint with CSS
        "mobile": "(max-width: 1023px)",   // Unified mobile breakpoint with CSS
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { 
        console.log("MatchMedia callback fired. Conditions:", context.conditions); 
        
        let { desktop, mobile, reducedMotion } = context.conditions;

        // Kill any existing ScrollTriggers for the cube to prevent duplicates
        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        console.log("Previous ScrollTrigger for cube pin killed.");

        // If reduced motion or mobile, flatten the cube layout and return
        if (reducedMotion || mobile) {
            console.log("Reduced motion or mobile detected. Applying flat layout for cube.");
            // Explicitly set flat, visible, non-3D states. Avoid aggressive clearProps: 'all'.
            gsap.set(servicesSection, { clearProps: 'position,top,left,width,max-width,transform,z-index,padding,autoAlpha,scale' }); 
            gsap.set(servicesHeading, { opacity: 1, y: 0, x: 0, clearProps: 'opacity,y,x' }); 
            if (servicesHeading) {
                gsap.set(servicesHeading.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, clearProps: 'opacity,y,x' });
            }
            if (cubeContainer) {
                gsap.set(cubeContainer, { 
                    opacity: 1, y: 0, scale: 1, width: '100%', height: 'auto', maxWidth: '100%', aspectRatio: 'auto', 
                    position: 'relative', top: 'auto', perspective: 'none', transform: 'none', clearProps: 'all' // Clear props of the container that GSAP might have set
                });
            }
            if (cube) { // Flatten cube element
                gsap.set(cube, { transform: 'none', transformStyle: 'flat', clearProps: 'all' }); // Clear all props of the cube itself
            }
            faces.forEach(face => {
                gsap.set(face, { 
                    transform: 'none', 
                    opacity: 1, 
                    visibility: 'visible', 
                    position: 'relative', 
                    transformStyle: 'flat',
                    filter: 'none', // Reset filter for reduced motion/mobile
                    clearProps: 'transform,opacity,visibility,position,transformStyle,filter'
                });
            });
            if (scrollArea) gsap.set(scrollArea, { height: 'auto', position: 'relative', clearProps: 'height,position' }); 
            if (stickyCubeWrapper) gsap.set(stickyCubeWrapper, { position: 'relative', top: 'auto', height: 'auto', perspective: 'none', clearProps: 'position,top,height,perspective' });
            return; 
        }

        // --- Desktop 3D Cube Animation Logic (only if not mobile or reduced motion) ---
        console.log(`Desktop layout active. Setting up 3D animation.`); 
        gsap.set(servicesSection, { autoAlpha: 1, scale: 1, clearProps: 'autoAlpha,scale' });

        const viewportHeight = window.innerHeight;
        const maxDesiredCubeBaseDimension = 400; // Unified for desktop sizes
        let effectiveCubeBaseDimension = Math.min(maxDesiredCubeBaseDimension, viewportHeight * 0.6); 
        const minAllowedCubeDimension = 300;
        effectiveCubeBaseDimension = Math.max(effectiveCubeBaseDimension, minAllowedCubeDimension); // Ensure minimum size

        const fixedFaceHeight = 250; // Matches CSS .face height
        const cubeHeight = fixedFaceHeight; // Cube's overall height is defined by face height
        const cubeWidth = effectiveCubeBaseDimension * 1.5; // Width is still proportionally calculated

        gsap.set(cubeContainer, { 
            width: cubeWidth, 
            height: cubeHeight, 
            maxWidth: cubeWidth, 
            maxHeight: cubeHeight, 
            zIndex: 1, 
            clearProps: 'width,height,maxWidth,maxHeight,zIndex'
        });
        
        setupInitialCubeFaces(cubeWidth, cubeHeight); 

        // Calculate total scroll length for the cube based on face height and count
        const totalScrollLength = (SERVICES_COUNT - 1) * fixedFaceHeight; 
        scrollArea.style.height = `${totalScrollLength}px`;
        console.log(`Scroll area height set to: ${totalScrollLength}px`);
        
        // Cube entry animation (fade-in and scale up from defined initial state)
        gsap.fromTo(cube,
            { opacity: 0, y: 100, scale: 0.8 }, // From these values
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out", // To these values
                scrollTrigger: {
                    trigger: servicesSection, 
                    start: "top 80%", 
                    end: "top 40%", 
                    scrub: false, 
                    toggleActions: "play none none reverse", 
                    onEnter: () => console.log("Cube entry animation triggered (fromTo)."),
                    onLeaveBack: () => console.log("Cube entry animation reversed (fromTo)."),
                }
            }
        );

        // Main cube rotation animation
        gsap.to(cube, {
          rotateX: (SERVICES_COUNT - 1) * (360 / SERVICES_COUNT), // Total rotation to land on Face 08 (315deg)
          ease: "none",
          scrollTrigger: {
            id: 'servicesCubePin',
            trigger: scrollArea, 
            start: "top top",
            end: `+=${totalScrollLength}`, // Use the calculated pixel length for end
            scrub: true,        
            pin: stickyCubeWrapper, 
            anticipatePin: 1,
            snap: {
                snapTo: 1 / (SERVICES_COUNT - 1),
                duration: 0.8, // Slightly reduced duration for snappier feel
                ease: "power2.inOut"
            },
            onUpdate: (self) => {
              let activeFaceIndex = Math.round(self.progress * (SERVICES_COUNT - 1)); 
              activeFaceIndex = Math.max(0, Math.min(activeFaceIndex, SERVICES_COUNT - 1)); // Ensure valid index

              faces.forEach((f, i) => {
                const isActive = (i === activeFaceIndex);
                gsap.to(f, {
                    filter: isActive ? "brightness(1.1)" : "brightness(0.3)", // Active face is bright, others dim
                    duration: 0.3,
                    ease: "power1.inOut"
                });
              });
            },
            onLeave: () => { 
                gsap.to(cube, { opacity: 0, y: -150, duration: 1.2, ease: "power2.out" }); 
                console.log("Cube animating out onLeave.");
            },
            onEnterBack: () => { 
                gsap.fromTo(cube, { opacity: 0, y: -150 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
                console.log("Cube animating in onEnterBack.");
            }
          }
        });
        console.log("Desktop cube animation setup complete with new logic."); 
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
