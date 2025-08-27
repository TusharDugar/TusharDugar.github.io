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
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length;

    if (!servicesSection || !servicesPinWrapper || !cubeContainer || !cube || !SERVICES_COUNT) {
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
            // For mobile or reduced motion, stack faces naturally
            gsap.set(faces, { position: 'relative', transform: 'none', autoAlpha: 1 });
            return;
        }

        const faceHeight = 220; // Height of each face
        // Calculate depth to make faces form a circular array (polygon)
        // For N faces, inner angle is (N-2)*180/N, so angle to center from face edge is 180/N
        // If face width = 2*r*sin(180/N), depth = r*cos(180/N)
        // Since we are rotating around X, we use faceHeight.
        // We want the faces to form a cylinder, so their 'back' is at the center.
        // The distance from the center of the cylinder to a face is the radius.
        // The half-height of a face divided by sin(180/SERVICES_COUNT) gives the radius.
        const radius = (faceHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
        
        faces.forEach((face, i) => {
            // Calculate angle for each face to be evenly distributed around the X-axis
            // Start from 0 degrees (face 0) and rotate clockwise.
            const angle = i * (360 / SERVICES_COUNT);
            gsap.set(face, {
                // Rotate around the X-axis, then translate along Z-axis
                transform: `rotateX(${angle}deg) translateZ(${radius}px)`
            });
        });

        // Determine scroll length based on number of faces and desired spacing
        const scrollLength = SERVICES_COUNT * faceHeight * 1.5; // Increased multiplier for more scroll room
        servicesPinWrapper.style.height = `${scrollLength}px`;

        gsap.fromTo(cube,
            { rotateX: 0 }, // Start at 0 degrees (face 0 visible)
            {
                // Rotate to show faces 01 to 08 in order.
                // Each step rotates by 360/SERVICES_COUNT degrees.
                // To show face 'i', we rotate by -i * (360/SERVICES_COUNT).
                // So for 8 faces, we need to rotate to show face 7, which is -7 * (360/8) = -7 * 45 = -315 degrees.
                rotateX: `${-(SERVICES_COUNT - 1) * (360 / SERVICES_COUNT)}deg`,
                ease: "none",
                scrollTrigger: {
                    trigger: servicesPinWrapper,
                    start: "top top", // Pin when the top of the wrapper hits the top of the viewport
                    end: "bottom bottom", // End when the bottom of the wrapper leaves the bottom of the viewport
                    scrub: 1,
                    pin: servicesSection, // Pin the entire servicesSection, so the heading stays
                    anticipatePin: 1
                }
            }
        );

        // Optional: Fade out cube container as it scrolls past
        gsap.to(cubeContainer, {
            autoAlpha: 0,
            scale: 0.9,
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: "bottom bottom-=200", // Start fading 200px before the end of the pin
                end: "bottom bottom",
                scrub: true
            }
        });
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
