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

    // --- ✅ CLEANED: 3D Image Ring (Featured Websites) JS ---
    const ring = document.querySelector(".image-ring");
    const galleryItems = document.querySelectorAll(".gallery-item");

    if (ring && galleryItems.length > 0) {
      let currentRotation = 0;
      const total = galleryItems.length;
      const angleStep = 360 / total;

      const dimmedBrightness = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-dimmed-brightness'));
      const activeBrightness = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-active-brightness'));

      function getRadius() {
        return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-ring-radius'));
      }

      // Position items once - JS now handles all centering and 3D distribution
      function positionItems() {
        const radius = getRadius();
        galleryItems.forEach((item, i) => {
          const angle = i * angleStep;
          gsap.set(item, {
            xPercent: -50, // This centers the item relative to its own size
            yPercent: -50, // This centers the item relative to its own size
            rotationY: angle,
            transformOrigin: "50% 50%", // Item rotates around its own center
            z: radius // Item is pushed out along its own Z-axis
          });
          item.dataset.initialRotation = angle;
        });
      }

      function calculateBrightness(itemAngle, ringRotation) {
        const normalizedRingRotation = (ringRotation % 360 + 360) % 360;
        const effectiveAngle = (parseFloat(itemAngle) + normalizedRingRotation) % 360;
        let angleDiff = Math.abs(effectiveAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        return (angleDiff < 30) ? activeBrightness : dimmedBrightness;
      }

      // Always use GSAP to update ring + brightness
      function updateRotation(rot) {
        gsap.set(ring, { rotationY: rot });
        galleryItems.forEach((item) => {
          const initialAngle = item.dataset.initialRotation;
          item.style.filter = `brightness(${calculateBrightness(initialAngle, rot)})`;
        });
      }

      // Snap to nearest
      function animateInertia() {
        const nearestIndex = Math.round(currentRotation / angleStep);
        const targetRotation = nearestIndex * angleStep;
        gsap.to(ring
