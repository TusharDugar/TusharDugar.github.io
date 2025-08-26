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

    // --- "DESIGN CUBE-STYLE" SERVICES ANIMATION ---
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
            gsap.set(faces, { position: 'relative', transform: 'none', autoAlpha: 1 });
            return;
        }

        // --- Desktop Animation Setup ---
        const faceHeight = 300; // Use the new fixed height for calculations
        const faceDepth = faceHeight / 2 / Math.tan(Math.PI / SERVICES_COUNT);
        
        faces.forEach((face, i) => {
            const angle = i * (360 / SERVICES_COUNT);
            gsap.set(face, {
                transform: `rotateX(${angle}deg) translateZ(${faceDepth}px)`
            });
        });

        servicesPinWrapper.style.height = `${SERVICES_COUNT * 100}vh`;

        gsap.to(cube, {
            rotateX: `-${(SERVICES_COUNT - 1) * (360 / SERVICES_COUNT)}`,
            ease: "none",
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                pin: servicesSection,
                anticipatePin: 1
            }
        });

        gsap.to(cubeContainer, {
            autoAlpha: 0,
            scale: 0.9,
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: "bottom bottom-=200",
                end: "bottom bottom",
                scrub: true
            }
        });
    });

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
