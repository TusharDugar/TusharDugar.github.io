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
    // This script will only run on screens wider than 1023px
    if (window.matchMedia("(min-width: 1024px)").matches) {
        const ring = document.querySelector(".image-ring");
        const ringImages = document.querySelectorAll(".ring-image");

        if (ring && ringImages.length > 0) {
            const total = ringImages.length;
            const angleStep = 360 / total;
            let currentRotation = 0, isDragging = false, startX = 0, velocity = 0, animationFrame;
            const style = getComputedStyle(document.documentElement);
            let ringRadius = parseFloat(style.getPropertyValue('--gallery-ring-radius'));
            const activeRange = 25, fadeRange = 90; // Increased active range for fewer items
            const dimmedBrightness = parseFloat(style.getPropertyValue('--gallery-dimmed-brightness'));
            const activeBrightness = parseFloat(style.getPropertyValue('--gallery-active-brightness'));

            ringImages.forEach((imgWrapper, i) => {
                const angle = i * angleStep;
                imgWrapper.style.transform = `rotateY(${angle}deg) translateZ(${ringRadius}px)`;
                imgWrapper.dataset.initialRotation = `${angle}`;
                imgWrapper.style.filter = `brightness(${dimmedBrightness})`; // Dim the whole card
            });

            function calculateBrightness(imageInitialAngle, currentRingRotation) {
                const normalizedRingRotation = (currentRingRotation % 360 + 360) % 360;
                const imageEffectiveAngle = (parseFloat(imageInitialAngle) + normalizedRingRotation) % 360;
                let angleDiff = Math.abs(imageEffectiveAngle);
                if (angleDiff > 180) angleDiff = 360 - angleDiff;
                if (angleDiff < activeRange) return activeBrightness;
                if (angleDiff < fadeRange) return dimmedBrightness + (activeBrightness - dimmedBrightness) * ((fadeRange - angleDiff) / (fadeRange - activeRange));
                return dimmedBrightness;
            }

            function updateRotation(rot) {
                ring.style.transform = `translate(-50%, -50%) rotateY(${rot}deg)`;
                ringImages.forEach((imgWrapper) => {
                    const initialAngle = imgWrapper.dataset.initialRotation;
                    if (initialAngle !== undefined) {
                        const brightness = calculateBrightness(initialAngle, rot);
                        imgWrapper.style.filter = `brightness(${brightness})`;
                    }
                });
            }

            function animateInertia() {
                if (!isDragging && Math.abs(velocity) > 0.1) {
                    currentRotation += velocity;
                    velocity *= 0.95; // friction
                    updateRotation(currentRotation);
                    animationFrame = requestAnimationFrame(animateInertia);
                } else if (Math.abs(velocity) <= 0.1) {
                    const nearestAngle = Math.round(currentRotation / angleStep) * angleStep;
                    gsap.to(ring, {
                        rotateY: nearestAngle,
                        duration: 0.5,
                        ease: "power2.out",
                        onUpdate: () => {
                            const currentRotY = gsap.getProperty(ring, "rotateY");
                            ringImages.forEach((imgWrapper) => {
                                const initialAngle = imgWrapper.dataset.initialRotation;
                                if (initialAngle !== undefined) {
                                    const brightness = calculateBrightness(initialAngle, currentRotY);
                                    imgWrapper.style.filter = `brightness(${brightness})`;
                                }
                            });
                        },
                        onComplete: () => { currentRotation = nearestAngle; velocity = 0; }
                    });
                }
            }

            ring.addEventListener("mousedown", (e) => { isDragging = true; startX = e.clientX; cancelAnimationFrame(animationFrame); velocity = 0; });
            window.addEventListener("mousemove", (e) => { if (!isDragging) return; const deltaX = e.clientX - startX; startX = e.clientX; currentRotation += deltaX * 0.5; velocity = deltaX * 0.5; updateRotation(currentRotation); });
            window.addEventListener("mouseup", () => { if (isDragging) { isDragging = false; animateInertia(); } });
            ring.addEventListener("touchstart", (e) => { isDragging = true; startX = e.touches[0].clientX; cancelAnimationFrame(animationFrame); velocity = 0; });
            window.addEventListener("touchmove", (e) => { if (!isDragging) return; const deltaX = e.touches[0].clientX - startX; startX = e.touches[0].clientX; currentRotation += deltaX * 0.5; velocity = deltaX * 0.5; updateRotation(currentRotation); });
            window.addEventListener("touchend", () => { if (isDragging) { isDragging = false; animateInertia(); } });
            
            updateRotation(currentRotation);
        }
    }
});
