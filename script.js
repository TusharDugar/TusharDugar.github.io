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

    // Initialize all reveal-on-scroll animations
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
    const SCROLL_PER_FACE_VH = 50;

    if (!servicesSection || !servicesPinWrapper || !cubeContainer || !cube || SERVICES_COUNT === 0) {
        console.error("Missing key elements for Services 3D cube animation. Aborting.");
        return; 
    }

    function calculateFaceOffset(cubeHeight) {
        if (!cubeHeight || SERVICES_COUNT === 0) return 0;
        return (cubeHeight / 2) / Math.tan(Math.PI / SERVICES_COUNT);
    }

    function setupInitialCubeFaces(cubeHeight) {
        const faceOffset = calculateFaceOffset(cubeHeight);
        faces.forEach((face, i) => {
            const angleForFace = i * ROTATION_INCREMENT_DEG;
            gsap.set(face, { 
                transform: `rotateX(${angleForFace}deg) translateZ(${faceOffset}px)`,
                position: 'absolute',
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
        
        let cubeWidth, cubeHeight;

        if (cubeAnimationTimeline) {
            cubeAnimationTimeline.kill();
            cubeAnimationTimeline = null;
        }
        ScrollTrigger.getById('servicesCubePin')?.kill(true);
        gsap.set([servicesSection, servicesHeading, cubeContainer, cube, ...faces], { clearProps: 'all' });

        if (reducedMotion || mobile) {
            const isMobile = mobile;
            console.log(isMobile ? "Mobile layout: Applying flat layout." : "Reduced motion: Applying flat layout.");
            gsap.set(cube, { transformStyle: 'flat' });
            gsap.set(faces, { position: 'relative', transform: 'none', autoAlpha: 1 });
            if (isMobile) {
                gsap.set(cubeContainer, { width: '100%', height: 'auto', aspectRatio: 'auto' });
            }
            return; 
        }

        if (largeDesktop) {
            cubeWidth = 900;
            cubeHeight = 400;
        } else if (mediumDesktop) {
            cubeWidth = 640;
            cubeHeight = 350;
        }
        
        gsap.set(cubeContainer, { width: cubeWidth, height: cubeHeight, perspective: 2000 });
        setupInitialCubeFaces(cubeHeight);
        
        servicesPinWrapper.style.height = (SERVICES_COUNT * SCROLL_PER_FACE_VH) + 'vh';

        cubeAnimationTimeline = gsap.timeline({
            scrollTrigger: {
                id: 'servicesCubePin',
                trigger: servicesPinWrapper,
                pin: servicesSection,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.8,
                snap: { snapTo: "labels", duration: 0.4, ease: "power2.inOut" },
                pinSpacing: false
            }
        });

        cubeAnimationTimeline
            .from(servicesSection, { autoAlpha: 0, scale: 0.95, duration: 1, ease: "power2.out" })
            .from(servicesHeading, { autoAlpha: 0, y: 30, duration: 1, ease: "power2.out" }, "<")
            .from(cubeContainer, { autoAlpha: 0, scale: 0.9, duration: 1, ease: "power2.out" }, "<0.2");

        faces.forEach((face, i) => {
            const label = `face${i}`;
            const labelPosition = i / (SERVICES_COUNT - 1) * 0.9; 
            cubeAnimationTimeline.addLabel(label, labelPosition);
            cubeAnimationTimeline.to(cube, { rotateX: -i * ROTATION_INCREMENT_DEG, duration: 1, ease: "power2.inOut" }, label);
            cubeAnimationTimeline.to(faces, { autoAlpha: (j) => (j === i ? 1 : 0), duration: 0.5, immediateRender: false }, label);
        });
        
        cubeAnimationTimeline.addLabel("exit", ">-0.5");
        cubeAnimationTimeline.to(cubeContainer, { autoAlpha: 0, scale: 0.9, duration: 1, ease: "power2.in" }, "exit");
        cubeAnimationTimeline.to(servicesHeading, { autoAlpha: 0, y: -30, duration: 1, ease: "power2.in" }, "exit+=0.2");

    });

    ScrollTrigger.refresh();
    
    window.addEventListener("resize", () => {
        ScrollTrigger.refresh();
    });
});
