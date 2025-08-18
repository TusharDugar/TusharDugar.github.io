// Register GSAP plugins (REQUIRED for ScrollTrigger)
gsap.registerPlugin(ScrollTrigger);

// Function to update the glowing background elements positions
function glowEffect(event) {
    const glows = document.querySelectorAll('body::before, body::after');
    const x = event.clientX;
    const y = event.clientY;

    glows.forEach((glow, index) => {
        const moveX = (x / window.innerWidth - 0.5) * 60; 
        const moveY = (y / window.innerHeight - 0.5) * 60; 
        const rotate = (x / window.innerWidth - 0.5) * 10; 

        glow.style.transform = `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
    });
}

// Attach the glow effect to mouse movement (uncomment if you want this feature)
// document.addEventListener('mousemove', glowEffect); 

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
    // Note: .services-remaining-grid .service-item is specific for the 2D grid items
    ".reveal-item, .reveal-stagger, .about-heading-animation, .about-content-animation, .services-remaining-grid .service-item, .tool-card" 
  );

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: "0px",
    threshold: 0.1 // show when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible"); 

        // Specific stagger logic for .reveal-stagger-container (like footer buttons)
        if (entry.target.classList.contains("reveal-stagger-container")) {
          const children = entry.target.querySelectorAll(".reveal-stagger");
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.classList.add("visible"); 
          });
        }
        // Specific stagger logic for .about-content-wrapper (like paragraphs/blockquote)
        if (entry.target.classList.contains("about-content-wrapper")) {
            const children = entry.target.querySelectorAll(".about-content-animation");
            children.forEach((child, index) => {
                // CSS nth-child already handles stagger delay, but this ensures it's applied.
                child.classList.add("visible"); 
            });
        }
        // No explicit JS stagger needed for .services-remaining-grid .service-item or .tool-card, as CSS nth-child / their own transitions handle it.

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}


// GSAP Scroll Animations for Services Cube
function initServicesCubeAnimation() {
    const servicesSection = document.getElementById('services');
    const servicesCube = document.getElementById('servicesCube');
    const servicesScrollArea = document.querySelector('.services-scroll-trigger-area');
    const servicesMainTitle = document.querySelector('.services-main-title');

    // Check if all necessary elements exist before proceeding
    if (!servicesSection || !servicesCube || !servicesScrollArea || !servicesMainTitle) {
        console.warn("Required elements for services cube animation not found. Skipping GSAP services setup.");
        return;
    } else {
        console.log("All services cube elements found:", { servicesSection, servicesCube, servicesScrollArea, servicesMainTitle });
    }

    // Function to get current cube width based on screen size (for dynamic resizing)
    function getCubeWidth() {
        const width = window.innerWidth;
        if (width >= 1024) return 900;
        else if (width >= 768) return 640;
        else return 300;
    }

    // 1. Cube entry animation (GSAP FROM)
    // Cube starts invisible and slightly below, then animates to its visible state.
    gsap.from(servicesCube, {
        autoAlpha: 0, // Starts completely hidden (opacity: 0, visibility: 'hidden')
        y: 100, // Starts 100px below its final position
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: servicesSection, // Trigger when the services section is reached
            start: 'top center+=100', // When the top of services section hits 100px below center of viewport
            toggleActions: 'play none none reverse', // Play on scroll down, reverse on scroll up past trigger
            // markers: true, // Uncomment for debugging. Will show markers for this ScrollTrigger.
            onEnter: () => {
                console.log("Services Cube entry animation triggered (onEnter)!");
                servicesCube.style.width = `${getCubeWidth()}px`; // Ensure width is correct on entry
            },
            onLeaveBack: () => {
                console.log("Services Cube entry animation reversed - leaving back (onLeaveBack)!");
                gsap.to(servicesCube, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }); // Ensure it fully fades out if scrolling back up quickly
            },
            onComplete: () => {
                console.log("Services Cube entry animation completed!");
            }
        }
    });

    // 2. Cube rotation animation (GSAP TO)
    // This animation runs while the user scrolls through the `servicesScrollArea`.
    gsap.to(servicesCube, {
        rotateX: 270, // Rotate by 270 degrees (3 full faces + another 90 deg)
        ease: "none", // Linear rotation tied directly to scroll
        scrollTrigger: {
            trigger: servicesScrollArea, // Use the dedicated scroll area for the cube
            start: "top top", // When the top of the scroll area hits the top of the viewport
            end: "bottom bottom", // When the bottom of the scroll area leaves the bottom of the viewport
            scrub: true, // Smoothly link animation to scroll
            // markers: true, // Uncomment for debugging. Will show markers for this ScrollTrigger.
            onUpdate: self => {
                // Console log to check scrubbing action (uncomment locally)
                // console.log("Services Cube rotation scrubbing:", self.progress);
            },
            onLeave: () => {
                console.log("Services Cube rotation area left (onLeave)!");
                // Ensure the cube fades out after its main rotation scroll area is left
                gsap.to(servicesCube, {
                    y: -200, // Move up and out of view
                    autoAlpha: 0, // Fade out (opacity and visibility)
                    duration: 0.5,
                    ease: "power2.out",
                });
            },
            onEnterBack: () => {
                console.log("Services Cube rotation area entered back (onEnterBack)!");
                 // Animate back in when re-entering the scroll area from below
                 gsap.fromTo(servicesCube, {
                    y: -200, autoAlpha: 0, // Start from invisible, above
                }, {
                    y: 0, // Move to original position
                    autoAlpha: 1, // Fade in
                    duration: 0.5,
                    ease: "power2.out"
                });
            }
        },
    });

    // 3. Main Services title pinning and fade out (GSAP TO)
    gsap.to(servicesMainTitle, {
        autoAlpha: 0, // Fades out (opacity and visibility)
        ease: "power1.out",
        scrollTrigger: {
            trigger: servicesSection, // Trigger on the main services section
            start: "top top+=150", // Start fading when section top is 150px from viewport top
            end: "bottom top", // End fading when section bottom hits viewport top
            toggleActions: "play reverse play reverse",
            pin: true, // Pin the title during this animation
            scrub: true,
            pinSpacing: false // Prevent extra space from pinning
        }
    });

    // Handle cube width on resize dynamically
    function handleCubeResize() {
        if (servicesCube) {
            servicesCube.style.width = `${getCubeWidth()}px`;
        }
        // Refresh ScrollTrigger to recalculate positions after resize
        ScrollTrigger.refresh();
    }
    window.addEventListener('resize', handleCubeResize);
    // Initial call to set correct cube width and refresh on load
    handleCubeResize(); 
}


// Scroll Spy for section title (existing logic)
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for updating text

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    // Adjust offset based on desired trigger point for the scroll spy.
    const sectionTop = section.offsetTop - 150; // Change when section is 150px from viewport top
    
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
      current = section.getAttribute("id");
    }
  });

  if (current && navIndicator) {
    const formattedTitle = current
      .split('-') 
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
      .join(' '); 
      
    navIndicator.textContent = formattedTitle;
  } else if (navIndicator && current === "") {
      // If no specific section is in view (e.g., at the very top of the page), set a default title
      // Check if scroll is near the top and set 'HERO'
      if (window.scrollY < 200 && navIndicator.textContent !== "HERO") { 
          navIndicator.textContent = "HERO";
      }
  }
});


// Initialize all animations when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, 2D services, Tools)
    initIntersectionObserverAnimations(); 
    
    // Initialize GSAP-based Services Cube animation
    initServicesCubeAnimation();

    // After all animations are set up and elements might have changed size/position,
    // refresh ScrollTrigger to ensure all calculations are accurate.
    ScrollTrigger.refresh();
});
