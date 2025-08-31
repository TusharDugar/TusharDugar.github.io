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
  // Mobile-specific threshold for earlier reveals if window is narrow
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

    // --- FIX: Add reveal-item class to faces for mobile animations ---
    // (This is technically redundant if already in HTML, but harmless)
    faces.forEach(face => face.classList.add('reveal-item'));

    const mm = gsap.matchMedia();

    mm.add({
      reducedMotion: "(prefers-reduced-motion: reduce)"
    }, (context) => {
        const screenWidth = window.innerWidth;
        const reducedMotion = context.conditions.reducedMotion;
        const desktop = screenWidth > 1023 && !reducedMotion;
        const mobile = !desktop;

        console.log("Device Detection:", {
            screenWidth, desktop, mobile, reducedMotion
        });

        ScrollTrigger.getById('servicesCubePin')?.kill(true);

        // Don't clear all props – only the transforms and relevant GSAP-applied properties
        gsap.set([
            servicesHeading, cube, cubeContainer, ...faces, scrollArea, stickyCubeWrapper
        ], { clearProps: 'transform, rotateX, rotateY, scale, width, height, maxWidth, maxHeight, position, top, perspective, zIndex, transformStyle, opacity, visibility, filter' });

        if (mobile || reducedMotion) {
            console.log("✅ Mobile/Reduced Motion cube fallback active...");
            // Mobile fallback: Flat stacked layout. IO will handle fade-in due to 'reveal-item' class.
            gsap.set(cube, { transformStyle: 'flat', transform: 'none' });
            faces.forEach(face => {
                // Ensure faces are relative and flat; IO handles initial opacity/visibility
                gsap.set(face, {
                    position: 'relative',
                    transform: 'none',
                    transformStyle: 'flat',
                    filter: 'none' // Ensure filter is off for mobile/reduced motion
                });
            });
            gsap.set(cubeContainer, {
                position: 'relative',
                transform: 'none',
                width: '100%',
                height: 'auto',
                opacity: 1, // Ensure container is visible
                visibility: 'visible' // Ensure container is visible
            });
            gsap.set(scrollArea, { height: 'auto', position: 'relative' });
            gsap.set(stickyCubeWrapper, { position: 'relative', height: 'auto', perspective: 'none' });
            return;
        }

        // Desktop Mode: Cube Rotation
        console.log("✅ Desktop cube animation initializing...");
        const cubeHeight = 250; // Fixed height for faces
        const cubeWidth = 400;  // Fixed width for faces
        // FIX: Calculate the apothem based on face HEIGHT (for rotateX)
        const faceDepth = (cubeHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);

        gsap.set(cubeContainer, {
            width: cubeWidth,
            height: cubeHeight,
            perspective: 1600, // Apply perspective here for the container
            // Ensure no lingering `position` or `transform` from mobile setup
            position: 'relative', 
            transform: 'none',
            opacity: 1,
            visibility: 'visible',
            zIndex: 1 // Ensure cube is visible if something else resets z-index
        });

        faces.forEach((face, i) => {
            const rotation = i * (360 / SERVICES_COUNT);
            gsap.set(face, {
                width: cubeWidth,
                height: cubeHeight,
                // Faces rotate around their center, then translate out
                transform: `rotateX(${rotation}deg) translateZ(${faceDepth}px)`,
                position: 'absolute', // Absolute positioning for 3D stack
                transformStyle: 'preserve-3d',
                opacity: 1, // Ensure faces are initially visible for desktop setup
                visibility: 'visible', // Ensure faces are initially visible for desktop setup
                backfaceVisibility: 'visible' // FIX: Ensure backface is visible
            });
        });

        gsap.set(cube, {
            transformStyle: 'preserve-3d',
            rotateX: 0,
            rotateY: 0, // Ensure no unintended Y rotation
            transformOrigin: 'center center' // Crucial for correct rotation
        });

        // Set scroll area height to allow for pinning and scrolling through faces
        scrollArea.style.height = `${(SERVICES_COUNT - 1) * cubeHeight}px`;
        
        // Initial reveal of the cube, similar to other reveal-items
        gsap.fromTo(cubeContainer, // Animate the container for initial appearance
            { opacity: 0, y: 100, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out",
                scrollTrigger: {
                    trigger: servicesSection, // Trigger when services section starts
                    start: "top 80%",
                    end: "top 40%",
                    scrub: false,
                    toggleActions: "play none none reverse",
                    once: true 
                }
            }
        );

        // Main cube rotation animation
        gsap.to(cube, {
            rotateX: (SERVICES_COUNT - 1) * (360 / SERVICES_COUNT), // Rotate to show all faces
            ease: 'none',
            scrollTrigger: {
                id: 'servicesCubePin',
                trigger: scrollArea,
                start: 'top top',
                end: `+=${(SERVICES_COUNT - 1) * cubeHeight}`,
                scrub: true,
                pin: stickyCubeWrapper,
                anticipatePin: 1,
                snap: {
                    snapTo: 1 / (SERVICES_COUNT - 1),
                    duration: 0.8,
                    ease: "power2.inOut"
                },
                onUpdate: (self) => {
                    const activeFace = Math.round(self.progress * (SERVICES_COUNT - 1));
                    faces.forEach((face, i) => {
                        gsap.to(face, {
                            filter: i === activeFace ? "brightness(1.1)" : "brightness(0.3)",
                            duration: 0.3,
                            overwrite: true // Prevent conflicting animations on filter
                        });
                    });
                },
                onLeave: () => {
                    gsap.to(cubeContainer, { opacity: 0, y: -150, duration: 1.2, ease: "power2.out" });
                },
                onEnterBack: () => {
                    gsap.fromTo(cubeContainer, { opacity: 0, y: -150 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
                }
            }
        });
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
    });

    setTimeout(() => {
        document.querySelectorAll('.reveal-item, .reveal-child, .reveal-stagger').forEach(el => {
            if (!el.classList.contains('visible') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add("visible");
            }
        });
    }, 2000);
});
