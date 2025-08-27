// script.js

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
  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => observer.observe(el));
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Mouse Follower Glow
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (event) => {
            gsap.to(mouseFollowerGlow, { x: event.clientX, y: event.clientY, duration: 0.3, ease: "power2.out" });
        });
    }

    // Initialize contact button functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize all other reveal-on-scroll animations
    initIntersectionObserverAnimations();

    // --- FINAL POLISHED SERVICES ANIMATION ---
    const servicesSection = document.getElementById('services'); // This should be the main section wrapper
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const servicesHeading = document.querySelector('.services-heading'); // Get the heading
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length;

    if (!servicesSection || !servicesPinWrapper || !servicesHeading || !cubeContainer || !cube || !SERVICES_COUNT) {
        console.error("Services section elements not found. Aborting animation setup.");
        return;
    }

    gsap.matchMedia().add({
        isDesktop: "(min-width: 769px)",
        isMobile: "(max-width: 768px)",
        reducedMotion: "(prefers-reduced-motion: reduce)"
    }, (context) => {
        let { isDesktop, reducedMotion } = context.conditions;

        if (!isDesktop || reducedMotion) {
            gsap.set(faces, { position: 'relative', transform: 'none', autoAlpha: 1 });
            return;
        }

        const faceHeight = 220;
        const faceDepth = (faceHeight / 2) / Math.sin(Math.PI / SERVICES_COUNT);
        
        faces.forEach((face, i) => {
            const angle = i * (360 / SERVICES_COUNT);
            gsap.set(face, {
                transform: `rotateX(${angle}deg) translateZ(${faceDepth}px)`
            });
        });

        // Calculate a more dynamic scroll length based on heading and cube height
        // This ensures the heading is visible during the animation
        const headingHeight = servicesHeading.offsetHeight;
        const cubeOffsetTop = cubeContainer.offsetTop; // Distance from services section top to cube container
        const cubePinStart = headingHeight + 60; // Start pinning the cube after the heading + its margin-bottom
        
        // Ensure the cube is positioned correctly relative to the top of its container
        gsap.set(cubeContainer, {
            position: 'absolute',
            top: cubePinStart,
            left: '50%',
            x: '-50%', // Center horizontally
            width: '100%', // Ensure it takes full width
            maxWidth: '800px', // Max width
        });


        // The total scroll length needs to account for the heading and the cube's animation.
        // We want the cube to animate through all faces and then potentially unpin.
        // A rough estimate: (SERVICES_COUNT * a factor) + space for the heading to be visible.
        const effectiveScrollLength = (SERVICES_COUNT * faceHeight * 1.5); // Adjusted factor
        servicesPinWrapper.style.height = `${effectiveScrollLength + headingHeight + 200}px`; // Add extra buffer

        gsap.timeline({
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: `top top`, // Start when the top of the pin wrapper hits the top of the viewport
                end: "bottom bottom",
                scrub: 1,
                pin: servicesSection, // Pin the entire section, not just the wrapper
                anticipatePin: 1
            }
        })
        .fromTo(cube,
            { rotateX: 0 },
            {
                rotateX: `${(SERVICES_COUNT - 1) * (360 / SERVICES_COUNT)}`, // Change to positive for 01 to 08
                ease: "none",
            },
            0 // Start this tween at the beginning of the timeline
        )
        .to(cubeContainer, {
            autoAlpha: 0,
            scale: 0.9,
            ease: "power1.in", // Make it fade out more smoothly
        }, `+=${effectiveScrollLength * 0.9}`); // Start fade out near the end of the scroll animation


    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
