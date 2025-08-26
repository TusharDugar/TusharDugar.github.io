// script.js

// ... (Keep the copyToClipboard, initIntersectionObserverAnimations, and other top-level functions) ...

document.addEventListener('DOMContentLoaded', () => {
    
    // ... (Keep the Mouse Follower and Contact Button initializers) ...

    initIntersectionObserverAnimations();

    // --- REFINED SERVICES CUBE ANIMATION ---
    const servicesSection = document.getElementById('services');
    const servicesPinWrapper = document.getElementById('services-pin-wrapper');
    const cubeContainer = document.querySelector('.cube-container');
    const cube = document.getElementById('services-cube');
    const faces = document.querySelectorAll('.face');
    const SERVICES_COUNT = faces.length;

    // Guard clause
    if (!servicesSection || !servicesPinWrapper || !cubeContainer || !cube || !SERVICES_COUNT) {
        console.error("Services section elements not found. Aborting animation setup.");
        return;
    }

    gsap.matchMedia().add({
        // Run this animation on screens wider than 768px
        isDesktop: "(min-width: 769px)",
        // This is the fallback for mobile
        isMobile: "(max-width: 768px)",
        // Fallback for accessibility
        reducedMotion: "(prefers-reduced-motion: reduce)"
    }, (context) => {
        let { isDesktop, reducedMotion } = context.conditions;

        // If not on desktop or if user prefers reduced motion, apply flat layout and exit
        if (!isDesktop || reducedMotion) {
            gsap.set(faces, { position: 'relative', transform: 'none', autoAlpha: 1 });
            return;
        }

        // --- Desktop Animation Setup ---

        // 1. Calculate the geometry
        const faceHeight = cubeContainer.offsetHeight; // Use the actual height from CSS
        // This is the magic calculation for a seamless prism
        const faceDepth = faceHeight / 2 / Math.tan(Math.PI / SERVICES_COUNT);
        
        // 2. Position each face in 3D space
        faces.forEach((face, i) => {
            const angle = i * (360 / SERVICES_COUNT);
            gsap.set(face, {
                transform: `rotateX(${angle}deg) translateZ(${faceDepth}px)`
            });
        });

        // 3. Set the total scroll height for the wrapper
        servicesPinWrapper.style.height = `${SERVICES_COUNT * 100}vh`;

        // 4. Create the main scroll-driven animation timeline
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: "top top",
                end: "bottom bottom",
                scrub: 1, // Smoothly scrub the animation
                pin: servicesSection, // Pin the section during the scroll
                anticipatePin: 1, // Helps prevent layout jumps
            },
        });

        // Animate the cube's rotation
        tl.to(cube, {
            rotateX: `-${(SERVICES_COUNT - 1) * (360 / SERVICES_COUNT)}`,
            ease: "none", // Linear rotation
        });

        // 5. (Optional) Add a fade-out for the cube at the very end
        gsap.to(cubeContainer, {
            autoAlpha: 0, // Fades out both opacity and visibility
            scale: 0.95,
            scrollTrigger: {
                trigger: servicesPinWrapper,
                start: "bottom bottom-=200px", // Start fading 200px from the end
                end: "bottom bottom",
                scrub: true,
            }
        });

    });

    // Refresh ScrollTrigger on window resize to recalculate dimensions
    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
