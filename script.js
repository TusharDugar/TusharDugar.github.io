// script.js
// Global constants for animation timing - these are now primarily controlled by GSAP
const SCROLL_THRESHOLD_PX = 30; // Kept for other potential interactions, but not directly used by GSAP cube
const SCROLL_DEBOUNCE_TIME_MS = 100; // Kept for other potential interactions

// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const valueElement = button.querySelector('.button-value');
    const value = valueElement ? valueElement.textContent.trim() : ''; // Trim whitespace

    if (value) {
        navigator.clipboard.writeText(value)
            .then(() => {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 2000); // Reset after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers or if clipboard API fails (e.g., execCommand)
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

// Unified Function to reveal elements on scroll (for 2D animations)
function initIntersectionObserverAnimations() {
  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }

        // Handle reveal-item (single item reveal like headers, individual cards)
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        // Handle reveal-parent (for About section staggered children)
        else if (entry.target.classList.contains("reveal-parent")) {
          const childrenToStagger = entry.target.querySelectorAll(".reveal-child"); 
          childrenToStagger.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("visible");
            }, index * 100); // Apply stagger delay (100ms)
          });
        }
        // Handle reveal-stagger-container (for staggered children like Tools and Contact buttons)
        else if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("visible");
            }, index * 100); // Apply stagger delay (100ms)
          });
        }
        
        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  // Observe all types of animated containers/items
  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => observer.observe(el));
}


// Scroll Spy for section title (REMOVED TEXT CHANGE LOGIC)
const sections = document.querySelectorAll("section[id], footer[id]");
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for your name

window.addEventListener("scroll", () => {
  let current = ""; 
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });
});


// Mouse Follower Glow (implementation)
document.addEventListener('DOMContentLoaded', () => {
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            requestAnimationFrame(() => {
                gsap.to(mouseFollowerGlow, { x: event.clientX, y: event.clientY, duration: 0.1, ease: "power2.out" });
            });
        });
    }

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Tools, Contact, and other reveal-items)
    initIntersectionObserverAnimations();

    // --- Services Section 3D Cube Animation (GSAP + ScrollTrigger) ---
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const servicesHeading = document.querySelector('.services-heading');
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length;
    const ROTATION_INCREMENT_DEG = 360 / SERVICES_COUNT;
    const SCROLL_PER_FACE_VH = 50; // Tighter scroll distance

    if (!servicesSection || !servicesPinWrapper || !servicesHeading || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting GSAP setup.");
        gsap.set([servicesSection, servicesHeading, cubeContainer, ...faces], { 
            opacity: 1, scale: 1, y: 0, visibility: 'visible', clearProps: 'all' 
        });
        return; 
    }

    function calculateFaceOffset(cubeHeight) {
        if (!cubeHeight || SERVICES_COUNT === 0) return 0;
        return (cubeHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    function setupInitialCubeFaces(currentCubeSize) {
        const faceOffset = calculateFaceOffset(currentCubeSize);
        faces.forEach((face, i) => {
            const angleForFace = i * ROTATION_INCREMENT_DEG;
            gsap.set(face, { 
                transform: `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`,
                position: 'absolute',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
            });
        });
        gsap.set(cube, { transformStyle: 'preserve-3d', rotateX: 0 });
        gsap.set(faces, { autoAlpha: 0 });
        gsap.set(faces[0], { autoAlpha: 1 });
    }

    let cubeAnimationTimeline; 

    gsap.matchMedia().add({
        "largeDesktop": "(min-width: 1201px)",
        "mediumDesktop": "(min-width: 769px) and (max-width: 1200px)",
        "mobile": "(max-width: 768px)",
        "reducedMotion": "(prefers-reduced-motion: reduce)"
    }, (context) => {
        let { largeDesktop, mediumDesktop, mobile, reducedMotion } = context.conditions;
        let currentCubeSize = 300;
        
        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        gsap.set([servicesSection, servicesHeading, cubeContainer, cube, ...faces], { clearProps: 'all' });

        if (reducedMotion) {
            console.log("Reduced motion: Applying flat, stacked layout.");
            gsap.set(cube, { transformStyle: 'flat' });
            faces.forEach(face => { gsap.set(face, { position: 'relative', transform: 'none', autoAlpha: 1 }); });
            return; 
        }

        if (largeDesktop) currentCubeSize = 900;
        else if (mediumDesktop) currentCubeSize = 640;

        gsap.set(cubeContainer, { width: currentCubeSize, height: currentCubeSize, perspective: 1200 });
        
        if (mobile) {
            console.log("Mobile layout: Applying flat, stacked layout.");
            gsap.set(cube, { transformStyle: 'flat' });
            faces.forEach(face => { gsap.set(face, { position: 'relative', transform: 'none', autoAlpha: 1 }); });
            return;
        } 
        
        setupInitialCubeFaces(currentCubeSize);
        
        servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh';

        cubeAnimationTimeline = gsap.timeline({
            scrollTrigger: {
                id: 'servicesCubePin',
                trigger: servicesPinWrapper,
                pin: servicesSection,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.8,
                snap: {
                    snapTo: "labels",
                    duration: 0.4,
                    ease: "power2.inOut"
                },
                pinSpacing: false
            }
        });

        // Entry Animation
        cubeAnimationTimeline
            .from(servicesSection, { autoAlpha: 0, scale: 0.95, duration: 1, ease: "power2.out" })
            .from(servicesHeading, { autoAlpha: 0, y: 30, duration: 1, ease: "power2.out" }, "<")
            .from(cubeContainer, { autoAlpha: 0, scale: 0.9, duration: 1, ease: "power2.out" }, "<0.2");

        // Cube Rotation and Face Visibility
        faces.forEach((face, i) => {
            const label = `face${i}`;
            // Distribute labels across first ~85-90% of the timeline to leave space for the exit animation
            const labelPosition = i / (SERVICES_COUNT - 1) * 0.9; 
            
            cubeAnimationTimeline.addLabel(label, labelPosition);

            cubeAnimationTimeline.to(cube, {
                rotateX: -i * ROTATION_INCREMENT_DEG,
                duration: 1,
                ease: "power2.inOut"
            }, label);
            
            cubeAnimationTimeline.to(faces, {
                // Use a function-based value to set autoAlpha for each face
                autoAlpha: (j) => (j === i ? 1 : 0),
                duration: 0.5
            }, label);
        });
        
        // Staggered Exit Animation
        cubeAnimationTimeline.addLabel("exit", ">-0.5"); // Position the exit label relative to the end

        // Fade out the cube first
        cubeAnimationTimeline.to(cubeContainer, {
            autoAlpha: 0,
            scale: 0.9,
            duration: 1,
            ease: "power2.in"
        }, "exit");
        
        // Then fade out the heading
        cubeAnimationTimeline.to(servicesHeading, {
            autoAlpha: 0,
            y: -30,
            duration: 1,
            ease: "power2.in"
        }, "exit+=0.2"); // Start slightly after the cube starts fading

    });

    ScrollTrigger.refresh();
});
