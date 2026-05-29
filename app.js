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
});

// Re-stabilize layout heights once fonts are fully loaded
window.addEventListener("load", stabilizeLayoutHeights);
if (document.fonts) {
    document.fonts.ready.then(stabilizeLayoutHeights);
}

// Global spotlight tracker for relative mouse position with lerping (liquid hover effects)
const activeSpotlights = new Map();

document.addEventListener("mousemove", (e) => {
    const currentHovered = new Set();
    let current = e.target;
    const selector = ".section-container, .hero-section, .skill-card-module, .btn, .chip, .metric-hud-box, .project-row-block, .specialization-toggle-bar, .back-to-top-btn, .nav-link, .footer-link-port, .logo-monogram-box, .logo-name, .header-brand-badge, .toggle-label, .hero-title, .project-title, .skill-card-name, .section-title";
    
    const updateTarget = (el) => {
        currentHovered.add(el);
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
                data.targetX = e.clientX - data.rect.left;
                data.targetY = e.clientY - data.rect.top;
            }
        }
    }
});

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
        const prefixId = projectId === "agentic-flow" ? "af" : "rs";
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
    const wrapper = document.querySelector(".specialization-toggle-wrapper");
    const pTogglePill = document.getElementById("projects-toggle-btn");
    const pLabelAI = document.getElementById("p-label-ai");
    const pLabelInfra = document.getElementById("p-label-infra");

    let currentSpecialization = "ai"; // default state

    function switchMode(newMode) {
        if (newMode === currentSpecialization) return;
        currentSpecialization = newMode;

        // 1. Move slider knob visually
        if (newMode === "infra") {
            wrapper.classList.add("infra-active");
            labelAI.classList.remove("active");
            labelInfra.classList.add("active");
        } else {
            wrapper.classList.remove("infra-active");
            labelAI.classList.add("active");
            labelInfra.classList.remove("active");
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
                const prefixId = projectId === "agentic-flow" ? "af" : "rs";
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
        toggleBar.addEventListener("click", () => {
            const target = currentSpecialization === "ai" ? "infra" : "ai";
            switchMode(target);
        });
    }

    if (labelAI) {
        labelAI.addEventListener("click", () => switchMode("ai"));
    }

    if (labelInfra) {
        labelInfra.addEventListener("click", () => switchMode("infra"));
    }

    // Wire up projects context segmented toggle click
    if (pTogglePill) {
        pTogglePill.addEventListener("click", () => {
            const target = currentSpecialization === "ai" ? "infra" : "ai";
            switchMode(target);
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
