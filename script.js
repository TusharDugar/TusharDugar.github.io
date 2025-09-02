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

// Unified Function to reveal elements on scroll (Intersection Observer)
function initIntersectionObserverAnimations() {
  const observerOptions = { 
    root: null, 
    rootMargin: "0px", 
    threshold: window.innerWidth < 1024 ? 0.05 : 0.1
  };
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

    // --- Services Section Premium Card Animations ---
    const servicesSection = document.getElementById('services');
    const serviceCards = servicesSection ? servicesSection.querySelectorAll('.face') : [];

    if (servicesSection && serviceCards.length > 0) {
      gsap.set(serviceCards, { opacity: 0, y: 60, scale: 0.9 });
      gsap.to(serviceCards, {
          opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out", stagger: 0.15,
          scrollTrigger: { trigger: servicesSection, start: "top 80%", toggleActions: "play none none none", once: true }
      });
      serviceCards.forEach(card => {
        card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
        card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
      });
    }

    // --- [UPDATED] 3D Image Ring (Featured Websites) JS ---
    const ring = document.querySelector(".image-ring");
    const galleryItems = document.querySelectorAll(".gallery-item");

    if (ring && galleryItems.length > 0) {
        let isDragging = false, startX = 0, currentRotation = 0, velocity = 0, animationFrame;
        const total = galleryItems.length;
        const angleStep = 360 / total;
        const style = getComputedStyle(document.documentElement);
        
        const dimmedBrightness = parseFloat(style.getPropertyValue('--gallery-dimmed-brightness'));
        const activeBrightness = parseFloat(style.getPropertyValue('--gallery-active-brightness'));

        function getRadius() {
            return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-ring-radius'));
        }

        function positionItems() {
            const radius = getRadius();
            galleryItems.forEach((item, i) => {
                const angle = i * angleStep;
                item.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
                item.dataset.initialRotation = angle;
            });
        }
        
        function calculateBrightness(itemAngle, ringRotation) {
            const normalizedRingRotation = (ringRotation % 360 + 360) % 360;
            const effectiveAngle = (parseFloat(itemAngle) + normalizedRingRotation) % 360;
            let angleDiff = Math.abs(effectiveAngle);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            const activeRange = 30; // degrees
            if (angleDiff < activeRange) return activeBrightness;
            return dimmedBrightness;
        }

        function updateRotation(rot) {
            ring.style.transform = `rotateY(${rot}deg)`;
            galleryItems.forEach((item) => {
                const initialAngle = item.dataset.initialRotation;
                item.style.filter = `brightness(${calculateBrightness(initialAngle, rot)})`;
            });
        }

        function animateInertia() {
            if (!isDragging && Math.abs(velocity) > 0.1) {
                currentRotation += velocity;
                velocity *= 0.95; // friction
                updateRotation(currentRotation);
                animationFrame = requestAnimationFrame(animateInertia);
            } else if (!isDragging) {
                const nearestAngle = Math.round(currentRotation / angleStep) * angleStep;
                gsap.to(ring, {
                    rotationY: nearestAngle,
                    duration: 0.5,
                    ease: "power2.out",
                    onUpdate: () => {
                        const currentRotY = gsap.getProperty(ring, "rotationY");
                        galleryItems.forEach((item) => {
                            const initialAngle = item.dataset.initialRotation;
                            item.style.filter = `brightness(${calculateBrightness(initialAngle, currentRotY)})`;
                        });
                    },
                    onComplete: () => { currentRotation = nearestAngle; }
                });
            }
        }

        function onDragStart(e) { isDragging = true; startX = e.pageX || e.touches[0].pageX; cancelAnimationFrame(animationFrame); velocity = 0; }
        function onDragMove(e) { if (!isDragging) return; const currentX = e.pageX || e.touches[0].pageX; const deltaX = currentX - startX; velocity = deltaX * 0.8; currentRotation += velocity; updateRotation(currentRotation); startX = currentX; }
        function onDragEnd() { if (isDragging) { isDragging = false; animateInertia(); } }

        ring.addEventListener("mousedown", onDragStart);
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
        ring.addEventListener("touchstart", onDragStart, { passive: true });
        window.addEventListener("touchmove", onDragMove);
        window.addEventListener("touchend", onDragEnd);

        window.addEventListener('resize', positionItems);

        // Initial setup
        positionItems();
        updateRotation(0);
    }
});
