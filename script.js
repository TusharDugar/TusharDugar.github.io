document.addEventListener("DOMContentLoaded", function () {
    gsap.registerPlugin(ScrollTrigger);

    // Function to copy text to clipboard
    function copyToClipboard(button) {
        const value = button.dataset.contact || '';
        if (value) {
            navigator.clipboard.writeText(value).then(() => {
                button.classList.add('copied');
                setTimeout(() => button.classList.remove('copied'), 2000);
            }).catch(err => console.error('Failed to copy: ', err));
        }
    }

    // Function to reveal elements on scroll
    function initIntersectionObserverAnimations() {
        const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    if (entry.target.classList.contains("reveal-stagger-container")) {
                        const children = entry.target.querySelectorAll(".reveal-stagger");
                        children.forEach((child, index) => {
                            setTimeout(() => child.classList.add("visible"), index * 100);
                        });
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        document.querySelectorAll(".reveal-item, .reveal-stagger-container").forEach(el => observer.observe(el));
    }

    // Main execution
    // Mouse Follower
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(mouseFollowerGlow, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
        });
    }

    // Contact Buttons
    document.querySelectorAll('.contact-button').forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Reveal Animations
    initIntersectionObserverAnimations();

    // GSAP Animations for Services Cards
    const serviceCards = document.querySelectorAll('#services .face');
    if (serviceCards.length > 0) {
        gsap.from(serviceCards, {
            opacity: 0, y: 50, duration: 0.8, ease: "power3.out", stagger: 0.15,
            scrollTrigger: { trigger: ".services-card-grid", start: "top 80%", once: true }
        });
        serviceCards.forEach(card => {
            card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
            card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
        });
    }

    // === Featured Websites Ring Animation ===
    const ring = document.querySelector(".image-ring");
    const galleryItems = document.querySelectorAll(".gallery-item");

    if (ring && galleryItems.length > 0) {
      let currentRotation = 0;
      const total = galleryItems.length;
      const angleStep = 360 / total;

      function getRadius() {
        return 320; // matches CSS transform-origin
      }

      function positionItems() {
        const radius = getRadius();
        galleryItems.forEach((item, i) => {
          const angle = i * angleStep;
          gsap.set(item, {
            rotationY: angle,
            z: radius,
            transformOrigin: `50% 50% ${-radius}px`
          });
          item.dataset.initialRotation = angle;
        });
      }

      function updateBrightness(rotation) {
        const dimmed = 0.5, active = 1.1;
        const normalized = (rotation % 360 + 360) % 360;
        galleryItems.forEach(item => {
          const initial = parseFloat(item.dataset.initialRotation);
          let effective = (initial - normalized + 360) % 360;
          if (effective > 180) effective = 360 - effective;
          const brightness = (effective < 45) ? active : dimmed;
          gsap.to(item, { filter: `brightness(${brightness})`, duration: 0.4 });
        });
      }

      function animateToRotation(targetRotation) {
        gsap.to(ring, {
          rotationY: targetRotation,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => updateBrightness(gsap.getProperty(ring, "rotationY")),
          onComplete: () => { currentRotation = targetRotation; }
        });
      }

      // Drag/Touch Logic
      let isDragging = false, startX = 0;
      const container = document.querySelector('.image-ring-container');

      container.addEventListener("mousedown", e => { isDragging = true; startX = e.pageX; gsap.killTweensOf(ring); });
      window.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const deltaX = e.pageX - startX;
        currentRotation -= deltaX * 0.5;
        gsap.set(ring, { rotationY: currentRotation });
        updateBrightness(currentRotation);
        startX = e.pageX;
      });
      window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        const nearest = Math.round(currentRotation / angleStep);
        animateToRotation(nearest * angleStep);
      });
      container.addEventListener("touchstart", e => { isDragging = true; startX = e.touches[0].pageX; gsap.killTweensOf(ring); }, { passive: true });
      window.addEventListener("touchmove", e => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = e.touches[0].pageX - startX;
        currentRotation -= deltaX * 0.5;
        gsap.set(ring, { rotationY: currentRotation });
        updateBrightness(currentRotation);
        startX = e.touches[0].pageX;
      }, { passive: false });
      window.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;
        const nearest = Math.round(currentRotation / angleStep);
        animateToRotation(nearest * angleStep);
      });

      // Wheel/Scroll Logic
      container.addEventListener("wheel", e => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY || e.deltaX);
        const nearest = Math.round(currentRotation / angleStep);
        animateToRotation((nearest + delta) * angleStep);
      }, { passive: false });

      // Resize handler
      window.addEventListener("resize", () => {
        positionItems();
        updateBrightness(currentRotation);
      });

      // Initial setup
      positionItems();
      updateBrightness(0);

      // ✅ ADDED: Auto-rotation loop
      const autoRotate = gsap.to(ring, {
        rotationY: "-=360",
        duration: 40, // Slower duration for a smoother loop
        ease: "none",
        repeat: -1,
        onUpdate: () => updateBrightness(gsap.getProperty(ring, "rotationY"))
      });

      // Pause on hover so user can read
      container.addEventListener("mouseenter", () => autoRotate.timeScale(0.1)); // Slow down instead of a hard stop
      container.addEventListener("mouseleave", () => autoRotate.timeScale(1));
    }
});
