/* =========================================================
   ANIMAITOR
   Site interactions
========================================================= */


const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");


/* -----------------------------------------
   Mobile navigation
----------------------------------------- */

if (mobileMenuButton && mobileMenu) {

    const setMobileMenuOpen = isOpen => {
        mobileMenu.classList.toggle("open", isOpen);
        mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
        mobileMenuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    };

    mobileMenuButton.addEventListener("click", () => {
        setMobileMenuOpen(!mobileMenu.classList.contains("open"));
    });


    mobileMenu
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener("click", () => {
                setMobileMenuOpen(false);
            });

        });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setMobileMenuOpen(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1000) setMobileMenuOpen(false);
    });

}


/* -----------------------------------------
   Header scroll effect
----------------------------------------- */

const header =
    document.querySelector(".site-header");


const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 30);
};


window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();


/* -----------------------------------------
   Reveal animations
----------------------------------------- */

const revealElements =
    document.querySelectorAll(
        ".section-header, .manifesto-inner, .feature-card, .workflow-step, .project-card, .architecture-copy, .vision-content, .cta-content, .footer-top"
    );


const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(element => element.classList.add("visible"));
} else {
    const observer =
        new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

    revealElements.forEach(element => {
        element.classList.add("reveal");
        observer.observe(element);
    });
}


/* -----------------------------------------
   Mouse movement for hero visual
----------------------------------------- */

const heroVisual =
    document.querySelector(".visual-window");


if (heroVisual && window.innerWidth > 1000 && !prefersReducedMotion) {

    document.addEventListener("mousemove", event => {

        const x =
            (event.clientX / window.innerWidth - 0.5);

        const y =
            (event.clientY / window.innerHeight - 0.5);


        heroVisual.style.transform = `
            perspective(1200px)
            rotateY(${x * -5 - 3}deg)
            rotateX(${y * 3 + 2}deg)
        `;

    });

}