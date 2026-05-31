/**
 * Abdullah Khan — AI Engineer Portfolio
 * Interactive Visual Effects & Morphing Controller (app.js)
 * Premium Cream-Orange & White Theme
 */

document.addEventListener("DOMContentLoaded", () => {
    initTextScramble();
    initCVDownload();
    initContactAPI();
    initSpecializationMorph();
    initCustomCursor();
    stabilizeLayoutHeights();
    initFooterTime();
    initHeaderScroll();
    setupScrollReveals();
    initMobileNav();
    initProjectModal();
});

// Re-stabilize layout heights once fonts are fully loaded
window.addEventListener("load", stabilizeLayoutHeights);
if (document.fonts) {
    document.fonts.ready.then(stabilizeLayoutHeights);
}

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

document.addEventListener("mousemove", (e) => {
    updateSpotlightCoordinates(e.clientX, e.clientY, e.target);
});

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
requestAnimationFrame(animateSpotlights);

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

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(stabilizeLayoutHeights, 100);
});

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
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
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

// Launch Canvas
initSynapticCanvas();


/* ==========================================
   3. Specialization Morphing Logic & Layout Stabilization
   ========================================== */
// Copy Content Mapping for both focus states
const morphData = {
    title: {
        ai: "I architect end-to-end LLM pipelines and fine-tuned ML engines.",
        infra: "I build intelligent on-device mobile apps and native AI integrations."
    },
    subtitle: {
        ai: "Hello, I'm Abdullah Khan. I design production-grade RAG pipelines, fine-tune open-source LLMs, and configure distributed vector databases like ChromaDB. Focused on robust server-side ML engineering.",
        infra: "Hello, I'm Abdullah Khan. I specialize in integrating TensorFlow Lite, MediaPipe, and local LLMs into responsive Flutter applications. Focused on bringing high-performance AI directly to the edge."
    },
    projectsTitle: {
        ai: "End-to-End ML Infrastructure",
        infra: "Featured Mobile AI Deployments"
    },
    projectsDesc: {
        ai: "High-performance server-side LLM systems, custom RAG search pipelines, and vector database orchestration shards.",
        infra: "A curated index of production-ready Flutter mobile applications running pose detection, local visual search, and smart agent runtimes."
    }
};

function measureRowHeight(row, mode) {
    const projectId = row.id.replace("project-", "");
    const titleEl = document.getElementById(`title-${projectId}`);
    const tagsEl = document.getElementById(`tags-${projectId}`);
    const descEl = document.getElementById(`desc-${projectId}`);
    
    const titleText = row.getAttribute(`data-${mode}-title`) || "";
    const tagsText = row.getAttribute(`data-${mode}-tags`) || "";
    const descText = row.getAttribute(`data-${mode}-desc`) || "";
    
    const originalTitle = titleEl ? titleEl.innerHTML : "";
    const originalTags = tagsEl ? tagsEl.innerHTML : "";
    const originalDesc = descEl ? descEl.innerHTML : "";
    
    if (titleEl) titleEl.innerText = titleText;
    if (tagsEl) tagsEl.innerText = tagsText;
    if (descEl) descEl.innerText = descText;
    
    const metricsAttr = row.getAttribute(`data-${mode}-metrics`);
    const metrics = metricsAttr ? JSON.parse(metricsAttr) : [];
    const originalMetrics = [];
    
    metrics.forEach((m, idx) => {
        const boxIdx = idx + 1;
        const prefixId = projectId === "agentic-flow" ? "af" : (projectId === "rag-search" ? "rs" : (projectId === "vigilai" ? "vi" : "oc"));
        const labelSpan = document.getElementById(`lbl-metric-${prefixId}-${boxIdx}`);
        const valueSpan = document.getElementById(`val-metric-${prefixId}-${boxIdx}`);
        if (labelSpan && valueSpan) {
            originalMetrics.push({
                labelEl: labelSpan,
                valueEl: valueSpan,
                originalLabel: labelSpan.innerHTML,
                originalValue: valueSpan.innerHTML,
                originalClass: valueSpan.className
            });
            labelSpan.innerText = m.label;
            valueSpan.innerText = m.val;
            valueSpan.className = `metric-value ${m.class}`;
        }
    });
    
    const height = row.clientHeight;
    
    // Restore original values
    if (titleEl) titleEl.innerHTML = originalTitle;
    if (tagsEl) tagsEl.innerHTML = originalTags;
    if (descEl) descEl.innerHTML = originalDesc;
    originalMetrics.forEach(om => {
        om.labelEl.innerHTML = om.originalLabel;
        om.valueEl.innerHTML = om.originalValue;
        om.valueEl.className = om.originalClass;
    });
    
    return height;
}

function stabilizeLayoutHeights() {
    const titleEl = document.getElementById("hero-title");
    const subEl = document.getElementById("hero-subtitle");
    const projectsTitleEl = document.getElementById("projects-title");
    const projectsDescEl = document.getElementById("projects-desc");

    // Add +8px safety margin to handle any wrap variations during transitions
    if (titleEl) {
        titleEl.style.minHeight = "";
        const h1 = measureHeight(titleEl, morphData.title.ai);
        const h2 = measureHeight(titleEl, morphData.title.infra);
        titleEl.style.minHeight = `${Math.max(h1, h2) + 8}px`;
    }
    if (subEl) {
        subEl.style.minHeight = "";
        const h1 = measureHeight(subEl, morphData.subtitle.ai);
        const h2 = measureHeight(subEl, morphData.subtitle.infra);
        subEl.style.minHeight = `${Math.max(h1, h2) + 8}px`;
    }
    if (projectsTitleEl) {
        projectsTitleEl.style.minHeight = "";
        const h1 = measureHeight(projectsTitleEl, morphData.projectsTitle.ai);
        const h2 = measureHeight(projectsTitleEl, morphData.projectsTitle.infra);
        projectsTitleEl.style.minHeight = `${Math.max(h1, h2) + 8}px`;
    }
    if (projectsDescEl) {
        projectsDescEl.style.minHeight = "";
        const h1 = measureHeight(projectsDescEl, morphData.projectsDesc.ai);
        const h2 = measureHeight(projectsDescEl, morphData.projectsDesc.infra);
        projectsDescEl.style.minHeight = `${Math.max(h1, h2) + 8}px`;
    }

    // Stabilize full project row blocks directly (handles internal tags & descriptions together)
    document.querySelectorAll(".project-row-block").forEach(row => {
        row.style.height = "";
        const h1 = measureRowHeight(row, "ai");
        const h2 = measureRowHeight(row, "infra");
        row.style.height = `${Math.max(h1, h2) + 6}px`;
    });
}

function measureHeight(el, text) {
    const originalHTML = el.innerHTML;
    el.innerText = text;
    const height = el.clientHeight;
    el.innerHTML = originalHTML;
    return height;
}

function initSpecializationMorph() {
    const toggleBar = document.getElementById("spec-toggle-bar");
    const sliderHandle = document.getElementById("spec-slider-handle");
    const labelAI = document.getElementById("label-ai");
    const labelInfra = document.getElementById("label-infra");
    const wrapper = document.getElementById("spec-toggle-bar");
    const pTogglePill = document.getElementById("projects-toggle-btn");
    const pLabelAI = document.getElementById("p-label-ai");
    const pLabelInfra = document.getElementById("p-label-infra");

    let currentSpecialization = "ai"; // default state

    function switchMode(newMode) {
        if (newMode === currentSpecialization) return;
        currentSpecialization = newMode;
        window.activeCanvasMode = newMode;

        // 1. Move slider knob visually
        if (wrapper && labelAI && labelInfra) {
            if (newMode === "infra") {
                wrapper.classList.add("infra-active");
                labelAI.classList.remove("active");
                labelInfra.classList.add("active");
            } else {
                wrapper.classList.remove("infra-active");
                labelAI.classList.add("active");
                labelInfra.classList.remove("active");
            }
        }

        // 2. Scramble primary text contents and brand name logo
        const titleEl = document.getElementById("hero-title");
        const subEl = document.getElementById("hero-subtitle");
        const projectsTitleEl = document.getElementById("projects-title");
        const projectsDescEl = document.getElementById("projects-desc");
        const logoNameEl = document.querySelector(".logo-name");

        if (titleEl) getOrCreateScrambler(titleEl).setText(morphData.title[newMode]);
        if (subEl) getOrCreateScrambler(subEl).setText(morphData.subtitle[newMode]);
        if (projectsTitleEl) getOrCreateScrambler(projectsTitleEl).setText(morphData.projectsTitle[newMode]);
        if (projectsDescEl) getOrCreateScrambler(projectsDescEl).setText(morphData.projectsDesc[newMode]);
        if (logoNameEl) getOrCreateScrambler(logoNameEl).setText("ABDULLAH.KHAN");

        // 3. Scramble Projects Metadata & Swap HUD metrics
        document.querySelectorAll(".project-row-block").forEach(row => {
            const projectId = row.id.replace("project-", "");
            const titleEl = document.getElementById(`title-${projectId}`);
            const tagsEl = document.getElementById(`tags-${projectId}`);
            const descEl = document.getElementById(`desc-${projectId}`);

            const newTitle = row.getAttribute(`data-${newMode}-title`);
            const newTags = row.getAttribute(`data-${newMode}-tags`);
            const newDesc = row.getAttribute(`data-${newMode}-desc`);

            if (titleEl) getOrCreateScrambler(titleEl).setText(newTitle);
            if (tagsEl) getOrCreateScrambler(tagsEl).setText(newTags);
            if (descEl) {
                // Fade desc text out, replace, and fade in for smooth visual transition
                descEl.style.opacity = 0;
                setTimeout(() => {
                    descEl.innerText = newDesc;
                    descEl.style.opacity = 1;
                }, 180);
            }

            // Swap HUD metrics boxes with scramble animation
            const metrics = JSON.parse(row.getAttribute(`data-${newMode}-metrics`));
            metrics.forEach((m, idx) => {
                const boxIdx = idx + 1;
                const prefixId = projectId === "agentic-flow" ? "af" : (projectId === "rag-search" ? "rs" : (projectId === "vigilai" ? "vi" : "oc"));
                const labelSpan = document.getElementById(`lbl-metric-${prefixId}-${boxIdx}`);
                const valueSpan = document.getElementById(`val-metric-${prefixId}-${boxIdx}`);

                if (labelSpan && valueSpan) {
                    getOrCreateScrambler(labelSpan).setText(m.label);
                    getOrCreateScrambler(valueSpan).setText(m.val);
                    
                    // Instantly apply the class name so the colors match the new value
                    valueSpan.className = `metric-value ${m.class}`;
                }
            });
        });

        // 4. Glow target columns in Skills Matrix grid (using classList to preserve scroll reveals)
        document.querySelectorAll(".skills-grid-col").forEach(col => {
            const colSpec = col.getAttribute("data-specialization");
            if (colSpec === "both" || colSpec === newMode) {
                col.classList.add("active-focus");
                col.classList.remove("inactive-focus");
            } else {
                col.classList.remove("active-focus");
                col.classList.add("inactive-focus");
            }
        });

        // 5. Update canvas graphics engine mode
        if (window.setCanvasMode) {
            window.setCanvasMode(newMode);
        }

        // Update projects section toggle pill state
        if (pTogglePill && pLabelAI && pLabelInfra) {
            if (newMode === "infra") {
                pTogglePill.classList.add("infra-active");
                pLabelAI.classList.remove("active");
                pLabelInfra.classList.add("active");
            } else {
                pTogglePill.classList.remove("infra-active");
                pLabelAI.classList.add("active");
                pLabelInfra.classList.remove("active");
            }
        }
    }

    // Set initial focus highlight state for ML Engineering skills (ai)
    document.querySelectorAll(".skills-grid-col").forEach(col => {
        const colSpec = col.getAttribute("data-specialization");
        if (colSpec === "ai" || colSpec === "both") {
            col.classList.add("active-focus");
        } else {
            col.classList.add("inactive-focus");
        }
    });

    // Wire up events
    if (toggleBar) {
        toggleBar.addEventListener("click", (e) => {
            const target = currentSpecialization === "ai" ? "infra" : "ai";
            switchMode(target);
        });
    }

    if (labelAI) {
        labelAI.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent bubble to toggleBar
            switchMode("ai");
        });
    }

    if (labelInfra) {
        labelInfra.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent bubble to toggleBar
            switchMode("infra");
        });
    }

    // Wire up the projects-context segmented toggle
    // The pill wraps two labels. We attach click handlers only to the labels
    // to avoid double-firing when a label is clicked (label click would also
    // bubble up to a pill-level handler and toggle back to the wrong state).
    if (pLabelAI) {
        pLabelAI.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent bubble to pill
            switchMode("ai");
            flashToggleBorder();
            pTogglePill && pTogglePill.blur();
        });
    }

    if (pLabelInfra) {
        pLabelInfra.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent bubble to pill
            switchMode("infra");
            flashToggleBorder();
            pTogglePill && pTogglePill.blur();
        });
    }

    // Clicking the pill itself (slider bar / gap between labels) still toggles
    if (pTogglePill) {
        pTogglePill.addEventListener("click", (e) => {
            // Only fire if the click was NOT on a label (labels stop propagation above)
            const target = currentSpecialization === "ai" ? "infra" : "ai";
            switchMode(target);
            flashToggleBorder();
            pTogglePill.blur();
        });
    }

    // Brief border flash on toggle — adds a class that animates in then fades out
    function flashToggleBorder() {
        if (!pTogglePill) return;
        pTogglePill.classList.remove("toggle-flash");
        // Force reflow so re-adding the class restarts the animation from frame 0
        void pTogglePill.offsetWidth;
        pTogglePill.classList.add("toggle-flash");
    }

    // Auto-remove the flash class once its animation finishes so the pill
    // is in a clean resting state before the next interaction
    if (pTogglePill) {
        pTogglePill.addEventListener("animationend", () => {
            pTogglePill.classList.remove("toggle-flash");
        });
    }
}


/* ==========================================
   4. Curriculum Vitae Simulator Dialog
   ========================================== */
function initCVDownload() {
    const downloadBtn = document.getElementById("btn-cv-download");
    const cvModal = document.getElementById("cv-modal");
    const confirmBtn = document.getElementById("btn-cv-confirm");
    const progressBarFill = document.getElementById("cv-download-progress");
    
    if (!downloadBtn || !cvModal || !progressBarFill || !confirmBtn) return;
    
    downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        cvModal.classList.add("active");
        progressBarFill.style.width = "0%";
        confirmBtn.classList.remove("enabled");
        confirmBtn.innerText = "Downloading...";
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                confirmBtn.classList.add("enabled");
                confirmBtn.innerText = "Close Dialog";
                
                triggerFileDownload();
            }
            progressBarFill.style.width = `${progress}%`;
        }, 60);
    });
    
    confirmBtn.addEventListener("click", () => {
        if (confirmBtn.classList.contains("enabled")) {
            cvModal.classList.remove("active");
        }
    });
    
    function triggerFileDownload() {
        const a = document.createElement("a");
        a.href = "./resume.pdf";
        a.download = "Muhammad_Abdullah_Khan_Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}


/* ==========================================
   5. Contact Form POST API Simulator with Tabs
   ========================================== */
function initContactAPI() {
    const form = document.getElementById("contact-form");
    const logOutput = document.getElementById("api-log-output");
    const statusLabel = document.getElementById("response-status");
    const submitBtn = document.getElementById("btn-send-message");
    
    if (!form || !submitBtn || !logOutput || !statusLabel) return;

    const terminalDot = submitBtn.querySelector(".btn-terminal-dot");

    // Custom dropdown components
    const selectContainer = document.querySelector(".custom-select-container");
    const selectTrigger = document.getElementById("select-recruiter-trigger");
    const selectOptions = document.querySelectorAll(".custom-select-option");
    const hiddenInput = document.getElementById("form-mode");

    if (selectContainer && selectTrigger && hiddenInput) {
        selectTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            selectContainer.classList.toggle("open");
        });

        selectOptions.forEach(option => {
            option.addEventListener("click", () => {
                const val = option.getAttribute("data-value");
                selectTrigger.innerText = val;
                hiddenInput.value = val;
                
                selectOptions.forEach(opt => opt.classList.remove("selected"));
                option.classList.add("selected");
                
                selectContainer.classList.remove("open");
            });
        });

        document.addEventListener("click", () => {
            selectContainer.classList.remove("open");
        });
    }
    
    submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        const name = document.getElementById("form-name").value.trim();
        const email = document.getElementById("form-email").value.trim();
        const subject = document.getElementById("form-subject").value.trim();
        const payload = document.getElementById("form-message").value.trim();
        const mode = hiddenInput ? hiddenInput.value : "true";
        
        logOutput.innerHTML = "";
        
        if (!name || !email || !payload) {
            statusLabel.innerText = "400 BAD_REQUEST";
            statusLabel.className = "http-status-label error";
            if (terminalDot) terminalDot.className = "btn-terminal-dot error";
            appendLine(">>> [ERROR] Request payload validation failed. 'name', 'email' and 'payload' properties must be populated.", "error");
            
            // Revert error state after 3 seconds
            setTimeout(() => {
                if (statusLabel.innerText === "400 BAD_REQUEST") {
                    statusLabel.innerText = "200 READY";
                    statusLabel.className = "http-status-label";
                    if (terminalDot) terminalDot.className = "btn-terminal-dot";
                }
            }, 3000);
            return;
        }
        
        statusLabel.innerText = "POSTING...";
        statusLabel.className = "http-status-label posting";
        if (terminalDot) terminalDot.className = "btn-terminal-dot posting";
        
        appendLine(`POST /v1/contact HTTP/1.1`, "info");
        appendLine(`Content-Type: application/json`, "muted");
        appendLine(`\n{`);
        appendLine(`  "name": "${name}",`);
        appendLine(`  "email": "${email}",`);
        appendLine(`  "subject": "${subject || 'None'}",`);
        appendLine(`  "payload": "${payload.substring(0, 45)}...",`);
        appendLine(`  "recruiter": ${mode}`);
        appendLine(`}`);
        
        fetch("https://formspree.io/kanpeki.dev@gmail.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                name: name,
                _replyto: email,
                email: email,
                subject: subject || "Portfolio Collaboration Opportunity",
                message: payload,
                recruiter: mode
            })
        })
        .then(response => {
            if (response.ok) {
                statusLabel.innerText = "201 CREATED";
                statusLabel.className = "http-status-label success";
                if (terminalDot) terminalDot.className = "btn-terminal-dot success";
                
                appendLine(`\n<<< HTTP/1.1 201 CREATED`, "success");
                appendLine(`Content-Type: application/json`, "muted");
                appendLine(`X-Inference-Time: 120ms`, "muted");
                appendLine(`\n{`);
                appendLine(`  "status": "delivered",`);
                appendLine(`  "recipient": "kanpeki.dev@gmail.com",`);
                appendLine(`  "info": "Submission routed. Check email for activation if first run."`);
                appendLine(`}`, "success");
                
                form.reset();
                if (hiddenInput && selectTrigger) {
                    hiddenInput.value = "true";
                    selectTrigger.innerText = "true";
                    selectOptions.forEach(opt => {
                        if (opt.getAttribute("data-value") === "true") {
                            opt.classList.add("selected");
                        } else {
                            opt.classList.remove("selected");
                        }
                    });
                }
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || "Formspree routing failed");
                });
            }
        })
        .catch(err => {
            statusLabel.innerText = "500 SERVER_ERROR";
            statusLabel.className = "http-status-label error";
            if (terminalDot) terminalDot.className = "btn-terminal-dot error";
            appendLine(`\n<<< HTTP/1.1 500 INTERNAL SERVER ERROR`, "error");
            appendLine(`Error: ${err.message}`, "error");
        })
        .finally(() => {
            // Revert state after 4 seconds
            setTimeout(() => {
                statusLabel.innerText = "200 READY";
                statusLabel.className = "http-status-label";
                if (terminalDot) terminalDot.className = "btn-terminal-dot";
            }, 4000);
        });
    });
    
    function appendLine(text, type = "") {
        const line = document.createElement("div");
        line.className = `line ${type}`;
        line.innerText = text;
        logOutput.appendChild(line);
        logOutput.scrollTop = logOutput.scrollHeight;
    }
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
    const selectors = ".project-row-block, .skills-grid-col, .contact-card-box, .footer-grid-cell, .hero-section > *, .section-tag, .section-title, .section-desc";
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

    const brandBadge = header.querySelector(".header-brand-badge");
    if (brandBadge) {
        brandBadge.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
}


/* ==========================================
   Mobile Hamburger Navigation
   ========================================== */
function initMobileNav() {
    const toggleBtn = document.getElementById("mobile-nav-toggle");
    const overlay   = document.getElementById("mobile-nav-overlay");
    if (!toggleBtn || !overlay) return;

    let isOpen = false;

    function openMenu() {
        isOpen = true;
        toggleBtn.classList.add("open");
        overlay.classList.add("open");
        toggleBtn.blur(); // drop focus immediately so :active doesn't linger
    }

    function closeMenu() {
        isOpen = false;
        toggleBtn.classList.remove("open");
        overlay.classList.remove("open");
        toggleBtn.blur();
    }

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen ? closeMenu() : openMenu();
    });

    // Close when any nav link inside the overlay is tapped
    overlay.querySelectorAll("[data-close-menu]").forEach(link => {
        link.addEventListener("click", () => closeMenu());
    });

    // Wire the mobile CV button to the same download modal as the desktop button
    const mobileCvBtn = document.getElementById("mobile-btn-cv-download");
    const desktopCvBtn = document.getElementById("btn-cv-download");
    if (mobileCvBtn && desktopCvBtn) {
        mobileCvBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeMenu();
            // Delegate to the desktop button click handler (which opens the modal)
            setTimeout(() => desktopCvBtn.click(), 200);
        });
    }

    // Close when tapping outside the overlay or the toggle button
    document.addEventListener("click", (e) => {
        if (isOpen && !overlay.contains(e.target) && !toggleBtn.contains(e.target)) {
            closeMenu();
        }
    });

    // Close on scroll (so it doesn't cover content while reading)
    window.addEventListener("scroll", () => {
        if (isOpen) closeMenu();
    }, { passive: true });
}

/* ==========================================================================
   7. Project Detailed Modal Controls & Interactive Playgrounds
   ========================================================================== */

let activePlaygroundIntervals = [];
let activePlaygroundListeners = [];

function clearPlaygroundIntervals() {
    activePlaygroundIntervals.forEach(clearInterval);
    activePlaygroundIntervals = [];
    activePlaygroundListeners.forEach(item => {
        if (item.element && item.event && item.callback) {
            item.element.removeEventListener(item.event, item.callback);
        }
    });
    activePlaygroundListeners = [];
}

function initProjectModal() {
    const modal = document.getElementById("project-detail-modal");
    const closeBtn = document.getElementById("modal-close-btn");
    const backdrop = modal ? modal.querySelector(".modal-backdrop-blur") : null;
    
    if (!modal || !closeBtn || !backdrop) return;

    // Attach click events to project cards
    document.querySelectorAll(".project-row-block").forEach(card => {
        card.addEventListener("click", () => {
            openProjectDetail(card.id);
        });
    });

    // Close handlers
    closeBtn.addEventListener("click", closeProjectDetail);
    backdrop.addEventListener("click", closeProjectDetail);
    
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            closeProjectDetail();
        }
    });
}

function closeProjectDetail() {
    const modal = document.getElementById("project-detail-modal");
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
    clearPlaygroundIntervals();
}

function openProjectDetail(projectId) {
    const modal = document.getElementById("project-detail-modal");
    const contentContainer = document.getElementById("project-detail-content");
    if (!modal || !contentContainer) return;

    // Check active mode from global canvas state or query selection
    const activeMode = window.activeCanvasMode || "ai"; 
    
    clearPlaygroundIntervals();
    
    // Generate content based on project and mode
    const content = getProjectContent(projectId, activeMode);
    contentContainer.innerHTML = content.html;
    
    // Open modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Freeze background scroll

    // Initialize interactive playground
    setTimeout(() => {
        content.initPlayground();
    }, 50);
}

// Print lines inside simulator terminals helper
function printSimLog(consoleEl, text, type = "") {
    if (!consoleEl) return;
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerText = text;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Luhn Algorithm validation check
function runLuhnCheck(cardStr) {
    const cleanStr = cardStr.replace(/\D/g, "");
    if (!cleanStr || cleanStr.length < 13) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanStr.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanStr.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10 === 0);
}

// Base64 regex detector
function detectBase64(str) {
    const base64Regex = /\b[A-Za-z0-9+/]{8,}={0,2}\b/g;
    const matches = str.match(base64Regex) || [];
    for (const match of matches) {
        try {
            // Basic length and padding validation before trying to decode
            if (match.length % 4 === 0) {
                const decoded = atob(match);
                if (decoded.trim().length > 3) {
                    return { encoded: match, decoded: decoded };
                }
            }
        } catch (e) {
            // Ignore decoding failures
        }
    }
    return null;
}

function getProjectContent(projectId, mode) {
    if (projectId === "project-vigilai") {
        if (mode === "ai") {
            // VigilAI Proxy (AI/ML)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">AI/ML Infrastructure</span>
                            <span>// PROJECT_03</span>
                        </div>
                        <h2 class="detail-project-title">VigilAI Proxy (ShieldGuard)</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Python</span>
                            <span class="detail-tech-badge">FastAPI</span>
                            <span class="detail-tech-badge">LiteLLM</span>
                            <span class="detail-tech-badge">SQLAlchemy</span>
                            <span class="detail-tech-badge">SQLite</span>
                        </div>
                        <p class="detail-project-desc">
                            An enterprise-grade LLM Security Layer and Observability Gateway designed to run as a transparent middleware proxy. Protects enterprise interfaces by filtering inbound inputs and sanitizing model completions in real-time.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Security Architecture</h3>
                                <div class="architecture-box">
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">1</div>
                                        <div class="flow-step-body"><strong>Pre-Routing Guardrails:</strong> Input string checks for PII leaks (Regex + Luhn checksum checks) and prompt injection blocks (keyword heuristics + recursive Base64 decoders).</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">2</div>
                                        <div class="flow-step-body"><strong>LiteLLM Upstream Router:</strong> Clean query variables are forwarded to target LLM configurations (OpenAI, Claude) or offline simulator fallbacks.</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">3</div>
                                        <div class="flow-step-body"><strong>Post-Routing Safety Classifiers:</strong> Model completions pass through shouting ratio indicators and repetition sequence loop monitors to prevent hallucination cycles.</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">4</div>
                                        <div class="flow-step-body"><strong>SQL Transaction Ledger:</strong> Telemetry metrics (latency, token costs, compliance exceptions) write to SQLAlchemy SQLite storage before returning.</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 class="detail-section-title">Core Guardrail Rules</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>PII Sanitizer:</strong> Intercepts Email, IP Address, SSN patterns, and credit cards (validated via Luhn validation check to reduce false positive flags). Configured to Block or Redact.</li>
                                    <li><strong>Prompt Injection Blocker:</strong> Catches overrides like "DAN mode active", "ignore previous instructions", and filters recursively through Base64 decoded segments.</li>
                                    <li><strong>Hallucination Loop Guard:</strong> Flags completions if a phrase of 4 words repeats consecutively 3 or more times, mitigating LLM repetition lockups.</li>
                                    <li><strong>Toxicity & Shouting Guard:</strong> Rejects completions where all-caps character ratios exceed 40% of words or contain explicit slurs.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Telemetry & System Specs</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Core Language:</span>
                                        <span class="spec-val">Python (FastAPI)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Average Latency:</span>
                                        <span class="spec-val spec-green">&lt; 15ms</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Injection Blocker:</span>
                                        <span class="spec-val">Heuristics & Base64</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">PII Validation:</span>
                                        <span class="spec-val">Luhn Algorithm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">Developer HUD Sandbox</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green" id="hud-light-input"></span>
                                        <span class="sandbox-light" id="hud-light-pii"></span>
                                        <span class="sandbox-light" id="hud-light-inject"></span>
                                        <span class="sandbox-light" id="hud-light-router"></span>
                                        <span class="sandbox-light" id="hud-light-output"></span>
                                    </div>
                                    <span class="sandbox-tab-name">VigilAI Playground</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Input a query payload below. Test SSNs (000-12-3456), credit cards (e.g. 4111-1111-1111-1111), injections, Base64 hacks, or repetition sequences.</p>
                                    <div class="sandbox-controls-row">
                                        <input type="text" id="sandbox-query-input" class="sandbox-input" placeholder="Type prompt payload..." value="Can you audit SSN 000-12-3456 and email user@domain.com?">
                                        <button id="sandbox-btn-run" class="sandbox-btn-run">❯ Execute Security Pipeline</button>
                                    </div>
                                    <div class="pipeline-visualizer">
                                        <div class="pipeline-node passed" id="node-stage-input">
                                            <div class="pipeline-node-icon">IN</div>
                                            <div class="pipeline-node-label">Input</div>
                                        </div>
                                        <div class="pipeline-connector"></div>
                                        <div class="pipeline-node" id="node-stage-pii">
                                            <div class="pipeline-node-icon">PII</div>
                                            <div class="pipeline-node-label">PII Scan</div>
                                        </div>
                                        <div class="pipeline-connector"></div>
                                        <div class="pipeline-node" id="node-stage-inject">
                                            <div class="pipeline-node-icon">INJ</div>
                                            <div class="pipeline-node-label">Injection</div>
                                        </div>
                                        <div class="pipeline-connector"></div>
                                        <div class="pipeline-node" id="node-stage-router">
                                            <div class="pipeline-node-icon">LLM</div>
                                            <div class="pipeline-node-label">Router</div>
                                        </div>
                                        <div class="pipeline-connector"></div>
                                        <div class="pipeline-node" id="node-stage-output">
                                            <div class="pipeline-node-icon">OUT</div>
                                            <div class="pipeline-node-label">Safety</div>
                                        </div>
                                    </div>
                                    <div class="sandbox-terminal" id="sandbox-terminal-logs">
                                        <div class="terminal-line">// Pipeline initialized. Input query to inspect active guardrails.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const inputEl = document.getElementById("sandbox-query-input");
                    const runBtn = document.getElementById("sandbox-btn-run");
                    const terminal = document.getElementById("sandbox-terminal-logs");
                    
                    const nodes = {
                        input: document.getElementById("node-stage-input"),
                        pii: document.getElementById("node-stage-pii"),
                        inject: document.getElementById("node-stage-inject"),
                        router: document.getElementById("node-stage-router"),
                        output: document.getElementById("node-stage-output")
                    };
                    const lights = {
                        pii: document.getElementById("hud-light-pii"),
                        inject: document.getElementById("hud-light-inject"),
                        router: document.getElementById("hud-light-router"),
                        output: document.getElementById("hud-light-output")
                    };

                    const handleScan = () => {
                        let query = inputEl.value.trim();
                        terminal.innerHTML = "";
                        
                        // Reset node states
                        Object.values(nodes).forEach(node => node.className = "pipeline-node");
                        Object.values(lights).forEach(l => l.className = "sandbox-light");
                        nodes.input.classList.add("passed");

                        if (!query) {
                            printSimLog(terminal, ">>> [ERROR] Empty query payload rejected.", "error");
                            return;
                        }

                        printSimLog(terminal, `>>> Receiving incoming payload connection: length ${query.length}`, "info");
                        printSimLog(terminal, `>>> Raw String: "${query}"`, "muted");

                        // 1. PII SCAN
                        setTimeout(() => {
                            printSimLog(terminal, "--- STAGE 1: INITIATING PRE-ROUTING PII SCAN ---", "info");
                            
                            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
                            const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
                            const cardRegex = /\b(?:\d[ -]?){13,16}\b/g;
                            const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

                            let hasPII = false;
                            let redactedQuery = query;

                            // Scan Emails
                            const emailsFound = query.match(emailRegex) || [];
                            if (emailsFound.length > 0) {
                                hasPII = true;
                                emailsFound.forEach(email => {
                                    redactedQuery = redactedQuery.replace(email, "[REDACTED_EMAIL]");
                                    printSimLog(terminal, `[MATCH] Sensitive Entity Detected: Email '${email}'`, "warning");
                                });
                            }

                            // Scan IP Addresses
                            const ipsFound = query.match(ipRegex) || [];
                            if (ipsFound.length > 0) {
                                hasPII = true;
                                ipsFound.forEach(ip => {
                                    redactedQuery = redactedQuery.replace(ip, "[REDACTED_IP]");
                                    printSimLog(terminal, `[MATCH] Sensitive Entity Detected: IP Address '${ip}'`, "warning");
                                });
                            }

                            // Scan SSN
                            const ssnsFound = query.match(ssnRegex) || [];
                            if (ssnsFound.length > 0) {
                                hasPII = true;
                                ssnsFound.forEach(ssn => {
                                    redactedQuery = redactedQuery.replace(ssn, "[REDACTED_SSN]");
                                    printSimLog(terminal, `[MATCH] Sensitive Entity Detected: SSN '${ssn}'`, "warning");
                                });
                            }

                            // Scan Credit Cards with Luhn Check
                            const cardsFound = query.match(cardRegex) || [];
                            if (cardsFound.length > 0) {
                                cardsFound.forEach(card => {
                                    const cleanCard = card.replace(/[-\s]/g, "");
                                    printSimLog(terminal, `[CC FOUND] Evaluating Luhn checksum for candidate pattern: '${card}'`, "muted");
                                    if (runLuhnCheck(cleanCard)) {
                                        hasPII = true;
                                        redactedQuery = redactedQuery.replace(card, "[REDACTED_CREDIT_CARD]");
                                        printSimLog(terminal, `[MATCH] Sensitive Entity Validated: Credit Card '${card}' (Luhn Checksum Passed)`, "warning");
                                    } else {
                                        printSimLog(terminal, `[FALSE POSITIVE] Luhn verification failed for CC pattern '${card}'. No action taken.`, "muted");
                                    }
                                });
                            }

                            if (hasPII) {
                                nodes.pii.className = "pipeline-node redacted";
                                lights.pii.className = "sandbox-light yellow";
                                printSimLog(terminal, `>>> PII scanner completed: Sanitized query created.`, "warning");
                                printSimLog(terminal, `>>> Sanitized Payload: "${redactedQuery}"`, "muted");
                            } else {
                                nodes.pii.className = "pipeline-node passed";
                                lights.pii.className = "sandbox-light green";
                                printSimLog(terminal, `>>> PII scanner completed: No sensitive entities validated.`, "success");
                            }

                            // 2. PROMPT INJECTION SCAN
                            setTimeout(() => {
                                printSimLog(terminal, "--- STAGE 2: INITIATING PROMPT INJECTION SCAN ---", "info");
                                
                                const injectionKeywords = [
                                    "ignore previous instructions", 
                                    "dan mode", 
                                    "developer mode active", 
                                    "bypass filter",
                                    "you must now leak"
                                ];
                                
                                let hasInjection = false;
                                let lowercaseQuery = redactedQuery.toLowerCase();
                                
                                // Direct Keyword Check
                                for (const keyword of injectionKeywords) {
                                    if (lowercaseQuery.includes(keyword)) {
                                        hasInjection = true;
                                        printSimLog(terminal, `[VIOLATION] Keyword Injection Detected: "${keyword}"`, "error");
                                        break;
                                    }
                                }

                                // Base64 segment decoding & recursive checking
                                const b64Segment = detectBase64(redactedQuery);
                                if (b64Segment) {
                                    printSimLog(terminal, `[BASE64 SCANNED] Decoding substring segment: '${b64Segment.encoded}'`, "muted");
                                    printSimLog(terminal, `[DECODED TEXT] Value: "${b64Segment.decoded.trim()}"`, "muted");
                                    const decodedLower = b64Segment.decoded.toLowerCase();
                                    
                                    for (const keyword of injectionKeywords) {
                                        if (decodedLower.includes(keyword)) {
                                            hasInjection = true;
                                            printSimLog(terminal, `[VIOLATION] Base64 Encoded Injection Decoded: "${keyword}"`, "error");
                                            break;
                                        }
                                    }
                                }

                                if (hasInjection) {
                                    nodes.inject.className = "pipeline-node failed";
                                    lights.inject.className = "sandbox-light red";
                                    printSimLog(terminal, ">>> [SHIELD GUARD EXCEPTION] Prompt injection attempt blocked. Terminal sequence exit code 403 Forbidden.", "error");
                                    return; // STOP execution
                                } else {
                                    nodes.inject.className = "pipeline-node passed";
                                    lights.inject.className = "sandbox-light green";
                                    printSimLog(terminal, ">>> Injection scan complete: Risk scores below threshold limits.", "success");
                                }

                                // 3. UPSTREAM ROUTER
                                setTimeout(() => {
                                    printSimLog(terminal, "--- STAGE 3: UPSTREAM ROUTING GATEWAY ---", "info");
                                    nodes.router.className = "pipeline-node passed";
                                    lights.router.className = "sandbox-light green";
                                    
                                    let mockCompletion = "Upstream inference result: Operation performed successfully. Logging server metrics.";
                                    
                                    // Generate specific response based on input
                                    if (redactedQuery.includes("[REDACTED_SSN]")) {
                                        mockCompletion = "Upstream LLM Core: SSN records verified. Account database status looks secure.";
                                    } else if (redactedQuery.includes("shout") || redactedQuery.includes("SHOUT")) {
                                        mockCompletion = "WARNING DETECTED. SHOUTING MODE COMMENCED. THIS OUTPUT CONTAINS AGGRESSIVE TONAL OVERTONES.";
                                    } else if (redactedQuery.includes("loop") || redactedQuery.includes("repeat")) {
                                        mockCompletion = "Repetition error error error error error error error loop.";
                                    }

                                    printSimLog(terminal, `>>> LiteLLM Router: Transmitting query to upstream OpenAI target.`, "info");
                                    printSimLog(terminal, `<<< Upstream output response payload received (Inference: 14ms).`, "muted");

                                    // 4. POST-ROUTING SAFETY
                                    setTimeout(() => {
                                        printSimLog(terminal, "--- STAGE 4: POST-ROUTING SAFETY CLASSIFIERS ---", "info");
                                        
                                        // Shouting Ratio check
                                        const totalWords = mockCompletion.split(/\s+/).length;
                                        const shoutingWords = mockCompletion.split(/\s+/).filter(w => w === w.toUpperCase() && w.length > 2).length;
                                        const shoutingRatio = shoutingWords / totalWords;

                                        printSimLog(terminal, `[STATS] Shouting ratio: ${(shoutingRatio*100).toFixed(1)}% of output words.`, "muted");
                                        if (shoutingRatio > 0.40) {
                                            nodes.output.className = "pipeline-node failed";
                                            lights.output.className = "sandbox-light red";
                                            printSimLog(terminal, ">>> [SHIELD GUARD EXCEPTION] aggressive 'shouting' content flagged. Blocking response.", "error");
                                            return;
                                        }

                                        // Repetition check (4 words repeating consecutively 3 or more times)
                                        const words = mockCompletion.toLowerCase().replace(/[.,!?;]/g, "").split(/\s+/);
                                        let hasRepetition = false;
                                        
                                        if (words.length >= 12) {
                                            for (let i = 0; i <= words.length - 12; i++) {
                                                const phrase = words.slice(i, i + 4).join(" ");
                                                const repeat1 = words.slice(i + 4, i + 8).join(" ");
                                                const repeat2 = words.slice(i + 8, i + 12).join(" ");
                                                if (phrase === repeat1 && phrase === repeat2) {
                                                    hasRepetition = true;
                                                    printSimLog(terminal, `[VIOLATION] Hallucination sequence loop flagged: "${phrase}"`, "error");
                                                    break;
                                                }
                                            }
                                        }

                                        if (hasRepetition) {
                                            nodes.output.className = "pipeline-node failed";
                                            lights.output.className = "sandbox-light red";
                                            printSimLog(terminal, ">>> [SHIELD GUARD EXCEPTION] Hallucination loop guard triggered. Connection closed.", "error");
                                            return;
                                        }

                                        nodes.output.className = "pipeline-node passed";
                                        lights.output.className = "sandbox-light green";
                                        printSimLog(terminal, ">>> Safety checks passed: Completion output secure.", "success");

                                        // 5. TRANSACTION LOG LEDGER
                                        setTimeout(() => {
                                            printSimLog(terminal, "--- STAGE 5: SQL TRANSACTION LEDGER WRITING ---", "info");
                                            printSimLog(terminal, `[SQL] INSERT INTO transactions (latency, total_tokens, violated_policies) VALUES (14, 182, 0);`, "muted");
                                            printSimLog(terminal, ">>> SQLite Ledger commit complete. Secure response returned to client.", "success");
                                            printSimLog(terminal, `\nFinal Completion: "${mockCompletion}"`, "success");
                                        }, 180);

                                    }, 180);

                                }, 180);

                            }, 180);

                        }, 180);
                    };

                    runBtn.addEventListener("click", handleScan);
                    activePlaygroundListeners.push({ element: runBtn, event: "click", callback: handleScan });
                    
                    // Run default scan on opening
                    handleScan();
                }
            };
        } else {
            // VigilAI SDK (Mobile/Infra)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">AI Mobile Application focus</span>
                            <span>// PROJECT_03</span>
                        </div>
                        <h2 class="detail-project-title">VigilAI Client SDK</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Flutter</span>
                            <span class="detail-tech-badge">Dart</span>
                            <span class="detail-tech-badge">SQLite</span>
                            <span class="detail-tech-badge">Cryptography</span>
                            <span class="detail-tech-badge">Android/iOS</span>
                        </div>
                        <p class="detail-project-desc">
                            A lightweight, production-ready Flutter client SDK that integrates with the VigilAI ShieldGuard gateway. Pre-filters input inputs locally, acts as a thread-safe offline cache, and locks credentials behind secure biometrics.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Client-Side Integration</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>Local PII Sanitizer:</strong> Reduces cloud gateway traffic by stripping basic Email and Phone number patterns locally before shipping API payloads.</li>
                                    <li><strong>Offline Logging Buffer:</strong> Stores client-side telemetry in an encrypted sqlite database during connection outages, auto-synchronizing records when network recovers.</li>
                                    <li><strong>Failover Gateways:</strong> Features thread-safe failover configurations that auto-reroute requests to fallback LLM targets if primary proxy is unreachable.</li>
                                    <li><strong>Biometric Lockups:</strong> Wraps local credentials and key variables inside hardware keystores gatekept by Face ID / Touch ID locks.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Telemetry & Client Specs</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Framework:</span>
                                        <span class="spec-val">Dart (Flutter SDK)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Offline Database:</span>
                                        <span class="spec-val">Encrypted SQLite</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Device Credential:</span>
                                        <span class="spec-val spec-green">Biometric Keystore</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Sync Protocol:</span>
                                        <span class="spec-val">Unidirectional REST</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">VigilAI Client SDK Telemetry</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green" id="sdk-light-net"></span>
                                        <span class="sandbox-light" id="sdk-light-lock"></span>
                                    </div>
                                    <span class="sandbox-tab-name">VigilAI Mobile SDK console</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Click buttons to simulate on-device SDK operations, database buffers, or connection failures.</p>
                                    <div class="sandbox-controls-row" style="flex-direction: row; flex-wrap: wrap; gap: 8px;">
                                        <button id="sdk-btn-call" class="sandbox-btn-run" style="flex: 1; min-width: 110px;">Dispatch API Call</button>
                                        <button id="sdk-btn-offline" class="sandbox-btn-run" style="flex: 1; min-width: 110px; background-color: var(--accent-orange);">Toggle Connection</button>
                                        <button id="sdk-btn-lock" class="sandbox-btn-run" style="flex: 1; min-width: 110px; background-color: var(--text-disabled);">Test Secure Lock</button>
                                    </div>
                                    <div class="sandbox-terminal" id="sdk-terminal-logs">
                                        <div class="terminal-line">// SDK client initialized. Logs streaming active.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const btnCall = document.getElementById("sdk-btn-call");
                    const btnOffline = document.getElementById("sdk-btn-offline");
                    const btnLock = document.getElementById("sdk-btn-lock");
                    const terminal = document.getElementById("sdk-terminal-logs");
                    const lightNet = document.getElementById("sdk-light-net");
                    const lightLock = document.getElementById("sdk-light-lock");

                    let networkOnline = true;
                    let keystoreLocked = false;
                    let localLogsBuffer = 0;

                    const handleCall = () => {
                        printSimLog(terminal, "--- SDK API DISPATCH TRIGGERED ---", "info");
                        
                        if (keystoreLocked) {
                            printSimLog(terminal, ">>> [BLOCKED] Secure local Keystore locked. Authenticate biometric prompts first.", "error");
                            return;
                        }

                        // Local sanitization check
                        printSimLog(terminal, ">>> Sanitizing local inputs: regex check...", "muted");
                        printSimLog(terminal, ">>> Input clear. No plain-text phone credentials detected.", "success");

                        if (!networkOnline) {
                            localLogsBuffer++;
                            printSimLog(terminal, `>>> [OFFLINE] Network unreachable. Buffering transaction record locally in encrypted SQLite. (Buffer size: ${localLogsBuffer} entries)`, "warning");
                            return;
                        }

                        printSimLog(terminal, ">>> Shipping API request bundle to https://gateway.vigilai.dev/v1/chat", "muted");
                        printSimLog(terminal, "<<< 200 SECURE payload received from gateway. Sync Latency: 18ms.", "success");
                    };

                    const handleOfflineToggle = () => {
                        networkOnline = !networkOnline;
                        if (networkOnline) {
                            lightNet.className = "sandbox-light green";
                            printSimLog(terminal, ">>> SDK Network Status: ONLINE. Restoring tunnel connections.", "success");
                            if (localLogsBuffer > 0) {
                                printSimLog(terminal, `>>> [SYNC] Uploading ${localLogsBuffer} buffered transaction logs to gateway storage...`, "info");
                                setTimeout(() => {
                                    printSimLog(terminal, `>>> SQLite buffer cleared successfully. Sync complete.`, "success");
                                    localLogsBuffer = 0;
                                }, 800);
                            }
                        } else {
                            lightNet.className = "sandbox-light red";
                            printSimLog(terminal, ">>> SDK Network Status: OFFLINE. Fallback offline SQLite ledger active.", "warning");
                        }
                    };

                    const handleLockToggle = () => {
                        keystoreLocked = !keystoreLocked;
                        if (keystoreLocked) {
                            lightLock.className = "sandbox-light red";
                            btnLock.innerText = "Unlock Keystore";
                            printSimLog(terminal, ">>> SDK Secure Storage: LOCKED. Local encryption keys encrypted behind hardware biometric locks.", "warning");
                        } else {
                            lightLock.className = "sandbox-light";
                            btnLock.innerText = "Lock Keystore";
                            printSimLog(terminal, ">>> SDK Secure Storage: UNLOCKED. Authenticating device keychain credentials (FaceID verified).", "success");
                        }
                    };

                    btnCall.addEventListener("click", handleCall);
                    btnOffline.addEventListener("click", handleOfflineToggle);
                    btnLock.addEventListener("click", handleLockToggle);

                    activePlaygroundListeners.push(
                        { element: btnCall, event: "click", callback: handleCall },
                        { element: btnOffline, event: "click", callback: handleOfflineToggle },
                        { element: btnLock, event: "click", callback: handleLockToggle }
                    );
                }
            };
        }
    } else if (projectId === "project-agentic-flow") {
        if (mode === "ai") {
            // OMNIVLA (AI/ML)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">AI/ML Systems Focus</span>
                            <span>// PROJECT_01</span>
                        </div>
                        <h2 class="detail-project-title">OMNIVLA GUI Agent</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Python</span>
                            <span class="detail-tech-badge">PyTorch</span>
                            <span class="detail-tech-badge">LoRA</span>
                            <span class="detail-tech-badge">ChromaDB</span>
                        </div>
                        <p class="detail-project-desc">
                            A hardware-constrained autonomous GUI agent optimized using KV cache quantization pipelines to run natively within &lt;6GB VRAM configurations. Fine-tuned for pixel grounding and visual actions.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Model Specifications</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>KV Cache Quantization:</strong> Implements 4-bit KV Cache quantization techniques to reduce activation footprints, allowing long sequence lengths on small memory cards.</li>
                                    <li><strong>Set-of-Mark Grounding:</strong> Fine-tuned layout parser translates screen coordinate inputs into numbered tags, enabling the LLM to select coordinates precisely.</li>
                                    <li><strong>ChromaDB Episodic Buffer:</strong> Stores visual execution paths inside vector space embeddings to retrieve historical solutions during repetitive screen tasks.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Inference & Vector Specs</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">GPU Environment:</span>
                                        <span class="spec-val">Ubuntu / CUDA C</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Memory Cap:</span>
                                        <span class="spec-val spec-green">&lt; 5.8 GB VRAM</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Cache Pipeline:</span>
                                        <span class="spec-val">4-bit KV cache</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Episodic Store:</span>
                                        <span class="spec-val">ChromaDB RAG</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">Coordinate Grounding Screen</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green"></span>
                                    </div>
                                    <span class="sandbox-tab-name">Grounding HUD View</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Hover over screen elements to trigger coordinate predictions from the Set-of-Mark grounding model.</p>
                                    <div class="grounding-screen-box">
                                        <div class="grounding-screen-bg"></div>
                                        <div class="grounding-so-mark" style="top: 20px; left: 20px; width: 140px; height: 32px;" data-id="0">
                                            <span class="grounding-so-tag">[0] Search Bar</span>
                                        </div>
                                        <div class="grounding-so-mark" style="top: 80px; left: 20px; width: 80px; height: 32px;" data-id="1">
                                            <span class="grounding-so-tag">[1] Login Btn</span>
                                        </div>
                                        <div class="grounding-so-mark" style="top: 80px; left: 120px; width: 180px; height: 90px;" data-id="2">
                                            <span class="grounding-so-tag">[2] Data Card Grid</span>
                                        </div>
                                    </div>
                                    <div class="sandbox-terminal" id="grounding-terminal-logs" style="min-height: 100px;">
                                        <div class="terminal-line">// Grounding visual matrix ready. Hover elements above.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const terminal = document.getElementById("grounding-terminal-logs");
                    const marks = document.querySelectorAll(".grounding-so-mark");
                    
                    const hoverCoords = {
                        "0": "[x: 0.15, y: 0.08, w: 0.42, h: 0.10]",
                        "1": "[x: 0.12, y: 0.28, w: 0.22, h: 0.10]",
                        "2": "[x: 0.38, y: 0.42, w: 0.54, h: 0.36]"
                    };

                    marks.forEach(mark => {
                        const idx = mark.getAttribute("data-id");
                        const handleMouseEnter = () => {
                            printSimLog(terminal, `OMNIVLA Predictor: Set-of-Mark [${idx}] Hovered. Grounding bounding coordinates ${hoverCoords[idx]}`, "success");
                        };
                        mark.addEventListener("mouseenter", handleMouseEnter);
                        activePlaygroundListeners.push({ element: mark, event: "mouseenter", callback: handleMouseEnter });
                    });
                }
            };
        } else {
            // STRIDE (Mobile/Infra)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">Mobile AI Systems Focus</span>
                            <span>// PROJECT_01</span>
                        </div>
                        <h2 class="detail-project-title">STRIDE Fitness Engine</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Flutter</span>
                            <span class="detail-tech-badge">Riverpod</span>
                            <span class="detail-tech-badge">Gemini API</span>
                            <span class="detail-tech-badge">Firebase</span>
                        </div>
                        <p class="detail-project-desc">
                            A production-grade physiological fitness tracking application built using Flutter. Employs Gemini API routines and serverless Firebase infrastructure for real-time training scheduling.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">App Architecture</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>State Management:</strong> Governed by Dart Riverpod framework, executing unidirectional data bindings for fast UI reactivity.</li>
                                    <li><strong>Firebase Ledger:</strong> Persists local physiological statistics to cloud Firestore targets using secure offline synchronization handlers.</li>
                                    <li><strong>Routine serving:</strong> Interfaces dynamic prompts with Gemini API models, serving personalized workout cycles on-the-fly.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Application Matrix Specs</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">State Framework:</span>
                                        <span class="spec-val">Riverpod Providers</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Routine Model:</span>
                                        <span class="spec-val">Gemini-1.5-Flash</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Cloud Sync:</span>
                                        <span class="spec-val spec-green">Firebase Offline</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Platform:</span>
                                        <span class="spec-val">Android / iOS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">Gemini API Routine Generator</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green"></span>
                                    </div>
                                    <span class="sandbox-tab-name">Gemini API client</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Adjust workout limits to generate client workout templates dynamically.</p>
                                    <div class="sandbox-controls-row">
                                        <div class="stride-slider-row">
                                            <div class="stride-slider-labels">
                                                <span class="stride-slider-label-txt">Workout Duration:</span>
                                                <span class="stride-slider-val" id="stride-val-dur">30 min</span>
                                            </div>
                                            <input type="range" id="stride-input-dur" class="stride-slider" min="10" max="90" value="30">
                                        </div>
                                        <button id="stride-btn-gen" class="sandbox-btn-run">❯ Dispatch Gemini Prompt</button>
                                    </div>
                                    <div class="stride-routine-output" id="stride-routine-logs">
                                        // Awaiting routine request...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const sliderDur = document.getElementById("stride-input-dur");
                    const labelDur = document.getElementById("stride-val-dur");
                    const btnGen = document.getElementById("stride-btn-gen");
                    const consoleEl = document.getElementById("stride-routine-logs");

                    const handleSlider = () => {
                        labelDur.innerText = `${sliderDur.value} min`;
                    };

                    const handleGen = () => {
                        consoleEl.innerHTML = "";
                        const duration = sliderDur.value;
                        
                        const lines = [
                            `Generating personalized routine target for ${duration} minutes...`,
                            `API payload routed to Gemini-1.5-Flash Core...`,
                            `[ROUTINE CREATED]`,
                            `- 0-5m: Dynamic stretching (warmup)`,
                            `- 5-${duration - 5}m: Tonal cardio circuits (Intensity: High)`,
                            `- ${duration - 5}-${duration}m: Static flexibility cooldown`,
                            `Writing training blocks to Firestore database... Done.`
                        ];

                        let currentLine = 0;
                        const streamInterval = setInterval(() => {
                            if (currentLine < lines.length) {
                                const p = document.createElement("div");
                                p.innerText = lines[currentLine];
                                p.style.marginBottom = "4px";
                                consoleEl.appendChild(p);
                                consoleEl.scrollTop = consoleEl.scrollHeight;
                                currentLine++;
                            } else {
                                clearInterval(streamInterval);
                            }
                        }, 250);

                        activePlaygroundIntervals.push(streamInterval);
                    };

                    sliderDur.addEventListener("input", handleSlider);
                    btnGen.addEventListener("click", handleGen);

                    activePlaygroundListeners.push(
                        { element: sliderDur, event: "input", callback: handleSlider },
                        { element: btnGen, event: "click", callback: handleGen }
                    );
                }
            };
        }
    } else if (projectId === "project-rag-search") {
        if (mode === "ai") {
            // QuantPDC (AI/ML)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">Parallel Systems Focus</span>
                            <span>// PROJECT_02</span>
                        </div>
                        <h2 class="detail-project-title">QuantPDC Backtesting Engine</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">C++</span>
                            <span class="detail-tech-badge">CUDA</span>
                            <span class="detail-tech-badge">MPI</span>
                            <span class="detail-tech-badge">OpenMP</span>
                        </div>
                        <p class="detail-project-desc">
                            A high-performance algorithmic trading backtesting engine leveraging parallel computing architectures (CUDA, MPI, OpenMP) to run thread-safe PnL calculations over massive historical tick data.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Parallel Acceleration</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>OpenMP Multi-threading:</strong> Spawns parallel calculations across CPU threads, processing multiple trading strategies concurrently in shared memory.</li>
                                    <li><strong>CUDA Kernel Speedups:</strong> Accelerates large scale matrix operations on historical price tick records using parallel GPU kernels.</li>
                                    <li><strong>MPI Distributed Sync:</strong> Coordinates backtesting partitions across separate node clusters, reducing completion times for massive tick files.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">High Performance Computing</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Compiler Target:</span>
                                        <span class="spec-val">GCC / NVCC C++17</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Calculated Rate:</span>
                                        <span class="spec-val spec-green">1.2M ticks/sec</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Host Threading:</span>
                                        <span class="spec-val">OpenMP (64 Cores)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">GPU Streaming:</span>
                                        <span class="spec-val">CUDA Kernels</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">Parallel Execution HUD</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green"></span>
                                    </div>
                                    <span class="sandbox-tab-name">Parallel Thread HUD</span>
                                </div>
                                <div class="sandbox-body">
                                    <div class="backtest-stats-row">
                                        <div class="backtest-stat-mini">
                                            <span class="backtest-stat-label">Inference Mode</span>
                                            <span class="backtest-stat-val">CUDA GPU</span>
                                        </div>
                                        <div class="backtest-stat-mini">
                                            <span class="backtest-stat-label">Throughput</span>
                                            <span class="backtest-stat-val">1.2M ticks/s</span>
                                        </div>
                                        <div class="backtest-stat-mini">
                                            <span class="backtest-stat-label">Thread Count</span>
                                            <span class="backtest-stat-val">64 Cores</span>
                                        </div>
                                    </div>
                                    <div class="backtest-thread-monitor">
                                        <span class="backtest-monitor-title">Shared Memory Thread Map (OpenMP)</span>
                                        <div class="backtest-threads-grid" id="threads-grid">
                                            <!-- Generated via JS -->
                                        </div>
                                    </div>
                                    <div class="backtest-progress-track">
                                        <div class="backtest-progress-fill" id="backtest-progress"></div>
                                    </div>
                                    <div class="sandbox-terminal" id="backtest-terminal-logs" style="min-height: 100px;">
                                        <div class="terminal-line">// Parallel backtester initialized. Click launch below.</div>
                                    </div>
                                    <button id="backtest-btn-run" class="sandbox-btn-run">❯ Launch Backtest Engine</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const grid = document.getElementById("threads-grid");
                    const progressFill = document.getElementById("backtest-progress");
                    const terminal = document.getElementById("backtest-terminal-logs");
                    const btnRun = document.getElementById("backtest-btn-run");

                    // Generate thread cells
                    grid.innerHTML = "";
                    for (let i = 0; i < 32; i++) {
                        const cell = document.createElement("div");
                        cell.className = "thread-cell";
                        grid.appendChild(cell);
                    }

                    const handleBacktest = () => {
                        btnRun.disabled = true;
                        progressFill.style.width = "0%";
                        terminal.innerHTML = "";
                        printSimLog(terminal, ">>> Initiating C++ backtesting sequence...", "info");
                        printSimLog(terminal, ">>> Distributing historical tick database partitions using MPI...", "muted");
                        printSimLog(terminal, ">>> Initializing OpenMP thread pool (32 concurrent workers)...", "info");

                        const cells = grid.querySelectorAll(".thread-cell");
                        cells.forEach(c => c.className = "thread-cell");

                        let progress = 0;
                        let cellIdx = 0;

                        const runInterval = setInterval(() => {
                            progress += 6.25;
                            progressFill.style.width = `${progress}%`;
                            
                            // Light up thread cells in batches
                            const batchEnd = Math.min(cellIdx + 4, cells.length);
                            for (let idx = cellIdx; idx < batchEnd; idx++) {
                                cells[idx].className = "thread-cell calculating";
                                setTimeout(() => {
                                    cells[idx].className = "thread-cell complete";
                                }, 300);
                            }
                            cellIdx = batchEnd;

                            printSimLog(terminal, `Processing block [Tick ${progress * 10000} - ${(progress + 6.25) * 10000}]. P&L calculates...`, "muted");

                            if (progress >= 100) {
                                clearInterval(runInterval);
                                btnRun.disabled = false;
                                printSimLog(terminal, ">>> backtesting sequence completed in 320ms.", "success");
                                printSimLog(terminal, ">>> Total processed: 1.2M ticks. Strategy returns: +14.82% PnL.", "success");
                            }
                        }, 120);

                        activePlaygroundIntervals.push(runInterval);
                    };

                    btnRun.addEventListener("click", handleBacktest);
                    activePlaygroundListeners.push({ element: btnRun, event: "click", callback: handleBacktest });
                }
            };
        } else {
            // SOUS (Mobile/Infra)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">Cross-Platform UI focus</span>
                            <span>// PROJECT_02</span>
                        </div>
                        <h2 class="detail-project-title">SOUS Recipe Gateway</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Flutter</span>
                            <span class="detail-tech-badge">Dart</span>
                            <span class="detail-tech-badge">REST API</span>
                            <span class="detail-tech-badge">Docker</span>
                        </div>
                        <p class="detail-project-desc">
                            A decoupled cross-platform recipe recommendation application built in Flutter, querying dynamic recipe vectors served via containerized FastAPI Python services.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">App Architecture</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>Microservice Decohesion:</strong> Employs containerized Docker files to serving ingredient vector databases separately from client logic.</li>
                                    <li><strong>Flutter Frontend:</strong> Features responsive material grid interfaces, managing REST caching targets locally on Android and iOS.</li>
                                    <li><strong>Custom Sorting:</strong> Executes ingredient intersection math client-side, reducing server query overhead.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Client-Server Metrics</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">UI Library:</span>
                                        <span class="spec-val">Flutter Material 3</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Microservice:</span>
                                        <span class="spec-val">Dockerized FastAPI</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Local Cache:</span>
                                        <span class="spec-val spec-green">Hive NoSQL Store</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Sync Protocol:</span>
                                        <span class="spec-val">REST Decoupled</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">Chef Persona Query Sandbox</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green"></span>
                                    </div>
                                    <span class="sandbox-tab-name">FastAPI Endpoint Console</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Input ingredient checklist parameters to fetch menu templates.</p>
                                    <div class="sandbox-controls-row">
                                        <input type="text" id="sous-input-ing" class="sandbox-input" placeholder="Type ingredients (e.g. Tomatoes, Eggs, Cheese)..." value="Tomatoes, Eggs, Cheese">
                                        <button id="sous-btn-fetch" class="sandbox-btn-run">❯ Fetch FastAPI Recommendations</button>
                                    </div>
                                    <div class="stride-routine-output" id="sous-output-logs">
                                        // Awaiting query...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const inputIng = document.getElementById("sous-input-ing");
                    const btnFetch = document.getElementById("sous-btn-fetch");
                    const consoleEl = document.getElementById("sous-output-logs");

                    const handleFetch = () => {
                        consoleEl.innerHTML = "";
                        const rawVal = inputIng.value.trim();
                        if (!rawVal) {
                            consoleEl.innerText = "// Error: Ingredients field cannot be empty.";
                            return;
                        }

                        consoleEl.innerText = "Querying containerized recipe embeddings via REST API...";
                        
                        setTimeout(() => {
                            consoleEl.innerHTML = "";
                            const headerEl = document.createElement("div");
                            headerEl.innerText = `>>> FastAPI: Decoupled model returned matching nodes for [${rawVal}]:`;
                            headerEl.style.fontWeight = "700";
                            headerEl.style.color = "var(--accent-orange)";
                            headerEl.style.marginBottom = "8px";
                            consoleEl.appendChild(headerEl);

                            const suggestion = document.createElement("div");
                            suggestion.innerHTML = `
                                <strong>Tomato & Cheese Frittata</strong> (Match: 94%)<br>
                                <em>Cooking duration: 15 mins</em><br>
                                <ol style="margin-left: 20px; margin-top: 6px;">
                                    <li>Whisk eggs inside a bowl, seasoning with salt.</li>
                                    <li>Dice fresh tomatoes and sauté in skillet.</li>
                                    <li>Pour eggs, sprinkle cheese, and bake until golden.</li>
                                </ol>
                            `;
                            consoleEl.appendChild(suggestion);
                        }, 700);
                    };

                    btnFetch.addEventListener("click", handleFetch);
                    activePlaygroundListeners.push({ element: btnFetch, event: "click", callback: handleFetch });
                }
            };
        }
    } else if (projectId === "project-opaque-ci") {
        if (mode === "ai") {
            // OpaqueCI Agent (AI/ML)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">AI Security & Review Systems</span>
                            <span>// PROJECT_04</span>
                        </div>
                        <h2 class="detail-project-title">OpaqueCI Agent (Zero-Trust)</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Python</span>
                            <span class="detail-tech-badge">FastAPI</span>
                            <span class="detail-tech-badge">ChromaDB</span>
                            <span class="detail-tech-badge">Llama.cpp</span>
                            <span class="detail-tech-badge">Git API</span>
                        </div>
                        <p class="detail-project-desc">
                            A secure, automated backend infrastructure designed to act as an autonomous Senior Security and Architecture Reviewer within private CI/CD pipelines. Evaluates code changes (.diff data) entirely on local hardware, ensuring zero leakage of proprietary intellectual property.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Security & Retrieval Architecture</h3>
                                <div class="architecture-box">
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">1</div>
                                        <div class="flow-step-body"><strong>Webhook Ingestion:</strong> Specialized reverse-proxy webhook server captures Git collaboration triggers (e.g., Pull Requests) and extracts raw structural diff payloads.</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">2</div>
                                        <div class="flow-step-body"><strong>Contextual Retrieval (RAG):</strong> Vectorizes modified file segments using local embedding models and queries an offline ChromaDB instance populated with OWASP rules and internal coding standards.</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">3</div>
                                        <div class="flow-step-body"><strong>Edge SLM Inference:</strong> Processes the code changes combined with retrieved guidelines inside an optimized local Small Language Model (SLM), executing deep logic and leak validation.</div>
                                    </div>
                                    <div class="flow-step-visual">
                                        <div class="flow-step-num">4</div>
                                        <div class="flow-step-body"><strong>Collaborative Feedback:</strong> Automatically compiles the security reports and posts structured markdown reviews directly to the upstream PR timeline.</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 class="detail-section-title">Core Capability Specs</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>Zero Cloud Leaks:</strong> Designed specifically for compliance-heavy, air-gapped developer environments. All raw source code remains local.</li>
                                    <li><strong>Differentiated Review Engine:</strong> Combines syntactic parsing with ChromaDB semantic search to pull rules relevant strictly to the files modified (e.g., SQL patterns for DB files).</li>
                                    <li><strong>Actionable PR Comments:</strong> Generates inline diff suggestions and architectural warnings categorizing items as Critical, Warning, or Optimization.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Inference & System Metrics</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Local SLM:</span>
                                        <span class="spec-val">Llama-3-8B-Instruct (Q4_K_M)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Average Review Speed:</span>
                                        <span class="spec-val spec-green">&lt; 15s / PR</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Offline Vector Database:</span>
                                        <span class="spec-val">ChromaDB (Local SQLite backend)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Webhook Ingestion:</span>
                                        <span class="spec-val">FastAPI + Asyncio</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">OpaqueCI Agent Sandbox</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green" id="oc-light-webhook"></span>
                                        <span class="sandbox-light" id="oc-light-rag"></span>
                                        <span class="sandbox-light" id="oc-light-slm"></span>
                                        <span class="sandbox-light" id="oc-light-api"></span>
                                    </div>
                                    <span class="sandbox-tab-name">OpaqueCI Local Terminal</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Choose a mock Pull Request diff payload and trigger the autonomous local reviewer workflow.</p>
                                    <div class="sandbox-controls-row">
                                        <select id="oc-select-diff" class="sandbox-input" style="background:#fff; color:#1c1917; border: 1px solid var(--border-card);">
                                            <option value="secrets">PR #12: Hardcoded credentials in DB config</option>
                                            <option value="sql">PR #13: Unsanitized SQL query parameters</option>
                                            <option value="clean">PR #14: Refactor user session timeout controller</option>
                                        </select>
                                        <button id="oc-btn-run" class="sandbox-btn-run">❯ Dispatch Webhook Event</button>
                                    </div>
                                    <div class="sandbox-terminal" id="oc-terminal-logs" style="min-height: 200px;">
                                        <div class="terminal-line">// Webhook loop listening on port 8080...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const selectDiff = document.getElementById("oc-select-diff");
                    const btnRun = document.getElementById("oc-btn-run");
                    const terminal = document.getElementById("oc-terminal-logs");
                    
                    const lights = {
                        webhook: document.getElementById("oc-light-webhook"),
                        rag: document.getElementById("oc-light-rag"),
                        slm: document.getElementById("oc-light-slm"),
                        api: document.getElementById("oc-light-api")
                    };

                    const handleReview = () => {
                        const selection = selectDiff.value;
                        terminal.innerHTML = "";
                        btnRun.disabled = true;
                        
                        // Reset lights
                        Object.values(lights).forEach(l => { if (l) l.className = "sandbox-light"; });
                        if (lights.webhook) lights.webhook.className = "sandbox-light green";

                        printSimLog(terminal, ">>> [WEBHOOK RECV] Repository event: pull_request.opened", "info");
                        
                        setTimeout(() => {
                            printSimLog(terminal, ">>> Fetching raw diff contents for PR...", "muted");
                            
                            let diffContent = "";
                            if (selection === "secrets") {
                                diffContent = `
@@ -10,4 +10,4 @@
-DB_HOST = os.environ.get("DATABASE_HOST")
+DB_HOST = "db-production.internal.opaque.ci"
+DB_USER = "admin_root"
+DB_PASS = "Sup3rS3cr3tP4ssw0rd!2026"`;
                            } else if (selection === "sql") {
                                diffContent = `
@@ -25,4 +25,4 @@
-query = "SELECT * FROM users WHERE username = %s"
-cursor.execute(query, (username,))
+query = f"SELECT * FROM users WHERE username = '{username}'"
+cursor.execute(query)`;
                            } else {
                                diffContent = `
@@ -48,4 +48,4 @@
-session.timeout = 1800
+session.timeout = Math.max(300, config.getSessionLimit())`;
                            }
                            
                            printSimLog(terminal, diffContent, "muted");
                            
                            // Stage 2: ChromaDB Retrieval
                            setTimeout(() => {
                                printSimLog(terminal, "--- STAGE 2: INITIATING CHROMADB RETRIEVAL ---", "info");
                                if (lights.rag) lights.rag.className = "sandbox-light yellow";
                                
                                if (selection === "secrets") {
                                    printSimLog(terminal, ">>> Vectorizing diff tokens using local 'all-MiniLM-L6-v2' model...", "muted");
                                    printSimLog(terminal, "[CHROMADB MATCH] Query distance: 0.18. Retrieved rule: SEC-04 (Hardcoded Credentials In Codebase).", "warning");
                                } else if (selection === "sql") {
                                    printSimLog(terminal, ">>> Vectorizing diff tokens using local 'all-MiniLM-L6-v2' model...", "muted");
                                    printSimLog(terminal, "[CHROMADB MATCH] Query distance: 0.22. Retrieved rule: OWASP-A03 (SQL Injection Guardrails).", "warning");
                                } else {
                                    printSimLog(terminal, ">>> Vectorizing diff tokens using local 'all-MiniLM-L6-v2' model...", "muted");
                                    printSimLog(terminal, "[CHROMADB MATCH] Query distance: 0.54. No critical security exceptions found. Returning default structural review standard.", "success");
                                }
                                
                                // Stage 3: SLM Inference
                                setTimeout(() => {
                                    printSimLog(terminal, "--- STAGE 3: RUNNING EDGE SLM INFERENCE ---", "info");
                                    if (lights.slm) lights.slm.className = "sandbox-light yellow";
                                    printSimLog(terminal, ">>> Loading Llama-3-8B-Instruct (4-bit GPU quant) into VRAM context...", "muted");
                                    printSimLog(terminal, ">>> Analyzing diff semantics against retrieved rules...", "muted");
                                    
                                    let slmResult = "";
                                    let status = "success";
                                    if (selection === "secrets") {
                                        slmResult = "[SLM SEVERITY: CRITICAL] Hardcoded plaintext DB password 'Sup3rS3cr3tP4ssw0rd!2026' exposed. Action: Extract password to environment variables.";
                                        status = "error";
                                    } else if (selection === "sql") {
                                        slmResult = "[SLM SEVERITY: CRITICAL] String interpolation f-string detected in SQL statement. Vulnerable to SQL injection. Action: Revert back to parameterized execution.";
                                        status = "error";
                                    } else {
                                        slmResult = "[SLM SEVERITY: OPTIMIZATION] Timeout parameter safely capped using config bounds. Design review holds no security warnings.";
                                        status = "success";
                                    }
                                    
                                    printSimLog(terminal, slmResult, status);
                                    
                                    // Stage 4: API Comment Posting
                                    setTimeout(() => {
                                        printSimLog(terminal, "--- STAGE 4: POSTING UPSTREAM FEEDBACK ---", "info");
                                        if (lights.api) {
                                            lights.api.className = status === "error" ? "sandbox-light red" : "sandbox-light green";
                                        }
                                        
                                        printSimLog(terminal, ">>> Structuring Markdown report for GitHub Pull Request review API...", "muted");
                                        printSimLog(terminal, ">>> Posting response payload to Git Provider API endpoint...", "muted");
                                        printSimLog(terminal, "<<< Upstream API responded: 201 Created. PR comment successfully published inline.", "success");
                                        printSimLog(terminal, "\nReview process completed in 4.2 seconds. Zero data bytes left the local network boundary.", "success");
                                        
                                        btnRun.disabled = false;
                                    }, 1000);
                                    
                                }, 1000);
                                
                            }, 1000);
                            
                        }, 800);
                    };
                    
                    btnRun.addEventListener("click", handleReview);
                    activePlaygroundListeners.push({ element: btnRun, event: "click", callback: handleReview });
                    
                    // Initial trigger
                    handleReview();
                }
            };
        } else {
            // OpaqueCI Companion (Mobile/Infra)
            return {
                html: `
                    <div class="detail-header-section">
                        <div class="detail-badge-row">
                            <span class="detail-category-tag">Developer Security Utilities</span>
                            <span>// PROJECT_04</span>
                        </div>
                        <h2 class="detail-project-title">OpaqueCI Companion (Developer HUD)</h2>
                        <div class="detail-tags-container">
                            <span class="detail-tech-badge">Flutter</span>
                            <span class="detail-tech-badge">Dart</span>
                            <span class="detail-tech-badge">WebSockets</span>
                            <span class="detail-tech-badge">SystemTelemetry</span>
                            <span class="detail-tech-badge">Android/iOS</span>
                        </div>
                        <p class="detail-project-desc">
                            A companion mobile dashboard application built in Flutter for OpaqueCI cluster administrators. Streams system logs, VRAM/CPU footprints, vector store integrity metrics, and real-time security alerts securely over private WebSocket connections.
                        </p>
                    </div>
                    <div class="project-detail-grid">
                        <div class="detail-left-pane">
                            <div>
                                <h3 class="detail-section-title">Companion App Features</h3>
                                <ul class="detail-bullet-list">
                                    <li><strong>Hardware Monitor HUD:</strong> Displays real-time SLM loading states, active core allocation, memory bounds, and GPU temperature profiles.</li>
                                    <li><strong>Cluster Event Log:</strong> Streams security exception reports and raw Git triggers from internal servers directly to verified mobile clients.</li>
                                    <li><strong>Zero-Trust Authentication:</strong> Access controlled via hardware-validated FaceID and mutual TLS cert verification to ensure dashboard access is restricted to verified networks.</li>
                                </ul>
                            </div>
                            <div class="tech-spec-ledger">
                                <h3 class="detail-section-title">Infrastructure Specifications</h3>
                                <div class="spec-ledger-grid">
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">App Framework:</span>
                                        <span class="spec-val">Dart (Flutter)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Transport Stream:</span>
                                        <span class="spec-val">Encrypted WebSockets (WSS)</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Auth Layer:</span>
                                        <span class="spec-val spec-green">mTLS + Device Biometrics</span>
                                    </div>
                                    <div class="spec-ledger-row">
                                        <span class="spec-key">Alert Response:</span>
                                        <span class="spec-val">&lt; 10ms (Local push daemon)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="detail-right-pane">
                            <h3 class="detail-section-title">OpaqueCI Dashboard Telemetry</h3>
                            <div class="interactive-sandbox-container">
                                <div class="sandbox-title-bar">
                                    <div class="sandbox-status-lights">
                                        <span class="sandbox-light green" id="oc-sdk-net"></span>
                                        <span class="sandbox-light" id="oc-sdk-alerts"></span>
                                    </div>
                                    <span class="sandbox-tab-name">Mobile Companion HUD</span>
                                </div>
                                <div class="sandbox-body">
                                    <p class="sandbox-desc">// Simulate real-time cluster workloads and watch SLM resources update on the mobile companion stream.</p>
                                    <div class="sandbox-controls-row" style="flex-direction: row; flex-wrap: wrap; gap: 8px;">
                                        <button id="oc-sdk-btn-load" class="sandbox-btn-run" style="flex: 1; min-width: 120px;">Trigger Heavy PR Load</button>
                                        <button id="oc-sdk-btn-disconnect" class="sandbox-btn-run" style="flex: 1; min-width: 120px; background-color: var(--accent-orange);">Toggle Connection</button>
                                    </div>
                                    <div class="stride-routine-output" id="oc-sdk-terminal-logs" style="font-family: var(--font-mono); font-size: 11px; min-height: 150px; background:#12100f; color:#eae6db; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);">
                                        <div class="terminal-line">// WSS Client connected to cluster gateway. Data streaming active.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                initPlayground: () => {
                    const btnLoad = document.getElementById("oc-sdk-btn-load");
                    const btnDisconnect = document.getElementById("oc-sdk-btn-disconnect");
                    const terminal = document.getElementById("oc-sdk-terminal-logs");
                    const lightNet = document.getElementById("oc-sdk-net");
                    const lightAlerts = document.getElementById("oc-sdk-alerts");
                    
                    let online = true;
                    let loadSimulator = null;
                    
                    if (lightNet) lightNet.className = "sandbox-light green";

                    const appendLog = (text, type = "") => {
                        printSimLog(terminal, text, type);
                    };

                    const handleLoad = () => {
                        if (!online) {
                            appendLog(">>> [TRANSPORT ERR] Websocket connection offline. Cannot fetch real-time telemetry.", "error");
                            return;
                        }
                        
                        btnLoad.disabled = true;
                        appendLog(">>> [SIMULATE] Spawning heavy pipeline payload (5 concurrent PRs)...", "info");
                        
                        if (lightAlerts) lightAlerts.className = "sandbox-light red";
                        
                        let step = 0;
                        const steps = [
                            { log: ">>> CPU Usage spike: 18% -> 92% (Core allocations active)", type: "warning" },
                            { log: ">>> VRAM Buffer loading: 4.8 GB -> 7.9 GB (Llama-3 model context lock)", type: "warning" },
                            { log: ">>> ChromaDB read/write speed: 820 queries/s", type: "muted" },
                            { log: ">>> Local GPU temp peaked at 76°C (Cooling fans active)", type: "warning" },
                            { log: ">>> Parallel inference tasks complete. PR reviews generated.", type: "success" },
                            { log: ">>> Resource profiles returned to steady state. CPU: 12%, VRAM: 4.8 GB.", type: "success" }
                        ];
                        
                        loadSimulator = setInterval(() => {
                            if (step < steps.length) {
                                appendLog(steps[step].log, steps[step].type);
                                step++;
                            } else {
                                clearInterval(loadSimulator);
                                if (lightAlerts) lightAlerts.className = "sandbox-light";
                                btnLoad.disabled = false;
                            }
                        }, 500);
                        
                        activePlaygroundIntervals.push(loadSimulator);
                    };

                    const handleDisconnect = () => {
                        online = !online;
                        if (loadSimulator) clearInterval(loadSimulator);
                        if (lightAlerts) lightAlerts.className = "sandbox-light";
                        btnLoad.disabled = false;

                        if (online) {
                            if (lightNet) lightNet.className = "sandbox-light green";
                            appendLog(">>> WSS Server handshake successful. Connection established.", "success");
                        } else {
                            if (lightNet) lightNet.className = "sandbox-light red";
                            appendLog(">>> [DISCONNECTED] Server socket closed. Client polling backoff active...", "error");
                        }
                    };

                    btnLoad.addEventListener("click", handleLoad);
                    btnDisconnect.addEventListener("click", handleDisconnect);

                    activePlaygroundListeners.push(
                        { element: btnLoad, event: "click", callback: handleLoad },
                        { element: btnDisconnect, event: "click", callback: handleDisconnect }
                    );
                }
            };
        }
    }
}

