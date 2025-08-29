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

// Global constant for services cube scroll length
const SCROLL_PER_FACE_VH = 240; // FIX: Reduced scroll area

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
    function calculateFaceDepth(sideHeight) { // Renamed parameter to sideHeight
        if (!sideHeight || SERVICES_COUNT === 0) return 0;
        // FIX: Changed from Math.sin to Math.tan for correct cube depth
        return (sideHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    // Set up initial 3D positioning of each face and cube
    function setupInitialCubeFaces(currentCubeWidth, currentCubeHeight) { 
        console.log(`Setting up initial cube faces with width: ${currentCubeWidth}, height: ${currentCubeHeight}`); // Debugging
        let faceDepth = calculateFaceDepth(currentCubeHeight); // Use currentCubeHeight for depth calculation
        
        const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

        faces.forEach((face, i) => {
            gsap.set(face, { 
                width: currentCubeWidth + "px",  
                height: currentCubeHeight + "px", 
                transform: `rotateX(${i * ROTATION_INCREMENT_DEG}deg) translateZ(${faceDepth}px)`, 
                // FIX: All faces start visible in 3D, relying on perspective to hide others
                autoAlpha: 1, 
                position: 'absolute',
                transformStyle: 'preserve-3d',
            });
        });
        // Set up cube with preserve-3d and initial rotation (0)
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0, rotateY: 0, transformOrigin: 'center center' }); 
    }

    let cubeAnimationTimeline;

    const mm = gsap.matchMedia(); 

    mm.add({ 
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"

    }, (context) => { 
        console.log("MatchMedia callback fired. Conditions:", context.conditions); // Debugging: Confirm matchMedia fires
        
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;

        // --- Kill/Revert previous animations for clean re-initialization ---
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
            console.log("Existing cube animation timeline killed.");
        }
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

        // --- Left Column Fix for visibility and sticky ---
        const leftCol = document.querySelector('.left-column-sticky');
        if (leftCol && !mobile) { // Apply this logic only for desktop/medium screens, not mobile
            // Desktop logic
            // The initial CSS animation runs. After it finishes, its animation properties
            // (opacity:1, transform: translateY(0)) are its final state due to 'forwards'.
            // Here, we ensure the browser applies the sticky properties and remove the CSS animation property.
            // This is to combat any caching or browser quirks where 'animation' property might interfere with 'sticky'.
            setTimeout(() => {
                leftCol.style.animation = 'none'; // Clear animation property
                leftCol.style.opacity = '1';      // Explicitly ensure opacity is 1
                leftCol.style.transform = 'translateY(-50%)'; // Ensure final sticky transform is applied
                leftCol.style.display = 'flex'; // FIX: Explicitly ensure display is flex
                console.log("Left column: Animation cleared, sticky transform & display flex applied by JS.");
            }, 1400); // animation-delay (0.4s) + animation-duration (1s) = 1.4s
        } else if (leftCol && mobile) { // Ensure correct non-sticky state for mobile, clearing any desktop influence
            gsap.set(leftCol, {
                opacity: 1,
                display: 'flex', // Ensure display is flex for mobile layout
                transform: 'none',
                position: 'relative',
                top: 'auto',
                animation: 'none',
                clearProps: 'all' // Clear all GSAP/CSS applied styles
            });
            console.log("Left column: Set to non-sticky, visible for mobile via GSAP.set.");
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
        const cubeHeight = effectiveCubeBaseDimension * 0.85; // FIX: Reduced height by 15%
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
            gsap.set(servicesHeading, { autoAlpha: 1, y: 0, x: 0 });
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

            servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh'; // FIX: Using new SCROLL_PER_FACE_VH
            const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;

            cubeAnimationTimeline = gsap.timeline({
                scrollTrigger: {
                    id: 'servicesCubePin',
                    trigger: servicesPinWrapper,
                    start: "top top",
                    end: "bottom bottom",
                    pin: servicesSection,
                    scrub: 1, // FIX: Faster animation
                    snap: {
                        snapTo: "labels", // Snap to defined labels for precise face transitions
                        duration: 0.4,    
                        ease: "power3.out" 
                    },
                    pinSpacing: true, // Ensure space is reserved for content after pinned section
                    anticipatePin: 1, 
                    // markers: true, // DEBUG: Temporarily enable to visualize ScrollTrigger
                }
            });

            // Tighter vertical alignment below heading
            const cubeTopOffset = servicesHeading.offsetHeight + 40; // FIX: Increased offset
            gsap.set(cubeContainer, { autoAlpha: 1, y: cubeTopOffset });

            // The main cube rotation over the entire ScrollTrigger duration.
            // It rotates from 0deg (Face 01) up to the position of the last face.
            cubeAnimationTimeline.to(cube, {
                rotateX: (SERVICES_COUNT - 1) * ROTATION_INCREMENT_DEG, // Sequential order is correct here
                ease: "none", // Main rotation should be linear for scrub
            }, 0); // Start at the beginning of the timeline

            // FIX: Removed individual face autoAlpha toggling. All faces are always visible.
            // The 3D perspective will naturally hide faces not facing the user.
            faces.forEach((face, i) => {
                const rotationTarget = i * ROTATION_INCREMENT_DEG;
                const label = `face${i + 1}`;
                const progressPoint = rotationTarget / ((SERVICES_COUNT - 1) * ROTATION_INCREMENT_DEG || 1);
                cubeAnimationTimeline.addLabel(label, progressPoint);
            });
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
