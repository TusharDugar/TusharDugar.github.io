document.addEventListener("DOMContentLoaded", function () {
    gsap.registerPlugin(ScrollTrigger);

    function copyToClipboard(button) {
        const value = button.dataset.contact || '';
        if (value) {
            navigator.clipboard.writeText(value).then(() => {
                button.classList.add('copied');
                setTimeout(() => button.classList.remove('copied'), 2000);
            }).catch(err => console.error('Failed to copy: ', err));
        }
    }

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

    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(mouseFollowerGlow, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
        });
    }

    document.querySelectorAll('.contact-button').forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    initIntersectionObserverAnimations();

    function animateGridCards(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const cards = section.querySelectorAll('.face');
        if (cards.length > 0) {
            gsap.from(cards, {
                opacity: 0, y: 60, scale: 0.9, duration: 1, ease: "power3.out", stagger: 0.15,
                scrollTrigger: { trigger: section.querySelector('.services-card-grid'), start: "top 80%", once: true }
            });
            cards.forEach(card => {
                card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
                card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
            });
        }
    }
    animateGridCards('services');

    const ring = document.querySelector(".image-ring");
    const galleryItems = document.querySelectorAll(".gallery-item");

    if (ring && galleryItems.length > 0) {
        let currentRotation = 0;
        const total = galleryItems.length;
        const angleStep = 360 / total;

        function getRadius() { return 320; }

        function positionItems() {
            const radius = getRadius();
            galleryItems.forEach((item, i) => {
                const angle = i * angleStep;
                gsap.set(item, { rotationY: angle, z: radius, transformOrigin: `50% 50% ${-radius}px` });
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

        // ✅ CORRECTED: Rotation snapping logic
        function animateToRotation(targetRotation) {
            // Normalize the target to prevent over-rotation
            const normalizedTarget = ((targetRotation % 360) + 360) % 360;
            
            gsap.to(ring, {
                rotationY: targetRotation, // GSAP handles shortest path automatically
                duration: 0.8,
                ease: "power2.out",
                onUpdate: () => updateBrightness(gsap.getProperty(ring, "rotationY")),
                onComplete: () => { currentRotation = normalizedTarget; } // Set normalized value on complete
            });
        }

        let isDragging = false, startX = 0;
        const container = document.querySelector('.image-ring-container');

        const autoRotate = gsap.to(ring, {
            rotationY: "-=360",
            duration: 40,
            ease: "none",
            repeat: -1,
            onUpdate: () => updateBrightness(gsap.getProperty(ring, "rotationY"))
        });

        function onDragStart(e) { 
            isDragging = true; 
            startX = e.pageX || e.touches[0].pageX; 
            gsap.killTweensOf(ring);
            autoRotate.pause(); // Pause auto-rotation on drag
        }
        function onDragMove(e) {
            if (!isDragging) return;
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
            const nearest = Math.round(currentRotation / angleStep);
            animateToRotation(nearest * angleStep);
            autoRotate.play(); // Resume auto-rotation
        }
        
        container.addEventListener("mousedown", onDragStart);
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
        container.addEventListener("touchstart", onDragStart, { passive: true });
        window.addEventListener("touchmove", onDragMove, { passive: false });
        window.addEventListener("touchend", onDragEnd);
        
        container.addEventListener("wheel", e => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY || e.deltaX);
            const nearest = Math.round(currentRotation / angleStep);
            animateToRotation((nearest + delta) * angleStep);
        }, { passive: false });

        container.addEventListener("mouseenter", () => autoRotate.timeScale(0.1));
        container.addEventListener("mouseleave", () => autoRotate.timeScale(1));

        window.addEventListener("resize", () => { positionItems(); updateBrightness(currentRotation); });

        positionItems();
        updateBrightness(0);
    }
});
