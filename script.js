document.addEventListener("DOMContentLoaded", function () {
    gsap.registerPlugin(ScrollTrigger);

    // Function to copy text to clipboard for contact buttons
    function copyToClipboard(button) {
        const value = button.dataset.contact || '';
        if (value) {
            navigator.clipboard.writeText(value).then(() => {
                button.classList.add('copied');
                setTimeout(() => button.classList.remove('copied'), 2000);
            }).catch(err => console.error('Failed to copy text: ', err));
        }
    }

    // Unified Function to reveal elements on scroll
    function initIntersectionObserverAnimations() {
        const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    if (entry.target.classList.contains("reveal-stagger-container")) {
                        const children = entry.target.querySelectorAll(".reveal-stagger");
                        children.forEach((child, index) => {
                            setTimeout(() => child.classList.add("visible"), index * 150);
                        });
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        document.querySelectorAll(".reveal-item, .reveal-stagger-container").forEach(el => observer.observe(el));
    }

    // --- Main Initializations ---

    // Mouse Follower Glow
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(mouseFollowerGlow, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
        });
    }

    // Contact button functionality
    document.querySelectorAll('.contact-button').forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Reveal-on-scroll animations
    initIntersectionObserverAnimations();

    // Services Section Card Animations
    const serviceCards = document.querySelectorAll('#services .face');
    if (serviceCards.length > 0) {
        gsap.from(serviceCards, {
            opacity: 0, y: 50, duration: 0.8, ease: "power3.out", stagger: 0.1,
            scrollTrigger: { trigger: ".services-card-grid", start: "top 80%", once: true }
        });
        serviceCards.forEach(card => {
            card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
            card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
        });
    }

    // --- 3D Image Ring (Featured Websites) JS ---
    const ring = document.querySelector(".image-ring");
    const galleryItems = document.querySelectorAll(".gallery-item");

    if (ring && galleryItems.length > 0) {
        let currentRotation = 0;
        const total = galleryItems.length;
        const angleStep = 360 / total;
        const style = getComputedStyle(document.documentElement);

        function getRadius() {
            return parseFloat(style.getPropertyValue('--gallery-ring-radius'));
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

        function updateBrightness(ringRotation) {
            const dimmed = parseFloat(style.getPropertyValue('--gallery-dimmed-brightness')) || 0.5;
            const active = parseFloat(style.getPropertyValue('--gallery-active-brightness')) || 1.1;
            galleryItems.forEach((item) => {
                const initialAngle = parseFloat(item.dataset.initialRotation);
                const normalizedRingRotation = (ringRotation % 360 + 360) % 360;
                const effectiveAngle = (initialAngle - normalizedRingRotation + 360) % 360;
                let angleDiff = Math.abs(effectiveAngle);
                if (angleDiff > 180) angleDiff = 360 - angleDiff;
                const brightness = (angleDiff < 45) ? active : dimmed;
                gsap.to(item, { filter: `brightness(${brightness})`, duration: 0.5 });
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
            currentRotation -= deltaX * 0.5;
            gsap.set(ring, { rotationY: currentRotation });
            updateBrightness(currentRotation);
            startX = currentX;
        }
        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            const nearestIndex = Math.round(currentRotation / angleStep);
            animateToRotation(nearestIndex * angleStep);
        }

        ring.addEventListener("mousedown", onDragStart);
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
        ring.addEventListener("touchstart", onDragStart, { passive: true });
        window.addEventListener("touchmove", onDragMove, { passive: false });
        window.addEventListener("touchend", onDragEnd);

        let isScrolling = false;
        const galleryContainer = document.querySelector(".image-ring-container");
        if (galleryContainer) {
            galleryContainer.addEventListener("wheel", (e) => {
                e.preventDefault();
                if (isScrolling) return;
                isScrolling = true;
                const delta = Math.sign(e.deltaY || e.deltaX);
                const nearestIndex = Math.round(currentRotation / angleStep);
                const targetRotation = (nearestIndex + delta) * angleStep;
                animateToRotation(targetRotation);
                setTimeout(() => { isScrolling = false; }, 600); // Throttle scroll events
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

        // Initial setup
        positionItems();
        updateBrightness(0);
    }
});
