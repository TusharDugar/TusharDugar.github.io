// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const value = button.dataset.contact || ''; 
    if (value) {
        navigator.clipboard.writeText(value)
            .then(() => {
                button.classList.add('copied');
                setTimeout(() => { button.classList.remove('copied'); }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                const textarea = document.createElement('textarea');
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    button.classList.add('copied');
                    setTimeout(() => { button.classList.remove('copied'); }, 2000);
                } catch (ex) {
                    console.error('Failed to copy using execCommand: ', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            });
    }
}

// Simplified and reliable reveal animations
function initIntersectionObserverAnimations() {
  const observerOptions = { 
    root: null, 
    rootMargin: "0px", 
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains("reveal-item")) {
          entry.target.classList.add("visible");
        }
        else if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            setTimeout(() => { child.classList.add("visible"); }, index * 150);
          });
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal-item, .reveal-stagger-container").forEach(el => observer.observe(el));
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

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

    // Initialize all reveal-on-scroll animations
    initIntersectionObserverAnimations();

    // --- Services Section Premium Card Animations ---
    const servicesSection = document.getElementById('services');
    const serviceCards = servicesSection ? servicesSection.querySelectorAll('.face') : [];

    if (servicesSection && serviceCards.length > 0) {
      gsap.set(serviceCards, { opacity: 0, y: 50 });
      gsap.to(serviceCards, {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: servicesSection, start: "top 75%", toggleActions: "play none none none", once: true }
      });
      serviceCards.forEach(card => {
        card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
        card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
      });
    }

    // --- 3D Image Ring (Featured Websites) JS ---
    const ring = document.querySelector(".image-ring");
    const ringImages = document.querySelectorAll(".ring-image");

    if (ring && ringImages.length > 0) {
        let currentRotation = 0;
        const total = ringImages.length;
        const angleStep = 360 / total;

        const dimmedBrightness = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-dimmed-brightness'));
        const activeBrightness = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-active-brightness'));

        function getRadius() {
            return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-ring-radius'));
        }

        function positionItems() {
            const radius = getRadius();
            ringImages.forEach((item, i) => {
                const angle = i * angleStep;
                // ✅ CONFIRMED: Correct transformOrigin for depth
                gsap.set(item, {
                    rotationY: angle,
                    z: radius,
                    transformOrigin: "50% 50% " + (-radius) + "px"
                });
                item.dataset.initialRotation = angle;
            });
        }

        function calculateBrightness(itemAngle, ringRotation) {
            const normalizedRingRotation = (ringRotation % 360 + 360) % 360;
            const effectiveAngle = (parseFloat(itemAngle) - normalizedRingRotation) % 360;
            let angleDiff = Math.abs(effectiveAngle);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            const activeRange = 30;
            return (angleDiff < activeRange) ? activeBrightness : dimmedBrightness;
        }
        
        function updateBrightness(ringRotation) {
            ringImages.forEach((item) => {
                const initialAngle = item.dataset.initialRotation;
                item.querySelector('img').style.filter = `brightness(${calculateBrightness(initialAngle, ringRotation)})`;
            });
        }

        gsap.set(ring, { rotationY: 0 });

        function animateToRotation(targetRotation) {
            gsap.to(ring, {
                rotationY: targetRotation,
                duration: 0.8,
                ease: "power2.out",
                onUpdate: () => {
                    updateBrightness(gsap.getProperty(ring, "rotationY"));
                },
                onComplete: () => {
                    currentRotation = targetRotation;
                }
            });
        }
        
        let isDragging = false, startX = 0;
        
        function onDragStart(e) {
            isDragging = true;
            startX = e.pageX || e.touches[0].pageX;
            gsap.killTweensOf(ring);
        }

        function onDragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            const currentX = e.pageX || e.touches[0].pageX;
            const deltaX = currentX - startX;
            currentRotation += deltaX * 0.5;
            gsap.set(ring, { rotationY: currentRotation });
            updateBrightness(currentRotation);
            startX = currentX;
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            const nearestIndex = Math.round(currentRotation / angleStep);
            const targetRotation = nearestIndex * angleStep;
            animateToRotation(targetRotation);
        }

        ring.addEventListener("mousedown", onDragStart);
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
        ring.addEventListener("touchstart", onDragStart, { passive: true });
        window.addEventListener("touchmove", onDragMove, { passive: false });
        window.addEventListener("touchend", onDragEnd);

        let isScrolling = false;
        const galleryContainer = document.querySelector(".image-ring-container");
        if(galleryContainer) {
            galleryContainer.addEventListener("wheel", (e) => {
                e.preventDefault();
                if (isScrolling) return;
                isScrolling = true;
                
                const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                const step = delta > 0 ? 1 : -1;
                const nearestIndex = Math.round(currentRotation / angleStep);
                const nextIndex = nearestIndex + step;
                const targetRotation = nextIndex * angleStep;
                animateToRotation(targetRotation);

                setTimeout(() => { isScrolling = false; }, 500);
            }, { passive: false });
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                positionItems();
                updateBrightness(currentRotation);
            }, 150);
        });

        positionItems();
        updateBrightness(0);
    }
});
