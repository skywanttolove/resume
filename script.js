// Info 
(() => {
    const D = window.RESUME;
    if (!D) {
        document.body.insertAdjacentHTML("afterbegin",
            '<p class="noscript">ไม่พบข้อมูล: ตรวจสอบว่า data.js อยู่โฟลเดอร์เดียวกัน และไม่มี syntax error</p>');
        return;
    }

    const $ = (sel) => document.querySelector(sel);
    const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const hideSection = (id) => {
        const sec = document.getElementById(id);
        if (!sec) return;
        sec.hidden = true;
        const hr = sec.previousElementSibling;
        if (hr && hr.tagName === "HR") hr.hidden = true;
        document.querySelector(`#navMenu a[href="#${id}"]`)?.parentElement.setAttribute("hidden", "");
    };

    /* ข้อความทั่วไป */
    document.title = `${D.name} | Resume`;
    document.querySelectorAll("[data-field]").forEach((el) => {
        el.textContent = D[el.dataset.field] ?? "";
    });
    if (!D.status) $("#statusChip").hidden = true;

    /* Profile */
    const avatar = $("#avatar");
    avatar.alt = D.name;
    const candidates = [D.photo, ...(D.photoFallbacks || [])].filter(Boolean);
    let tried = 0;
    const tryNext = () => {
        if (tried < candidates.length) {
            avatar.src = candidates[tried++];
            return;
        }
        const initials = D.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        avatar.replaceWith(Object.assign(document.createElement("div"),
            { className: "avatar avatar-fallback", textContent: initials }));
    };
    avatar.onerror = tryNext;
    tryNext();

    const uni = $("#uniLink");
    uni.textContent = D.university?.name ?? "";
    uni.href = D.university?.url ?? "#";

    $("#year").textContent = new Date().getFullYear();

    /* About Me */
    if (D.about?.length) {
        $("#aboutBody").innerHTML = D.about.map((p) => `<p>${esc(p)}</p>`).join("");
    } else hideSection("about");


    /* Timeline */
    if (D.timeline?.length) {
        $("#timelineList").innerHTML = D.timeline.map((t) => `
            <li class="${t.type === "Experience" ? "is-exp" : "is-edu"}">
                <div class="timeline-meta">
                    <span class="badge-type">${esc(t.type)}</span>
                    ${t.period ? `<span class="timeline-date">${esc(t.period)}</span>` : ""}
                </div>
                <h3>${esc(t.title)}</h3>
                <p class="timeline-place">${esc(t.place)}</p>
                ${(t.details || []).map((d) => `<p>${esc(d)}</p>`).join("")}
            </li>`).join("");
    } else hideSection("education");

    /* Skills */
    if (D.skills?.length) {
        $("#skillGroups").innerHTML = D.skills.map((g) => `
            <div class="skill-group">
                <h3 class="group-title">${esc(g.group)}</h3>
                <div class="row g-4">
                    ${g.items.map((s) => `
                    <div class="col-12 col-md-6 col-xl-3">
                        <div class="card-glass skill">
                            <div class="skill-icon">${esc(s.icon)}</div>
                            <div>
                                <h4>${esc(s.name)}</h4>
                                <p>${esc(s.desc)}</p>
                            </div>
                        </div>
                    </div>`).join("")}
                </div>
            </div>`).join("");
    } else hideSection("skills");

    /*Others*/
    if (D.others?.length) {
        $("#otherList").innerHTML = D.others.map((o) => `
            <div class="col-12 col-md-6 col-xl-3">
                <div class="card-glass other">
                    <h3>${esc(o.title)}</h3>
                    <p>${o.lines.map(esc).join("<br>")}</p>
                </div>
            </div>`).join("");
    } else hideSection("others");

    /*Contact */
    const c = D.contact || {};
    const email = c.emailUser && c.emailDomain ? `${c.emailUser}@${c.emailDomain}` : "";
    const rows = [];
    if (email) rows.push(`
        <li><span class="c-label">Email</span>
            <span class="c-value">
                <a href="mailto:${esc(email)}">${esc(c.emailUser)}<span class="at">@</span>${esc(c.emailDomain)}</a>
                <button type="button" class="copy-btn" data-copy="${esc(email)}">Copy</button>
            </span></li>`);
    if (c.phone) rows.push(`
        <li><span class="c-label">Phone</span>
            <span class="c-value"><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a></span></li>`);
    if (c.address) rows.push(`
        <li><span class="c-label">Address</span><span class="c-value">${esc(c.address)}</span></li>`);
    if (c.github) rows.push(`
        <li><span class="c-label">GitHub</span>
            <span class="c-value"><a href="${esc(c.github)}" target="_blank" rel="noopener">${esc(c.github.replace(/^https?:\/\//, ""))} ↗</a></span></li>`);
    $("#contactList").innerHTML = rows.join("");

    /*  Copy email*/
    const toast = $("#toast");
    let toastTimer;
    const showToast = (msg) => {
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
    };
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-copy]");
        if (!btn) return;
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            showToast("Email copied ✓");
        } catch {
            showToast(btn.dataset.copy);
        }
    });

    /* Theme toggle */
    $("#themeToggle").addEventListener("click", () => {
        const root = document.documentElement;
        const next = root.dataset.theme === "light" ? "dark" : "light";
        root.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch { /* ignore */ }
    });

    /*  Print / Save PDF*/
    $("#printBtn").addEventListener("click", () => window.print());

    /*  Navbar */
    const navbar = $("#mainNav");
    const navMenu = $("#navMenu");
    const scrollBar = $("#scrollBar");
    const toTop = $("#toTop");
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle("scrolled", y > 20);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
        toTop.classList.toggle("show", y > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    document.querySelectorAll("#navMenu .nav-link").forEach((link) => {
        link.addEventListener("click", () => {
            if (navMenu.classList.contains("show")) {
                navMenu.classList.remove("show");
                document.querySelector(".navbar-toggler").setAttribute("aria-expanded", "false");
            }
        });
    });

    /* Scroll reveal */
    const targets = document.querySelectorAll(".section-title, .card-glass, .timeline li, .group-title");
    if ("IntersectionObserver" in window) {
        targets.forEach((el) => {
            el.classList.add("reveal");
            
            const i = [...(el.parentElement?.parentElement?.children ?? [])]
                .indexOf(el.parentElement);
            el.style.setProperty("--d", `${Math.max(0, Math.min(i, 5)) * 80}ms`);
        });
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.classList.add("visible");
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        targets.forEach((el) => io.observe(el));
    }

    /*ไล่หัวข้อใหม่ -    */
    document.querySelectorAll(".section:not([hidden]) .section-title .num")
        .forEach((el, i) => { el.textContent = String(i + 1).padStart(2, "0") + "."; });

    /* ไฟสปอตไลต์ตามเมาส์บนการ์ด */
    if (window.matchMedia("(hover: hover)").matches) {
        document.addEventListener("pointermove", (e) => {
            const card = e.target.closest(".card-glass");
            if (!card) return;
            const r = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${e.clientX - r.left}px`);
            card.style.setProperty("--my", `${e.clientY - r.top}px`);
        }, { passive: true });
    }

    // เนื้อหาสร้างหลังโหลด ให้ scrollspy คำนวณตำแหน่งใหม่
    const menuButton = document.querySelector('.navbar-toggler');
    menuButton.addEventListener('click', () => {
        const open = navMenu.classList.toggle('show');
        menuButton.setAttribute('aria-expanded', String(open));
    });
    const sections = document.querySelectorAll('header[id], section:not([hidden])');
    if ('IntersectionObserver' in window) {
        const activeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
            });
        }, {rootMargin: '-15% 0px -60% 0px'});
        sections.forEach(section => activeObserver.observe(section));
    }
})();
