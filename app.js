/**
 * Abdullah Khan — portfolio interactions
 */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Global spotlight tracker for relative mouse/touch position with lerping (liquid hover effects)
const activeSpotlights = new Map();

const updateSpotlightCoordinates = (clientX, clientY, target) => {
    if (!target) return;
    const currentHovered = new Set();
    let current = target;
    const selector = ".section-container, .hero-section, .skill-card-module, .btn, .chip, .metric-hud-box, .project-row-block, .specialization-toggle-bar, .back-to-top-btn, .nav-link, .footer-link-port, .logo-monogram-box, .logo-name, .header-brand-badge, .toggle-label, .hero-title, .project-title, .skill-card-name, .section-title";
    
    const updateTarget = (el) => {
        currentHovered.add(el);
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Calculate max diagonal length to ensure full color cover
        const diagonal = Math.sqrt(rect.width * rect.width + rect.height * rect.height);
        const maxRadius = Math.max(diagonal * 1.5, 120);
        
        if (!activeSpotlights.has(el)) {
            activeSpotlights.set(el, {
                currentX: x,
                currentY: y,
                targetX: x,
                targetY: y,
                currentRadius: 0,
                targetRadius: maxRadius,
                active: true,
                rect: rect
            });
        } else {
            const data = activeSpotlights.get(el);
            data.targetX = x;
            data.targetY = y;
            data.targetRadius = maxRadius;
            data.active = true;
            data.rect = rect;
        }
    };
    
    while (current && current !== document) {
        if (current.matches && current.matches(selector)) {
            updateTarget(current);
            
            // If the element is a container, update coordinates of child liquid text elements too
            if (current.matches(".project-row-block, .skill-card-module, .header-brand-badge")) {
                const children = current.querySelectorAll(".project-title, .skill-card-name, .logo-name");
                children.forEach(child => {
                    updateTarget(child);
                });
            }
        }
        current = current.parentNode;
    }
    
    // Mark all other spotlights as inactive so they can shrink back and chase the cursor coordinates
    for (const [el, data] of activeSpotlights.entries()) {
        if (!currentHovered.has(el)) {
            data.active = false;
            if (data.rect) {
                data.targetX = clientX - data.rect.left;
                data.targetY = clientY - data.rect.top;
            }
        }
    }
};

if (!prefersReducedMotion.matches) {
    document.addEventListener("mousemove", (event) => {
        updateSpotlightCoordinates(event.clientX, event.clientY, event.target);
    });
    requestAnimationFrame(animateSpotlights);
}

// Spotlight tracking is intentionally disabled for touch/mobile devices.
// On touch screens there is no persistent cursor, so the glow fires on tap
// and then lingers with no natural exit event — causing visible ghost blobs.
// The effect works exclusively with a pointing device (mouse / trackpad).


// Continuously update active spotlights in sync with screen refresh
function animateSpotlights() {
    const LERP_COORD_FACTOR = 0.06;  // smooth lag for coordinates (venom drift)
    
    for (const [el, data] of activeSpotlights.entries()) {
        let tx = data.targetX;
        let ty = data.targetY;
        let tr = data.active ? data.targetRadius : 0;
        
        // If inactive and radius has fully shrunk back to 0, clean up styles and map
        if (!data.active && data.currentRadius < 0.5) {
            el.style.removeProperty("--mouse-x");
            el.style.removeProperty("--mouse-y");
            el.style.removeProperty("--spotlight-radius");
            activeSpotlights.delete(el);
            continue;
        }
        
        // Lerp coordinates (even when inactive, keep tracking towards the last exit coordinates)
        data.currentX += (tx - data.currentX) * LERP_COORD_FACTOR;
        data.currentY += (ty - data.currentY) * LERP_COORD_FACTOR;
        
        // Lerp radius: viscous slower expansion on entry, cleaner snap-back on exit
        const radiusFactor = data.active ? 0.015 : 0.05;
        data.currentRadius += (tr - data.currentRadius) * radiusFactor;
        
        el.style.setProperty("--mouse-x", `${data.currentX}px`);
        el.style.setProperty("--mouse-y", `${data.currentY}px`);
        el.style.setProperty("--spotlight-radius", `${data.currentRadius}px`);
    }
    requestAnimationFrame(animateSpotlights);
}

function initFooterTime() {
    const timeEl = document.getElementById("footer-local-time");
    if (!timeEl) return;
    
    function updateTime() {
        const options = {
            timeZone: "Asia/Karachi",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        };
        const formatter = new Intl.DateTimeFormat([], options);
        timeEl.innerText = `${formatter.format(new Date())} PKT`;
    }
    
    updateTime();
    setInterval(updateTime, 60000);
}

/* ==========================================
   1. Text Scramble Decoder Effect
   ========================================== */
class TextScrambler {
    constructor(element) {
        this.el = element;
        this.chars = '!<>-_\\/[]{}—=+*^?#_0123456789∑∫λθΦΨΩαβγδε';
        this.update = this.update.bind(this);
    }
    
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            // Snappier scramble reveal speed: fast decodes with subtle variance
            const start = Math.floor(Math.random() * 8);
            const end = start + Math.floor(Math.random() * 12) + 10;
            this.queue.push({ from, to, start, end, char: '' });
        }
        cancelAnimationFrame(this.frameId);
        this.frame = 0;
        this.update();
        return promise;
    }
    
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (from === ' ' || to === ' ') {
                    output += ' ';
                } else {
                    // Update glyphs faster for a clear active flicker matrix reveal in shorter time
                    if (!char || Math.random() < 0.18) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="scramble-glyph" style="color: var(--accent-orange)">${char}</span>`;
                }
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameId = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Global registry of text scramblers to prevent collisions
const scramblerRegistry = new Map();

function getOrCreateScrambler(element) {
    if (!scramblerRegistry.has(element)) {
        scramblerRegistry.set(element, new TextScrambler(element));
    }
    return scramblerRegistry.get(element);
}

function initTextScramble() {
    document.querySelectorAll("[data-scramble]").forEach(el => {
        const text = el.innerText.trim();
        const scrambler = getOrCreateScrambler(el);
        scrambler.setText(text);
        
        el.addEventListener("mouseenter", () => {
            scrambler.setText(text);
        });
    });
}

/* ==========================================
   2. Dual-Mode Spacetime & Data Pipeline Canvas
   ========================================== */
let activeCanvasMode = "ai"; // "ai" (gravity warp) vs "infra" (data flow)
window.activeCanvasMode = "ai";

function initSynapticCanvas() {
    const canvas = document.getElementById("bg-canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let mouse = { x: -1000, y: -1000, active: false };
    let points = [];
    let time = 0;
    
    const spacing = 55; // Grid cell spacing
    const gravityDist = 220; // Radius of mouse gravity well
    
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });
    
    window.addEventListener("mouseleave", () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.active = true;
        }
    });

    window.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.active = true;
        }
    });

    window.addEventListener("touchend", () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });
    
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initGrid();
    });

    class GridPoint {
        constructor(col, row, baseX, baseY) {
            this.col = col;
            this.row = row;
            this.baseX = baseX;
            this.baseY = baseY;
            this.x = baseX;
            this.y = baseY;
            this.phase = Math.random() * Math.PI * 2;
            this.speed = 0.015 + Math.random() * 0.01;
            this.glow = 0;
        }

        update() {
            // Elastic breathing wobble (active in both states, made highly subtle)
            const breathingScale = activeCanvasMode === "ai" ? 1.5 : 1.0;
            const wobbleX = Math.sin(time * this.speed + this.phase) * breathingScale;
            const wobbleY = Math.cos(time * this.speed * 0.8 + this.phase) * breathingScale;

            // Scroll-linked ripple wave (ripples dynamically as user scrolls, made highly subtle)
            const scrollY = window.scrollY || 0;
            const scrollWobble = Math.sin(scrollY * 0.0035 + this.phase) * (activeCanvasMode === "ai" ? 1.2 : 0.8);

            let targetX = this.baseX + wobbleX;
            let targetY = this.baseY + wobbleY + scrollWobble;

            // Mouse/Touch gravity well repulsion physics (active in both states)
            if (mouse.active) {
                const dx = mouse.x - this.baseX;
                const dy = mouse.y - this.baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < gravityDist) {
                    const force = (gravityDist - dist) / gravityDist;
                    // Bends/indents the mesh gently under the cursor
                    const repelForce = activeCanvasMode === "ai" ? 12 : 8;
                    targetX -= (dx / (dist || 1)) * force * repelForce;
                    targetY -= (dy / (dist || 1)) * force * repelForce;
                    this.glow = force;
                } else {
                    this.glow += (0 - this.glow) * 0.08;
                }
            } else {
                this.glow += (0 - this.glow) * 0.08;
            }

            // Smooth spring integration for fluid elastic snapping
            this.x += (targetX - this.x) * 0.12;
            this.y += (targetY - this.y) * 0.12;
        }
    }

    let cols = 0;
    let rows = 0;

    function initGrid() {
        points = [];
        cols = Math.ceil(width / spacing) + 4;
        rows = Math.ceil(height / spacing) + 4;
        
        for (let c = 0; c < cols; c++) {
            points[c] = [];
            for (let r = 0; r < rows; r++) {
                const baseX = (c - 2) * spacing;
                const baseY = (r - 2) * spacing;
                points[c][r] = new GridPoint(c, r, baseX, baseY);
            }
        }
    }

    initGrid();

    function animate() {
        ctx.clearRect(0, 0, width, height);
        time++;

        // Update all mesh intersections
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                points[c][r].update();
            }
        }

        // Draw HUD Spotlight under mouse (AI mode: subtle orange glow, Infra mode: sharper coordinate glow)
        if (mouse.active) {
            const glowRadius = activeCanvasMode === "ai" ? 170 : 120;
            const glowOpacity = activeCanvasMode === "ai" ? 0.09 : 0.05;
            const radialGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius);
            radialGlow.addColorStop(0, `rgba(234, 88, 12, ${glowOpacity})`);
            radialGlow.addColorStop(1, "rgba(234, 88, 12, 0)");
            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Mesh lines
        ctx.lineWidth = 0.65;
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const pt = points[c][r];
                
                // Draw horizontal line segment
                if (c < cols - 1) {
                    const ptRight = points[c+1][r];
                    const distMouse = mouse.active ? Math.min(
                        Math.sqrt((mouse.x - pt.x)**2 + (mouse.y - pt.y)**2),
                        Math.sqrt((mouse.x - ptRight.x)**2 + (mouse.y - ptRight.y)**2)
                    ) : 9999;

                    let alpha = activeCanvasMode === "ai" ? 0.14 : 0.09;
                    let isGlowing = false;
                    let glowFactor = 0;
                    if (distMouse < gravityDist) {
                        glowFactor = (gravityDist - distMouse) / gravityDist;
                        alpha += glowFactor * (activeCanvasMode === "ai" ? 0.22 : 0.12);
                        isGlowing = true;
                    }
                    
                    if (isGlowing) {
                        ctx.save();
                        ctx.shadowBlur = glowFactor * 10;
                        ctx.shadowColor = `rgba(234, 88, 12, ${glowFactor * 0.45})`;
                        ctx.strokeStyle = `rgba(234, 88, 12, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(ptRight.x, ptRight.y);
                        ctx.stroke();
                        ctx.restore();
                    } else {
                        ctx.strokeStyle = `rgba(234, 88, 12, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(ptRight.x, ptRight.y);
                        ctx.stroke();
                    }
                }

                // Draw vertical line segment
                if (r < rows - 1) {
                    const ptDown = points[c][r+1];
                    const distMouse = mouse.active ? Math.min(
                        Math.sqrt((mouse.x - pt.x)**2 + (mouse.y - pt.y)**2),
                        Math.sqrt((mouse.x - ptDown.x)**2 + (mouse.y - ptDown.y)**2)
                    ) : 9999;

                    let alpha = activeCanvasMode === "ai" ? 0.14 : 0.09;
                    let isGlowing = false;
                    let glowFactor = 0;
                    if (distMouse < gravityDist) {
                        glowFactor = (gravityDist - distMouse) / gravityDist;
                        alpha += glowFactor * (activeCanvasMode === "ai" ? 0.22 : 0.12);
                        isGlowing = true;
                    }

                    if (isGlowing) {
                        ctx.save();
                        ctx.shadowBlur = glowFactor * 10;
                        ctx.shadowColor = `rgba(234, 88, 12, ${glowFactor * 0.45})`;
                        ctx.strokeStyle = `rgba(234, 88, 12, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(ptDown.x, ptDown.y);
                        ctx.stroke();
                        ctx.restore();
                    } else {
                        ctx.strokeStyle = `rgba(234, 88, 12, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(ptDown.x, ptDown.y);
                        ctx.stroke();
                    }
                }

                // Draw Intersection node dot
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 1.0 + pt.glow * 1.5, 0, Math.PI * 2);
                const dotAlpha = activeCanvasMode === "ai" ? (0.12 + pt.glow * 0.45) : (0.08 + pt.glow * 0.28);
                ctx.fillStyle = `rgba(234, 88, 12, ${dotAlpha})`;
                ctx.fill();
            }
        }

        // Draw Interactive Crosshair (active in both states, subtle styling variance)
        if (mouse.active) {
            ctx.save();
            const crosshairOpacity = activeCanvasMode === "ai" ? 0.14 : 0.08;
            ctx.strokeStyle = `rgba(234, 88, 12, ${crosshairOpacity})`;
            ctx.lineWidth = 0.6;
            ctx.setLineDash([4, 4]);

            // Vertical crosshair
            ctx.beginPath();
            ctx.moveTo(mouse.x, 0);
            ctx.lineTo(mouse.x, height);
            ctx.stroke();

            // Horizontal crosshair
            ctx.beginPath();
            ctx.moveTo(0, mouse.y);
            ctx.lineTo(width, mouse.y);
            ctx.stroke();
            ctx.restore();
        }

        // Data packets removed

        requestAnimationFrame(animate);
    }

    animate();

    // Export toggle method to global window context
    window.setCanvasMode = (mode) => {
        activeCanvasMode = mode;
    };
}

function initContactComposer() {
    const form = document.getElementById("contact-form");
    const contact = document.getElementById("contact-email");
    const status = document.getElementById("contact-status");
    document.getElementById("contact-composer").hidden = false;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const fields = new FormData(form);
        const subject = fields.get("subject").trim() || "Portfolio inquiry";
        const body = `${fields.get("message").trim()}\r\n\r\n${fields.get("name").trim()}\r\n${fields.get("email").trim()}`;
        status.textContent = "Send the draft from your email app. If it didn’t open, use the email link above.";
        window.location.href = `${contact.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
}

/* ==========================================
   6. Custom Interactive Cursor
   ========================================== */
function initCustomCursor() {
    const dot = document.getElementById("custom-cursor-dot");
    const ring = document.getElementById("custom-cursor-ring");
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let hasMoved = false;
    let isTouchDevice = false;

    // Linear interpolation factor (lerp)
    const lerpFactor = 0.15;

    // Start hidden, only display when actual pointer input is detected
    dot.style.opacity = "0";
    ring.style.opacity = "0";
    dot.style.display = "none";
    ring.style.display = "none";
    dot.style.transition = "opacity 0.25s ease";
    ring.style.transition = "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, border-color 0.25s ease, border-style 0.25s ease, opacity 0.25s ease";

    function activateCustomCursor(e) {
        if (isTouchDevice) return;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!hasMoved) {
            hasMoved = true;
            ringX = mouseX;
            ringY = mouseY;
            dot.style.display = "block";
            ring.style.display = "block";
            
            // Force a reflow for transition fade-in to register
            dot.offsetHeight;
            document.body.classList.add("has-custom-cursor");
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        }
        
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
    }

    // Capture standard pointer movements and filter touch input
    window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") {
            isTouchDevice = true;
            document.body.classList.remove("has-custom-cursor");
            dot.style.display = "none";
            ring.style.display = "none";
            return;
        }
        isTouchDevice = false;
        activateCustomCursor(e);
    });

    // Lerp loop for the ring position
    function updateRing() {
        if (hasMoved && !isTouchDevice) {
            ringX += (mouseX - ringX) * lerpFactor;
            ringY += (mouseY - ringY) * lerpFactor;
            ring.style.left = `${ringX}px`;
            ring.style.top = `${ringY}px`;
        }
        requestAnimationFrame(updateRing);
    }
    requestAnimationFrame(updateRing);

    document.addEventListener("mouseleave", () => {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
        if (hasMoved && !isTouchDevice) {
            dot.style.opacity = "1";
            ring.style.opacity = "1";
        }
    });

    // Bind hover states to interactive elements using dynamic delegation
    const hoverElements = "a, button, select, input, .specialization-toggle-bar, .toggle-label, .skill-card-module, .back-to-top-btn, .projects-toggle-pill, .projects-toggle-label";
    
    document.addEventListener("mouseover", (e) => {
        if (isTouchDevice) return;
        if (e.target.closest(hoverElements)) {
            document.body.classList.add("cursor-hover");
        }
    });

    document.addEventListener("mouseout", (e) => {
        if (isTouchDevice) return;
        if (e.target.closest(hoverElements)) {
            if (!e.relatedTarget || !e.relatedTarget.closest(hoverElements)) {
                document.body.classList.remove("cursor-hover");
            }
        }
    });
}

// Viewport Scroll Reveal System for Mobile & Desktop
function setupScrollReveals() {
    if (!("IntersectionObserver" in window)) return;

    const observerOptions = {
        root: null,
        rootMargin: "0px 0px -4% 0px", // eager trigger bounds
        threshold: 0.02 // triggers immediately when entering viewport
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active-reveal");
                observer.unobserve(entry.target); // only reveal once
            }
        });
    }, observerOptions);

    // Track targets: project cards, skill columns, contact box, footer sections, headers
    const selectors = ".project-row-block, .skills-grid-col, .contact-card-box, .footer-grid-cell, .hero-section > *, .section-title, .section-desc";
    document.querySelectorAll(selectors).forEach(el => {
        el.classList.add("reveal-element");
        revealObserver.observe(el);
    });
}

function initHeaderScroll() {
    const header = document.querySelector(".portfolio-header");
    if (!header) return;
    
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

}

/* ==========================================
   Mobile Hamburger Navigation
   ========================================== */
function initMobileNav() {
    const toggle = document.getElementById("mobile-nav-toggle");
    const menu = document.getElementById("mobile-nav-overlay");

    function setMenu(open) {
        toggle.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        menu.classList.toggle("open", open);
        menu.inert = !open;
    }

    toggle.addEventListener("click", () => setMenu(menu.inert));
    menu.querySelectorAll("[data-close-menu]").forEach(link => {
        link.addEventListener("click", () => {
            toggle.focus({ preventScroll: true });
            setMenu(false);
            const section = document.getElementById(link.hash.slice(1));
            section?.focus({ preventScroll: true });
        });
    });

    document.addEventListener("click", (event) => {
        if (!menu.inert && !menu.contains(event.target) && !toggle.contains(event.target)) {
            setMenu(false);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !menu.inert) {
            setMenu(false);
            toggle.focus();
        }
    });
}

function initProjectModal() {
    const modal = document.getElementById("project-detail-modal");
    const content = document.getElementById("project-detail-content");
    const card = modal.querySelector(".project-detail-card");

    document.querySelectorAll("[data-case-study]").forEach(button => {
        button.addEventListener("click", () => {
            const template = document.getElementById(`case-study-${button.dataset.caseStudy}`);
            content.replaceChildren(template.content.cloneNode(true));
            modal.showModal();
            card.scrollTop = 0;
            document.body.classList.add("case-study-open");
        });
    });

    document.getElementById("modal-close-btn").addEventListener("click", () => modal.close());
    modal.querySelector(".modal-backdrop-blur").addEventListener("click", () => modal.close());
    modal.addEventListener("close", () => document.body.classList.remove("case-study-open"));
}

initContactComposer();
initFooterTime();
initHeaderScroll();
initMobileNav();
initProjectModal();

if (!prefersReducedMotion.matches) {
    initTextScramble();
    initSynapticCanvas();
    initCustomCursor();
    setupScrollReveals();
}
