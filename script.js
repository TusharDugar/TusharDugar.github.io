document.addEventListener("DOMContentLoaded", function () {
    const carousel = document.getElementById("portfolio-carousel");
    const cards = document.querySelectorAll(".portfolio-card");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (!carousel || !cards.length) return;

    let currentRotation = 0;
    const totalCards = cards.length;
    const angleStep = 360 / totalCards;

    function getCarouselRadius() {
        return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--carousel-radius'));
    }

    // Position cards in a 3D ring using GSAP
    function arrangeCards() {
        const radius = getCarouselRadius();
        cards.forEach((card, index) => {
            const angle = index * angleStep;
            gsap.set(card, {
                rotationY: angle,
                z: radius,
                transformOrigin: `50% 50% ${-radius}px`,
            });
        });
    }

    // Animate the carousel to a new rotation angle
    function animateToRotation(targetRotation) {
        gsap.to(carousel, {
            rotationY: targetRotation,
            duration: 0.8,
            ease: "power2.out",
            onUpdate: () => {
                // You can add brightness/filter effects here if needed in the future
            },
            onComplete: () => {
                // Normalize rotation to prevent excessively large numbers
                currentRotation = targetRotation % 360;
            }
        });
    }

    // --- Navigation Functions ---
    function showNextCard() {
        const nearestIndex = Math.round(currentRotation / angleStep);
        const targetRotation = (nearestIndex + 1) * angleStep;
        animateToRotation(targetRotation);
    }

    function showPrevCard() {
        const nearestIndex = Math.round(currentRotation / angleStep);
        const targetRotation = (nearestIndex - 1) * angleStep;
        animateToRotation(targetRotation);
    }

    // --- Interaction Logic (Drag, Scroll, Keyboard) ---
    
    // Drag/Swipe Logic
    let isDragging = false, startX = 0;
    
    function onDragStart(e) {
        isDragging = true;
        startX = e.pageX || e.touches[0].pageX;
        gsap.killTweensOf(carousel); // Stop any ongoing animation
    }

    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const currentX = e.pageX || e.touches[0].pageX;
        const deltaX = currentX - startX;
        currentRotation -= deltaX * 0.5; // Drag sensitivity
        gsap.set(carousel, { rotationY: currentRotation });
        startX = currentX;
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        const nearestIndex = Math.round(currentRotation / angleStep);
        const targetRotation = nearestIndex * angleStep;
        animateToRotation(targetRotation); // Snap to the nearest card
    }

    // Keyboard Navigation
    function handleKeyDown(e) {
        if (e.key === "ArrowRight") showNextCard();
        if (e.key === "ArrowLeft") showPrevCard();
    }

    // --- Event Listeners and Initialization ---

    prevBtn.addEventListener("click", showPrevCard);
    nextBtn.addEventListener("click", showNextCard);
    
    carousel.addEventListener("mousedown", onDragStart);
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    
    carousel.addEventListener("touchstart", onDragStart, { passive: true });
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);

    document.addEventListener("keydown", handleKeyDown);

    // Resize handler
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(arrangeCards, 150);
    });

    // Initial setup
    arrangeCards();
});
