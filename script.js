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

    // GSAP Animations for Services and Gallery Cards
    function animateGridCards(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const cards = section.querySelectorAll('.face');
        if (cards.length > 0) {
            gsap.from(cards, {
                opacity: 0,
                y: 60,
                scale: 0.9,
                duration: 1,
                ease: "power3.out",
                stagger: 0.15,
                scrollTrigger: {
                    trigger: section.querySelector('.services-card-grid'),
                    start: "top 80%",
                    once: true
                }
            });

            cards.forEach(card => {
                card.addEventListener("mouseenter", () => gsap.to(card, { scale: 1.05, boxShadow: "0 15px 40px var(--services-card-hover-glow)", duration: 0.4, ease: "power2.out" }));
                card.addEventListener("mouseleave", () => gsap.to(card, { scale: 1, boxShadow: "0 5px 20px rgba(0,0,0,0.2)", duration: 0.4, ease: "power2.inOut" }));
            });
        }
    }

    // Animate both sections that use the .face card grid
    animateGridCards('services');
    animateGridCards('gallery');
});
