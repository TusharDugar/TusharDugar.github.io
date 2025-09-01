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
    if (el.closest('.services-heading')) {
      gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      if (el.matches('.services-heading')) { 
          gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
      }
    } 
    // NEW: Also exclude gallery-heading as it's a reveal-item
    else if (el.closest('.gallery-heading')) {
        gsap.set(el, { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
        if (el.matches('.gallery-heading')) { 
            gsap.set(el.querySelectorAll('span'), { opacity: 1, y: 0, x: 0, visibility: 'visible', clearProps: 'all' });
        }
    }
    else {
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
            boxShadow: "0 15px 40px var(--services-card-hover-glow)", // Use CSS variable for glow
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
    // End of Services Section Premium Card Animations

    /* ===== NEW: 3D Image Ring Vanilla JS ===== */
    const ring = document.querySelector(".image-ring");
    const ringImages = document.querySelectorAll(".ring-image");

    if (ring && ringImages.length > 0) {
      console.log("✅ 3D Image Ring vanilla JS initializing...");
      const total = ringImages.length;
      const angleStep = 360 / total;
      let currentRotation = 0;
      let isDragging = false;
      let startX = 0;
      let velocity = 0;
      let animationFrame;

      // Get CSS variables for dynamic sizing and effects
      const style = getComputedStyle(document.documentElement);
      let ringRadius = parseFloat(style.getPropertyValue('--gallery-ring-radius'));
      const activeRange = 20; // Angle from front where image is fully visible (degrees)
      const fadeRange = 90; // Angle from front where image starts to dim (degrees)
      const dimmedBrightness = parseFloat(style.getPropertyValue('--gallery-dimmed-brightness'));
      const activeBrightness = parseFloat(style.getPropertyValue('--gallery-active-brightness'));

      // Position each image in the 3D ring initially
      ringImages.forEach((imgWrapper, i) => {
        const img = imgWrapper.querySelector('img');
        const angle = i * angleStep;
        // FIX: Corrected transform to include translateZ for circular arrangement
        imgWrapper.style.transform = `rotateY(${angle}deg) translateZ(${ringRadius}px) translateX(-50%) translateY(-50%)`;
        imgWrapper.dataset.initialRotation = `${angle}`; // Store initial rotation for calculations
        img.style.filter = `brightness(${dimmedBrightness})`; // Initial dimming
      });

      function calculateBrightness(imageInitialAngle, currentRingRotation) {
        // Normalize ring rotation to 0-360 range
        const normalizedRingRotation = (currentRingRotation % 360 + 360) % 360;
        
        // Calculate the effective angle of the image relative to the front (0 degrees)
        const imageEffectiveAngle = (parseFloat(imageInitialAngle) + normalizedRingRotation) % 360;
        
        // Shortest angular distance to the "front" (0 or 360 degrees)
        let angleDiff = Math.abs(imageEffectiveAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        if (angleDiff < activeRange) {
          return activeBrightness;
        } else if (angleDiff < fadeRange) {
          const ratio = (fadeRange - angleDiff) / (fadeRange - activeRange);
          return dimmedBrightness + (activeBrightness - dimmedBrightness) * ratio;
        } else {
          return dimmedBrightness;
        }
      }

      function updateRotation(rot) {
        // FIX: Apply rotation to the main ring element
        ring.style.transform = `rotateY(${rot}deg)`; 
        
        // Update brightness based on position
        ringImages.forEach((imgWrapper) => {
          const img = imgWrapper.querySelector('img');
          const initialAngle = imgWrapper.dataset.initialRotation;
          if (initialAngle !== undefined) {
            const brightness = calculateBrightness(initialAngle, rot);
            img.style.filter = `brightness(${brightness})`;
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
          // Snap to nearest angle when inertia almost stops
          const nearestAngle = Math.round(currentRotation / angleStep) * angleStep;
          gsap.to(ring, {
            rotateY: nearestAngle,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                const currentRotY = parseFloat(gsap.getProperty(ring, "rotateY"));
                ringImages.forEach((imgWrapper) => {
                    const img = imgWrapper.querySelector('img');
                    const initialAngle = imgWrapper.dataset.initialRotation;
                    if (initialAngle !== undefined) {
                        const brightness = calculateBrightness(initialAngle, currentRotY);
                        img.style.filter = `brightness(${brightness})`;
                    }
                });
            },
            onComplete: () => {
                currentRotation = nearestAngle; // Update currentRotation to the snapped value
                velocity = 0; // Stop inertia
            }
          });
        }
      }

      ring.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        cancelAnimationFrame(animationFrame);
        velocity = 0; // Reset velocity on new drag
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        startX = e.clientX;
        currentRotation += deltaX * 0.5; // Sensitivity
        velocity = deltaX * 0.5;
        updateRotation(currentRotation);
      });

      window.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          animateInertia();
        }
      });

      // Touch support
      ring.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        cancelAnimationFrame(animationFrame);
        velocity = 0; // Reset velocity on new drag
      });

      window.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        startX = e.touches[0].clientX;
        currentRotation += deltaX * 0.5; // Sensitivity
        velocity = deltaX * 0.5;
        updateRotation(currentRotation);
      });

      window.addEventListener("touchend", () => {
        if (isDragging) {
          isDragging = false;
          animateInertia();
        }
      });

      // Initialize the position and brightness
      updateRotation(currentRotation);

      // Add a resize listener to re-calculate ringRadius and positions if it changes via media queries
      window.addEventListener('resize', () => {
          const newRingRadius = parseFloat(style.getPropertyValue('--gallery-ring-radius'));
          if (ringRadius !== newRingRadius) { // Only re-apply if it actually changed
              ringRadius = newRingRadius; // Update the JS variable
              ringImages.forEach((imgWrapper, i) => {
                  const angle = parseFloat(imgWrapper.dataset.initialRotation || '0');
                  // Reapply transform with new radius
                  imgWrapper.style.transform = `rotateY(${angle}deg) translateZ(${ringRadius}px) translateX(-50%) translateY(-50%)`;
              });
              // No need to update ring's initial transform here, updateRotation handles it
          }
      });

    } else {
        console.warn("3D Image Ring elements not found. Skipping vanilla JS setup.");
        // Ensure images are visible if JS is skipped or elements are missing
        ringImages.forEach(imgWrapper => {
            imgWrapper.style.transform = 'none'; // Clear any potential 3D transforms
            imgWrapper.style.opacity = '1';
            const img = imgWrapper.querySelector('img');
            if (img) img.style.filter = 'brightness(1)';
        });
    }
    // End NEW 3D Image Ring Vanilla JS

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
