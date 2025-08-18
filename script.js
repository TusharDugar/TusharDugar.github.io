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


// Unified Function to reveal elements on scroll using IntersectionObserver
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(
    // Select elements that should animate using CSS transitions triggered by IntersectionObserver
    // .service-item is now controlled by the master services animation, so removed here.
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

        // Specific stagger logic for .profile-card-wrapper (about left content)
        if (entry.target.classList.contains("profile-card-wrapper")) {
            const children = entry.target.querySelectorAll(".reveal-child");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add("visible"); 
            });
        }
        // Specific stagger logic for .contact-buttons (footer buttons)
        else if (entry.target.classList.contains("contact-buttons")) {
            const children = entry.target.querySelectorAll(".contact-button");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add("visible"); 
            });
        }
        // Specific stagger for .about-content-wrapper (paragraphs/blockquote in about right)
        else if (entry.target.classList.contains("about-content-wrapper")) {
            const children = entry.target.querySelectorAll(".about-content-animation");
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.2}s`; 
                child.classList.add("visible"); 
            });
        }
        // No explicit JS stagger needed for .tool-card, as CSS transition and IO will handle it.

        observer.unobserve(entry.target); // Stop observing once revealed
      }
    });
  }, observerOptions);

  // Observe all elements selected, including containers for staggering
  revealElements.forEach(el => observer.observe(el));
  
  // Explicitly observe containers that manage staggered children, if not covered by a reveal-item itself
  const aboutWrapper = document.querySelector('.profile-card-wrapper');
  if (aboutWrapper) observer.observe(aboutWrapper);

  const footerButtonsContainer = document.querySelector('.contact-buttons');
  if (footerButtonsContainer) observer.observe(footerButtonsContainer);

  // Note: .services-items-container is NOT observed here; its animation is handled by GSAP
}


// GSAP Master Timeline for Services Section (REWRITTEN)
function initServicesMasterAnimation() {
    const servicesSection = document.getElementById('services');
    const servicesCube = document.getElementById('servicesCube');
    const servicesScrollArea = document.querySelector('.services-scroll-trigger-area');
    const servicesMainTitle = document.querySelector('.services-main-title');
    const servicesRemainingGrid = document.querySelector('.services-remaining-grid');
    const remainingServiceItems = servicesRemainingGrid ? servicesRemainingGrid.querySelectorAll('.service-item') : [];

    // Check if all necessary elements exist before proceeding
    if (!servicesSection || !servicesCube || !servicesScrollArea || !servicesMainTitle || !servicesRemainingGrid) {
        console.warn("Required elements for services master animation not found. Skipping GSAP setup.");
        return;
    } else {
        console.log("All services elements found. Initializing master timeline.");
    }

    // Function to get current cube width based on screen size (for dynamic resizing)
    function getCubeWidth() {
        const width = window.innerWidth;
        if (width >= 1024) return 900;
        else if (width >= 768) return 640;
        else return 300;
    }

    // --- GSAP Master Timeline for Services Section ---
    // This timeline orchestrates the entire Services section experience:
    // Title fade, Cube entry, Cube rotation, Cube exit, and Remaining 2D Services entry.
    const masterServicesTl = gsap.timeline({
        scrollTrigger: {
            trigger: servicesSection,
            start: "top top", // Pin the entire section from its top
            end: "bottom bottom-=200", // Extends past section end to allow all animations to play out. Adjust value as needed.
            scrub: true,
            pin: true, // Pin the entire services section during its animation
            pinSpacing: true,
            // markers: true, // Uncomment to see ScrollTrigger markers on screen for debugging
            onUpdate: self => {
                 // console.log("Master Services TL progress:", self.progress.toFixed(2));
            },
            onEnter: () => console.log("Master Services TL: entered"),
            onLeave: () => console.log("Master Services TL: left"),
            onEnterBack: () => console.log("Master Services TL: entered back"),
            onLeaveBack: () => console.log("Master Services TL: left back"),
        }
    });

    // Set initial state of the remaining grid to be hidden
    gsap.set(servicesRemainingGrid, { autoAlpha: 0 });

    // --- Phase 1: Title Fade and Cube Entry (happens early in the scroll) ---
    // Duration: 0.2 (relative to master timeline's total duration)
    masterServicesTl.to(servicesMainTitle, {
        autoAlpha: 0, // Fades out title
        ease: "power1.out",
        duration: 0.2 // Quick fade
    }, 0); // Start at the beginning of the master timeline

    // Cube entry: From invisible, slightly below, to visible at its position
    masterServicesTl.fromTo(servicesCube, 
        { autoAlpha: 0, y: 100 }, 
        { 
            autoAlpha: 1, 
            y: 0, 
            ease: "power2.out",
            duration: 0.3, // Duration of cube entry animation
            onStart: () => {
                servicesCube.style.width = `${getCubeWidth()}px`; // Set cube width on entry
                console.log("Cube entry animation starts.");
            }
        }, 0.1); // Start cube entry slightly after title fade begins

    // --- Phase 2: Cube Rotation (main scrubbing animation) ---
    // Duration: 0.5 (relative to master timeline's total duration)
    masterServicesTl.to(servicesCube, {
        rotateX: 270, // Main rotation of the cube
        ease: "none", // Linear scrubbing
        duration: 0.5 // Controls how long the rotation phase lasts relative to master TL
    }, 0.3); // Start cube rotation after its initial entry (0.1 + 0.2 = 0.3)

    // --- Phase 3: Cube Exit and Remaining Grid Entry ---
    // This happens after the cube finishes its main rotation.
    // Duration: 0.2 (relative to master timeline)
    masterServicesTl.to(servicesCube, {
        autoAlpha: 0, 
        y: -200, // Move up and out
        ease: "power2.in",
        duration: 0.2 // Duration of cube exit animation
    }, 0.8); // Start cube exit after main rotation is mostly done (0.3 + 0.5 = 0.8)

    // Animate in the remaining 4 services after the cube exits
    masterServicesTl.fromTo(remainingServiceItems, 
        { autoAlpha: 0, x: -80 }, // Initial state for 2D cards
        { 
            autoAlpha: 1, 
            x: 0, 
            ease: "power2.out",
            duration: 0.4, // Duration for the group of 2D cards to animate
            stagger: 0.1 // Stagger individual items within the group
        }, 0.9); // Start 2D grid animation slightly after cube starts exiting (0.8 + 0.1 = 0.9)


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


// Scroll Spy for section title
const sections = document.querySelectorAll("section[id], footer[id]"); 
const navIndicator = document.querySelector(".left-column-sticky h3"); // Target for updating text

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    // Adjust offset based on desired trigger point for the scroll spy.
    const sectionTop = section.offsetTop - 150; // Change when section is 150px from viewport top
    const sectionHeight = section.offsetHeight;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
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
      // If no specific section is in view, default to 'HERO' if near top
      if (window.scrollY < 200 && navIndicator.textContent !== "HERO") { 
          navIndicator.textContent = "HERO";
      }
  }
});


// Initialize all functionalities when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize contact button copy functionality
    const contactButtons = document.querySelectorAll('.contact-button');
    contactButtons.forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });

    // Initialize IntersectionObserver-based animations (for About section, Tools, etc.)
    // Note: The Services 2D cards are now handled by the GSAP master timeline.
    initScrollAnimations(); 
    
    // Initialize GSAP-based Master Services Animation
    initServicesMasterAnimation();

    // After all animations are set up and elements might have changed size/position,
    // refresh ScrollTrigger to ensure all calculations are accurate.
    ScrollTrigger.refresh();
    console.log("Initial ScrollTrigger.refresh() on DOMContentLoaded.");
    
    // Trigger a scroll event immediately to set the initial scroll spy title
    window.dispatchEvent(new Event('scroll'));
});
