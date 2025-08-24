// GSAP library is no longer used for animations, its registration is removed.

// Function to copy text to clipboard for contact buttons
function copyToClipboard(button) {
    const valueElement = button.querySelector('.button-value');
    const value = valueElement ? valueElement.textContent : '';

    if (value) {
        navigator.clipboard.writeText(value)
            .then(() => {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 2000); // Reset after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
}

// Unified Function to reveal elements on scroll (for 2D animations)
function initIntersectionObserverAnimations() {
  const revealElements = document.querySelectorAll(
    // Select all elements that should animate using CSS transitions triggered by IntersectionObserver
    ".reveal-item, .reveal-stagger-container, .reveal-stagger" 
  );

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Handle stagger container
        if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.classList.add("visible"); 
          });
        }
        // Handle regular reveal items
        else if (entry.target.classList.contains("reveal-item") || 
                entry.target.classList.contains("reveal-stagger")) {
          entry.target.classList.add("visible"); 
        }

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}


// Scroll Spy for section title (REMOVED TEXT CHANGE LOGIC)
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for your name

window.addEventListener("scroll", () => {
  // This function now only exists to trigger other events if needed, 
  // but it no longer changes navIndicator.textContent.
  // The navIndicator will retain its original HTML text ("Tushar Dugar").
  
  let current = ""; // Still calculate 'current' section if you want to log it or use it for other non-text-changing purposes.
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150; 
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  // Removed all textContent assignments to navIndicator to keep name static.
});


// Mouse Follower Glow (implementation)
document.addEventListener('DOMContentLoaded', () => {
    const mouseFollowerGlow = document.querySelector('.mouse-follower-glow');
    if (mouseFollowerGlow) { // Ensure the element exists before attaching listener
        document.addEventListener('mousemove', (event) => {
            // Use translate3d for hardware acceleration, good for performance
            mouseFollowerGlow.style.transform = `translate(-50%, -50%) translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        });
    }

    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Tools, and other reveal-items)
    initIntersectionObserverAnimations(); 
    
    // Trigger a scroll event immediately to set the initial scroll spy title (though not visible now)
    window.dispatchEvent(new Event('scroll'));


    // --- NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
    const servicesSection = document.getElementById('services');
    const servicesWrapper = document.querySelector('.services-3d-carousel-wrapper');
    const servicesFaces = document.querySelectorAll('.services-carousel-face');
    const SERVICES_COUNT = servicesFaces.length;
    const ANIMATION_DURATION = 1200; // 1.2s as per prompt
    const ROTATE_INCREMENT = 90; // Degrees per transition step

    let currentIndex = 0;
    let currentRotation = 0; // Tracks the total rotation of the wrapper
    let isAnimating = false;
    let startY = 0; // For touch swipe
    let faceOffset = 0; // Will be calculated dynamically

    // Function to set initial 3D positions of all faces
    function setupFaces() {
        if (SERVICES_COUNT === 0) return;

        // Calculate faceOffset dynamically based on the height of a face
        // Ensure the faces have a defined height in CSS for this to work
        faceOffset = servicesFaces[0].offsetHeight / 2;

        servicesFaces.forEach((face, i) => {
            face.style.position = 'absolute';
            face.style.width = '100%';
            face.style.height = '100%';
            face.style.top = '0';
            face.style.left = '0';
            face.style.backfaceVisibility = 'hidden';

            // Initial positioning of faces relative to the wrapper's center
            // Face 0 is at 0deg (front), Face 1 at 90deg (bottom), Face 7 at -90deg (top) etc.
            // This transforms places them in a vertical stack around the wrapper's origin.
            const angle = i * ROTATE_INCREMENT; // Each face is rotated in increments
            face.style.transform = `rotateX(${angle}deg) translateZ(${faceOffset}px)`;
            face.style.opacity = 0; // All hidden initially
            face.style.visibility = 'hidden';
            // Disable default transition during setup to prevent flicker
            face.style.transition = 'none';
        });
        
        // Show the first face immediately without animation
        updateActiveFaceVisibility();
    }

    // Update which faces are visible and their base opacity/classes based on currentIndex
    function updateActiveFaceVisibility() {
        servicesFaces.forEach((face, i) => {
            face.classList.remove('is-active', 'is-next', 'is-prev');
            face.style.opacity = 0;
            face.style.visibility = 'hidden';
            face.style.transition = 'opacity 0.4s ease-out, visibility 0s 0.4s'; // Default transition for non-active

            // Determine if this face is the current, next, or previous for the 3D effect
            const offset = (i - currentIndex + SERVICES_COUNT) % SERVICES_COUNT; // Offset from current index

            if (offset === 0) { // Current face (front-facing)
                face.classList.add('is-active');
                face.style.opacity = 1;
                face.style.visibility = 'visible';
                face.style.transition = 'opacity 0.4s ease-in, transform 1.2s cubic-bezier(0.65, 0.05, 0.36, 1)';
            } else if (offset === 1) { // Next face (for scrolling down, initially below)
                face.classList.add('is-next');
                face.style.opacity = 0; // Start hidden
                face.style.visibility = 'visible';
                face.style.transition = 'opacity 0.4s ease-out, transform 1.2s cubic-bezier(0.65, 0.05, 0.36, 1)';
            } else if (offset === SERVICES_COUNT - 1) { // Previous face (for scrolling up, initially above)
                face.classList.add('is-prev');
                face.style.opacity = 0; // Start hidden
                face.style.visibility = 'visible';
                face.style.transition = 'opacity 0.4s ease-out, transform 1.2s cubic-bezier(0.65, 0.05, 0.36, 1)';
            }
            // All other faces remain hidden
        });
    }

    // Main animation function
    function animateServices(direction) {
        if (isAnimating) return;
        isAnimating = true;

        const outgoingFace = servicesFaces[currentIndex];
        const nextIndex = (currentIndex + direction + SERVICES_COUNT) % SERVICES_COUNT;
        const incomingFace = servicesFaces[nextIndex];

        // 1. Outgoing face starts fading immediately when rotation starts (0% to 40%)
        outgoingFace.style.opacity = 0;
        outgoingFace.style.transition = `opacity ${ANIMATION_DURATION * 0.4}ms ease-out, transform ${ANIMATION_DURATION}ms cubic-bezier(0.65, 0.05, 0.36, 1)`;

        // 2. Incoming face needs to be visible before it starts fading in (at 60%)
        incomingFace.style.visibility = 'visible';
        incomingFace.style.opacity = 0; // Ensure it's transparent before fading in
        incomingFace.style.transition = `opacity ${ANIMATION_DURATION * 0.4}ms ease-in ${ANIMATION_DURATION * 0.6}ms, transform ${ANIMATION_DURATION}ms cubic-bezier(0.65, 0.05, 0.36, 1)`; // Delay fade-in

        // 3. Apply the global wrapper rotation
        currentRotation -= direction * ROTATE_INCREMENT; // Decrement for scroll down, increment for scroll up
        servicesWrapper.style.transform = `rotateX(${currentRotation}deg)`;

        // 4. Incoming face begins fading in at 60% of the rotation, fully visible by 100%
        setTimeout(() => {
            incomingFace.style.opacity = 1;
        }, ANIMATION_DURATION * 0.6); // Start fade-in at 60% of total duration

        // After the full animation duration
        setTimeout(() => {
            currentIndex = nextIndex;
            updateActiveFaceVisibility(); // Re-apply classes and reset transitions for the new state

            // Ensure non-visible faces are correctly hidden and have no transform artifacts
            servicesFaces.forEach((face, i) => {
                const offset = (i - currentIndex + SERVICES_COUNT) % SERVICES_COUNT;
                if (offset !== 0 && offset !== 1 && offset !== SERVICES_COUNT - 1) {
                    face.style.visibility = 'hidden';
                    face.style.opacity = 0;
                    face.style.transition = 'none'; // Clear transition after use
                }
            });

            isAnimating = false;
        }, ANIMATION_DURATION);
    }

    // Scroll event handler for desktop
    let scrollTimeout;
    const handleScroll = (event) => {
        event.preventDefault(); // Prevent default scroll behavior
        if (isAnimating) return;

        // Clear any previous debounce timeout
        clearTimeout(scrollTimeout);

        // Set a new timeout to process the scroll after a short delay
        scrollTimeout = setTimeout(() => {
            const direction = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up
            animateServices(direction);
        }, 100); // Debounce time, adjust as needed
    };

    // Touch event handler for mobile swipe
    const handleTouchStart = (event) => {
        startY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
        if (isAnimating) return;

        const endY = event.changedTouches[0].clientY;
        const deltaY = endY - startY;

        if (Math.abs(deltaY) < 50) return; // Ignore small swipes

        const direction = deltaY < 0 ? 1 : -1; // 1 for swipe up (scroll down), -1 for swipe down (scroll up)
        animateServices(direction);
    };

    // Attach event listeners to the carousel container for scroll interaction
    if (servicesSection) {
        servicesSection.addEventListener('wheel', handleScroll, { passive: false });
        servicesSection.addEventListener('touchstart', handleTouchStart, { passive: true });
        servicesSection.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Initialize faces when the DOM is ready
    setupFaces();
    // --- END NEW 3D SERVICES CAROUSEL JAVASCRIPT ---
});
