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
                // Fallback for older browsers or if clipboard API fails
                const textarea = document.createElement('textarea');
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.classList.remove('copied');
                    }, 2000);
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
  // Mobile-specific threshold for earlier reveals if window is narrow
  const observerOptions = { 
    root: null, 
    rootMargin: "0px", 
    threshold: window.innerWidth < 1024 ? 0.05 : 0.1 // Adjust threshold for smaller screens
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // If reduced motion is preferred, just make it visible without animation and unobserve
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            return;
        }
        // Otherwise, apply animations
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

  document.querySelectorAll(".reveal-item, .reveal-parent, .reveal-stagger-container").forEach(el => {
    // Exclude services-heading from standard reveal-item check if it's already handled
    // The services-heading is made visible via gsap.set inside the matchMedia block
    if (el.closest('.services-heading')) {
      // For the services-heading, ensure it's immediately visible and static
      gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      if (el.matches('.services-heading')) { 
          gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      }
    } else {
      // For all other reveal elements:
      const rect = el.getBoundingClientRect();
      const isInitiallyVisible = (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
      );

      if (isInitiallyVisible) {
          if (el.classList.contains("reveal-item")) {
              gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-parent")) {
              gsap.set(el.querySelectorAll(".reveal-child"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          } else if (el.classList.contains("reveal-stagger-container")) {
              gsap.set(el.querySelectorAll(".reveal-stagger"), { opacity: 1, y: 0, x: 0, visibility: 'visible' });
          }
      } else {
          observer.observe(el);
      }
    }
  });
}

// Main execution block after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");

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

    // --- Services Section Premium Card Animations (No 3D cube) ---
    const servicesSection = document.getElementById('services');
    // Targeting '.face' elements which now act as individual service cards
    const serviceCards = servicesSection ? servicesSection.querySelectorAll('.face') : [];

    if (servicesSection && serviceCards.length > 0) {
      console.log("✅ Services card animations initializing...");

      // Initial state for animation (hidden below and scaled down)
      gsap.set(serviceCards, { opacity: 0, y: 60, scale: 0.9 });

      // Scroll-triggered reveal animation for cards
      gsap.fromTo(serviceCards, 
        { 
          opacity: 0, 
          y: 60, 
          scale: 0.9 
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.2, // Staggered entrance for each card
          scrollTrigger: {
            trigger: servicesSection,
            start: "top 80%", // Start animation when section is 80% in view
            end: "top 20%",   // End when section is 20% in view (adjust as needed)
            toggleActions: "play none none reverse", // Play on enter, reverse on leave back
            once: true // Ensures animation only plays once on scroll down
          }
        }
      );

      // Hover effects for premium feel
      serviceCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { 
            scale: 1.05, 
            boxShadow: "0 15px 40px rgba(156, 255, 51, 0.3)", // Glow/shadow effect
            duration: 0.4, 
            ease: "power2.out" 
          });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { 
            scale: 1, 
            boxShadow: "0 5px 20px rgba(0,0,0,0.2)", // Subtle default shadow (adjust if needed)
            duration: 0.4, 
            ease: "power2.inOut" 
          });
        });
      });
    } else {
        console.warn("Services section or service cards not found. Skipping services card animations.");
        // Ensure service cards are visible if JS animations are skipped
        if (serviceCards.length > 0) {
            gsap.set(serviceCards, { opacity: 1, y: 0, scale: 1, clearProps: 'all' });
        }
    }
    // End of Services Section Premium Card Animations (No 3D cube)

    window.addEventListener("resize", () => {
        ScrollTrigger.refresh(); 
    });

    // Fallback for elements that might not be handled by individual ScrollTriggers immediately
    // or to ensure visibility if JS fails or reduced motion is preferred but IO didn't catch them.
    setTimeout(() => {
        document.querySelectorAll('.reveal-item, .reveal-child, .reveal-stagger').forEach(el => {
            if (!el.classList.contains('visible') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.classList.add("visible");
            }
        });
    }, 2000); // Give IO some time, then ensure visibility
});
