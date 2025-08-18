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

// Unified Function to reveal elements on scroll (for 2D animations - About, Tools)
function initIntersectionObserverAnimations() {
  const revealElements = document.querySelectorAll(
    // Select elements that should animate using CSS transitions triggered by IntersectionObserver.
    // The .services-remaining-grid .service-item is now controlled by the master timeline in GSAP,
    // so it's removed from here.
    ".reveal-item, .reveal-stagger, .about-heading-animation, .about-content-animation, .tool-card" 
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
                child.classList.add("visible"); 
            });
        }

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}


// GSAP Master Timeline for Services Section (FIXED & REFACTORED)
function initServicesMasterAnimation() {
    const servicesSection = document.getElementById('services');
    const servicesCube = document.getElementById('servicesCube');
    const servicesScrollArea = document.querySelector('.services-scroll-trigger-area');
    const servicesMainTitle = document.querySelector('.services-main-title');
    const servicesRemainingGrid = document.querySelector('.services-remaining-grid');
    const remainingServiceItems = servicesRemainingGrid ? servicesRemainingGrid.querySelectorAll('.service-item') : [];

    // Check if all necessary elements exist before proceeding
    if (!servicesSection || !servicesCube || !servicesScrollArea || !servicesMainTitle) {
        console.warn("Required elements for services cube animation not found. Skipping GSAP services setup.");
        return;
    } else {
        console.log("All services elements found. Initializing master timeline.");
    }

    // Function to get current cube width based on screen size
    function getCubeWidth() {
        const width = window.innerWidth;
        if (width >= 1024) return 900;
        else if (width >= 768) return 640;
        else return 300;
    }

    // --- Master Timeline for Services Section ---
    // This single timeline will orchestrate all animations within the services section,
    // including the title, cube, and the remaining 2D grid items.
    const masterServicesTl = gsap.timeline({
        scrollTrigger: {
            trigger: servicesSection,
            start: "top top", // Pin the entire section from its top
            end: "bottom+=1000 top", // Extend scroll end to allow for all animations. Adjust this value!
            scrub: true,
            pin: true, // Pin the entire services section during its animation
            pinSpacing: true, // Keep original pinSpacing
            // markers: true, // Uncomment for debugging master timeline
            onUpdate: self => {
                // console.log("Master Timeline Progress:", self.progress);
            }
        }
    });

    // --- Phase 1: Title Fade and Cube Entry ---
    // This happens early in the scroll of the services section.
    masterServicesTl.to(servicesMainTitle, {
        autoAlpha: 0, // Fade out title
        ease: "power1.out",
        duration: 0.1 // Relatively quick fade
    }, 0); // Starts at the beginning of the master timeline

    masterServicesTl.fromTo(servicesCube, 
        { autoAlpha: 0, y: 100 }, // Initial state for cube
        { 
            autoAlpha: 1, 
            y: 0, 
            duration: 0.2, // Duration of cube entry
            ease: "power2.out",
            onStart: () => {
                servicesCube.style.width = `${getCubeWidth()}px`; // Set cube width on entry
                console.log("Cube entry part of master timeline triggered.");
            }
        }, 0.05); // Start cube entry slightly after title fade begins

    // --- Phase 2: Cube Rotation ---
    // This will be the main scrubbing animation of the cube.
    // The duration relative to the master timeline is key.
    masterServicesTl.to(servicesCube, {
        rotateX: 270, // Main rotation of the cube
        ease: "none", // Linear scrubbing
        duration: 0.5 // Adjust this duration to control cube rotation speed within master timeline
    }, 0.2); // Start cube rotation after initial entry, relative to master timeline

    // --- Phase 3: Cube Exit and Remaining Grid Entry ---
    // This happens after the cube finishes its main rotation.
    masterServicesTl.to(servicesCube, {
        autoAlpha: 0, 
        y: -200, 
        duration: 0.2, // Duration of cube exit
        ease: "power2.in",
        onComplete: () => {
            console.log("Cube exit part of master timeline completed.");
        }
    }, 0.7); // Start cube exit after main rotation is mostly done (0.2 + 0.5 = 0.7)

    // Animate in the remaining 4 services after the cube exits
    masterServicesTl.fromTo(remainingServiceItems, 
        { autoAlpha: 0, x: -80 }, // Initial state for 2D cards
        { 
            autoAlpha: 1, 
            x: 0, 
            duration: 0.5, // Duration for the group to animate
            ease: "power2.out",
            stagger: 0.1, // Stagger individual items
            onStart: () => {
                console.log("Remaining services grid animation triggered.");
            }
        }, 0.75); // Start 2D grid animation slightly after cube starts exiting


    // Handle cube width on resize dynamically
    function handleCubeResize() {
        if (servicesCube) {
            servicesCube.style.width = `${getCubeWidth()}px`;
        }
        // Refresh ScrollTrigger to recalculate positions after resize
        ScrollTrigger.refresh();
        console.log("ScrollTrigger refreshed on resize.");
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

    // Initialize IntersectionObserver-based animations (for About section, Tools, etc.)
    initIntersectionObserverAnimations(); 
    
    // Initialize GSAP-based Master Services Animation
    initServicesMasterAnimation();

    // After all animations are set up and elements might have changed size/position,
    // refresh ScrollTrigger to ensure all calculations are accurate.
    ScrollTrigger.refresh();
    console.log("Initial ScrollTrigger.refresh() on DOMContentLoaded.");
    
    // Trigger a scroll event immediately to set the initial scroll spy title
    window.dispatchEvent(new Event('scroll'));
});
