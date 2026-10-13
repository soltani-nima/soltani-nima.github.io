(() => {
  const doc = document.documentElement;
  const progress = document.getElementById("progress");
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const year = document.getElementById("year");
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll('.site-nav > a[href^="#"]')];
  const tracks = sections
    .map((section) => ({ section, bar: section.querySelector(".sec-mark__track i") }))
    .filter((t) => t.bar);
  const counters = [...document.querySelectorAll("[data-count]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (year) year.textContent = String(new Date().getFullYear());

  /* Scroll: progress bar, header state, active section, margin tracks */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const top = window.scrollY;
    const vh = window.innerHeight;
    const height = doc.scrollHeight - vh;
    if (progress) progress.style.transform = `scaleX(${height > 0 ? Math.min(1, top / height) : 0})`;
    header?.classList.toggle("is-scrolled", top > 10);

    const marker = top + vh * 0.35;
    let current = "";
    for (const section of sections) {
      if (section.offsetTop <= marker) current = section.id;
    }
    if (vh + top >= doc.scrollHeight - 4) current = "contact";
    let activeLink = null;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "true");
        activeLink = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    moveIndicator(activeLink);

    for (const { section, bar } of tracks) {
      const p = (top + vh * 0.5 - section.offsetTop) / section.offsetHeight;
      bar.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
    }
  };

  const indicator = document.querySelector(".nav-indicator");
  let indicatorTarget;
  function moveIndicator(link) {
    if (!indicator || link === indicatorTarget) return;
    indicatorTarget = link;
    if (!link || !link.offsetWidth) {
      indicator.classList.remove("is-ready");
      return;
    }
    const y = link.offsetTop + link.offsetHeight - 1;
    indicator.style.transform = `translate(${link.offsetLeft}px, ${y}px) scaleX(${link.offsetWidth})`;
    requestAnimationFrame(() => indicator.classList.add("is-ready"));
  }

  const refresh = () => {
    indicatorTarget = undefined;
    onScroll();
  };
  window.addEventListener("resize", refresh);
  document.fonts?.ready.then(refresh);
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  /* Mobile navigation */
  const setNav = (open) => {
    nav?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", open ? "true" : "false");
  };
  toggle?.addEventListener("click", () => setNav(!nav?.classList.contains("is-open")));
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) {
      setNav(false);
      toggle?.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (nav?.classList.contains("is-open") && !header?.contains(event.target)) setNav(false);
  });

  /* Theme */
  const themeToggle = document.getElementById("themeToggle");
  const themeListeners = [];
  const syncThemeButton = () => themeToggle?.setAttribute("aria-pressed", doc.dataset.theme === "dark" ? "true" : "false");
  syncThemeButton();
  themeToggle?.addEventListener("click", () => {
    doc.dataset.theme = doc.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", doc.dataset.theme);
    } catch {}
    syncThemeButton();
    themeListeners.forEach((fn) => fn());
  });

  /* Reveal on scroll, section rules */
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach((node, i) => {
      node.style.transitionDelay = `${(i % 4) * 60}ms`;
      node.addEventListener("transitionend", () => node.style.removeProperty("transition-delay"), { once: true });
      io.observe(node);
    });
    const sio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          sio.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    sections.forEach((s) => sio.observe(s));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    sections.forEach((s) => s.classList.add("is-in"));
  }

  /* Counters */
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1200);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && "IntersectionObserver" in window && !reducedMotion.matches) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* Research program: trace a line of work across the page */
  const labels = { markets: "Markets", structure: "Structure", physics: "Physics", brain: "Brain signals", chain: "Protocols" };
  const topicButtons = [...document.querySelectorAll("button[data-topic]")];
  const themeRows = [...document.querySelectorAll("[data-key]")];
  const mapRows = [...document.querySelectorAll(".map__table tbody tr")];
  const mapTable = document.querySelector(".map__table");
  const topicNodes = [...document.querySelectorAll("[data-topics]")];
  const filterStatus = document.getElementById("filterStatus");
  const tracer = document.getElementById("tracer");
  const tracerText = document.getElementById("tracerText");
  const topicListeners = [];
  let activeTopic = "all";

  const applyTopic = (topic) => {
    activeTopic = topic;
    topicButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.topic === topic ? "true" : "false"));
    themeRows.forEach((row) => row.classList.toggle("is-selected", row.dataset.key === topic));
    mapRows.forEach((row) => row.classList.toggle("is-selected", row.dataset.row === topic));
    mapTable?.classList.toggle("has-selection", topic !== "all");

    let papers = 0;
    let roles = 0;
    topicNodes.forEach((node) => {
      const match = topic === "all" || (node.dataset.topics || "").split(/\s+/).includes(topic);
      node.classList.toggle("is-dimmed", !match);
      if (match && node.classList.contains("writing")) papers += 1;
      if (match && node.classList.contains("appointment")) roles += 1;
    });

    const summary =
      topic === "all"
        ? ""
        : `${labels[topic]}: ${papers} ${papers === 1 ? "manuscript" : "manuscripts"}, ${roles} ${roles === 1 ? "appointment" : "appointments"}`;
    if (filterStatus) filterStatus.textContent = summary;
    if (tracer && tracerText) {
      tracer.hidden = topic === "all";
      tracerText.textContent = topic === "all" ? "" : `Tracing ${summary}`;
    }
    topicListeners.forEach((fn) => fn(topic));
  };
  const toggleTopic = (topic) => applyTopic(activeTopic === topic ? "all" : topic);

  topicButtons.forEach((b) =>
    b.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleTopic(b.dataset.topic);
    })
  );
  themeRows.forEach((row) =>
    row.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      toggleTopic(row.dataset.key);
    })
  );
  document.getElementById("tracerClear")?.addEventListener("click", () => applyTopic("all"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeTopic !== "all" && !nav?.classList.contains("is-open")) applyTopic("all");
  });

  /* Teaching explorer */
  const explorer = document.getElementById("explorer");
  if (explorer) {
    const terms = [...explorer.querySelectorAll(".term")];
    const rows = terms.flatMap((term) =>
      [...term.querySelectorAll("li")].map((li) => ({ li, term: term.dataset.term }))
    );
    const instButtons = [...explorer.querySelectorAll("button[data-inst]")];
    const flagButtons = [...explorer.querySelectorAll("button[data-flag]")];
    const waffle = document.getElementById("waffle");
    const status = document.getElementById("teachStatus");
    const empty = document.getElementById("teachEmpty");
    const instNames = { sharif: "Sharif", aut: "Amirkabir", sbu: "Shahid Beheshti" };
    const state = { inst: "all", head: false, grad: false, term: null };
    const cells = [];
    const termButtons = [];

    [...terms].reverse().forEach((term) => {
      const title = term.querySelector(".term__title")?.firstChild?.textContent.trim() || "";
      const termRows = rows.filter((r) => r.term === term.dataset.term);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "waffle__term";
      button.dataset.term = term.dataset.term;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${title}: ${termRows.length} sections`);
      const box = document.createElement("span");
      box.className = "waffle__cells";
      box.setAttribute("aria-hidden", "true");
      termRows.forEach((r) => {
        const cell = document.createElement("i");
        cell.dataset.inst = r.li.dataset.inst;
        box.appendChild(cell);
        cells.push({ cell, row: r });
      });
      const label = document.createElement("span");
      label.className = "waffle__label";
      label.setAttribute("aria-hidden", "true");
      const [from, to] = title.replace(/20(\d\d)/g, "\u2019$1").split("\u2013");
      label.innerHTML = `<b>${termRows.length}</b><span>${from}\u2013</span><span>${to}</span>`;
      button.append(box, label);
      button.addEventListener("click", () => {
        state.term = state.term === term.dataset.term ? null : term.dataset.term;
        apply();
      });
      termButtons.push(button);
      waffle?.appendChild(button);
    });
    waffle?.classList.add("is-ready");

    const matches = (r, ignoreTerm) =>
      (state.inst === "all" || r.li.dataset.inst === state.inst) &&
      (!state.head || r.li.hasAttribute("data-head")) &&
      (!state.grad || r.li.hasAttribute("data-grad")) &&
      (ignoreTerm || !state.term || r.term === state.term);

    function apply() {
      let shown = 0;
      rows.forEach((r) => {
        const ok = matches(r, false);
        r.li.hidden = !ok;
        if (ok) shown += 1;
      });
      terms.forEach((term) => {
        term.hidden = ![...term.querySelectorAll("li")].some((li) => !li.hidden);
      });
      cells.forEach(({ cell, row }) => cell.classList.toggle("is-off", !matches(row, false)));
      instButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.inst === state.inst ? "true" : "false"));
      flagButtons.forEach((b) => b.setAttribute("aria-pressed", state[b.dataset.flag] ? "true" : "false"));
      termButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.term === state.term ? "true" : "false"));
      if (empty) empty.hidden = shown > 0;

      const parts = [];
      if (state.inst !== "all") parts.push(`at ${instNames[state.inst]}`);
      if (state.head) parts.push("as head TA");
      if (state.grad) parts.push("in graduate courses");
      if (state.term) {
        const t = terms.find((x) => x.dataset.term === state.term);
        parts.push(`in ${t?.querySelector(".term__title")?.firstChild?.textContent.trim()}`);
      }
      if (status) {
        status.textContent = parts.length
          ? `Showing ${shown} of ${rows.length} sections ${parts.join(", ")}`
          : `Showing all ${rows.length} sections`;
      }
    }

    instButtons.forEach((b) =>
      b.addEventListener("click", () => {
        state.inst = b.dataset.inst;
        apply();
      })
    );
    flagButtons.forEach((b) =>
      b.addEventListener("click", () => {
        state[b.dataset.flag] = !state[b.dataset.flag];
        apply();
      })
    );
    apply();
  }

  /* Copy contact details */
  const copyStatus = document.getElementById("copyStatus");
  const selectValue = (button) => {
    const value = button.parentElement?.querySelector(".channel__value");
    if (!value) return;
    const range = document.createRange();
    range.selectNodeContents(value);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  const flash = (button, label, done) => {
    clearTimeout(button._t);
    button.textContent = label;
    button.classList.toggle("is-done", done);
    button._t = setTimeout(() => {
      button.textContent = "Copy";
      button.classList.remove("is-done");
    }, 1800);
  };
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error("no clipboard");
        await navigator.clipboard.writeText(text);
        flash(button, "Copied", true);
        if (copyStatus) copyStatus.textContent = `Copied ${text}`;
      } catch {
        selectValue(button);
        flash(button, "Selected", false);
        if (copyStatus) copyStatus.textContent = `${text} selected; press Ctrl+C to copy`;
      }
    });
  });

  /* Local time in Tehran */
  const clock = document.getElementById("localTime");
  if (clock && window.Intl) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" });
    const update = () => {
      clock.textContent = fmt.format(new Date());
    };
    update();
    setInterval(update, 30000);
  }

  /* Hero instrument: synthetic channels scrolling toward a decision edge */
  const canvas = document.getElementById("signals");
  const pauseBtn = document.getElementById("signalPause");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const N = 220;
    const gauss = () => {
      const u = 1 - Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
    };
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    let k = 0;
    const st = { x: 0, target: 0, hold: 0, burst: 0, len: 0 };
    const channels = [
      { label: "price", topic: "markets", next: () => (st.x = st.x * 0.985 + 0.11 * gauss(), Math.tanh(st.x)) },
      {
        label: "fundamentals",
        topic: "markets",
        next(prev) {
          if (--st.hold <= 0) {
            st.target = (Math.random() * 2 - 1) * 0.75;
            st.hold = 40 + Math.random() * 60;
          }
          return prev + (st.target - prev) * 0.07;
        },
      },
      { label: "news text", topic: "markets", next: (prev) => clamp(prev * 0.84 + (Math.random() < 0.035 ? (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5) : 0) + 0.03 * gauss()) },
      { label: "co-movement", topic: "structure", next: (prev) => clamp(prev * 0.86 + 0.14 * (0.85 * Math.tanh(st.x) + 0.3 * gauss())) },
      { label: "PDE residual", topic: "physics", next: () => 0.8 * Math.sin(k * 0.11) * (0.55 + 0.45 * Math.sin(k * 0.017)) },
      { label: "MEG \u00b7 occipital", topic: "brain", next: () => clamp(0.55 * Math.sin(k * 0.9) * (0.5 + 0.5 * Math.sin(k * 0.031)) + 0.12 * gauss()) },
      {
        label: "MEG \u00b7 motor",
        topic: "brain",
        next() {
          let v = 0.1 * gauss();
          if (st.burst > 0) {
            v += 0.75 * Math.sin(k * 1.7) * Math.sin((Math.PI * st.burst) / st.len);
            st.burst -= 1;
          } else if (Math.random() < 0.02) {
            st.len = st.burst = 25 + Math.floor(Math.random() * 20);
          }
          return clamp(v);
        },
      },
      { label: "transactions", topic: "chain", bars: true, next: () => (k % 11 === 0 ? 0.25 + Math.random() * 0.75 : 0) },
    ];
    const buffers = channels.map(() => new Float32Array(N));
    const step = () => {
      k += 1;
      channels.forEach((c, i) => {
        const b = buffers[i];
        const v = c.next(b[N - 1]);
        b.copyWithin(0, 1);
        b[N - 1] = v;
      });
    };
    for (let i = 0; i < N; i += 1) step();

    let w = 0;
    let h = 0;
    let colors = {};
    let topic = "all";
    const readColors = () => {
      const cs = getComputedStyle(doc);
      const v = (name) => cs.getPropertyValue(name).trim();
      colors = { ink: v("--ink"), muted: v("--muted"), line: v("--line"), line2: v("--line-2"), signal: v("--signal"), accent: v("--accent") };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (frac) => {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const nowX = Math.round(w * 0.8) + 0.5;
      const dx = nowX / (N - 2);
      const rowH = h / channels.length;
      const small = w < 420;

      ctx.save();
      ctx.beginPath();
      ctx.rect(nowX, 0, w - nowX, h);
      ctx.clip();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      for (let x = nowX - h; x < w; x += 7) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.stroke();
      }
      ctx.restore();

      ctx.font = `${small ? 9 : 10}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      channels.forEach((c, i) => {
        const y0 = rowH * (i + 0.64);
        const amp = rowH * 0.32;
        const on = topic === "all" || c.topic === topic;
        const hot = topic === "all" ? c.topic === "brain" : c.topic === topic;
        const stroke = hot ? colors.signal : colors.ink;
        ctx.globalAlpha = on ? 1 : 0.18;

        ctx.strokeStyle = colors.line;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y0) + 0.5);
        ctx.lineTo(w, Math.round(y0) + 0.5);
        ctx.stroke();

        ctx.fillStyle = hot ? colors.signal : colors.muted;
        ctx.fillText(c.label, 6, rowH * i + 4);

        const b = buffers[i];
        ctx.strokeStyle = stroke;
        ctx.lineWidth = hot && topic !== "all" ? 1.6 : 1.15;
        ctx.beginPath();
        if (c.bars) {
          for (let j = 0; j < N; j += 1) {
            if (!b[j]) continue;
            const x = (j - frac) * dx;
            if (x < 0 || x > nowX) continue;
            ctx.moveTo(x, y0);
            ctx.lineTo(x, y0 - b[j] * amp * 1.6);
          }
        } else {
          for (let j = 0; j < N; j += 1) {
            const x = Math.min(nowX, (j - frac) * dx);
            const y = y0 - b[j] * amp;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        if (!c.bars) {
          ctx.fillStyle = stroke;
          ctx.beginPath();
          ctx.arc(nowX, y0 - b[N - 1] * amp, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      ctx.strokeStyle = colors.signal;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(nowX, 0);
      ctx.lineTo(nowX, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.signal;
      ctx.textAlign = "left";
      ctx.fillText("now", nowX + 5, 4);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      if (!small) ctx.fillText("unobserved", w - 6, h - 4);
      ctx.textAlign = "left";
    };

    const interval = 55;
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let paused = reducedMotion.matches;

    const frame = (now) => {
      acc += Math.min(200, now - last);
      last = now;
      while (acc >= interval) {
        step();
        acc -= interval;
      }
      draw(acc / interval);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || paused || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const syncPause = () => {
      if (!pauseBtn) return;
      pauseBtn.textContent = paused ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.setAttribute("aria-label", paused ? "Play the signal animation" : "Pause the signal animation");
    };

    readColors();
    resize();
    draw(0);
    syncPause();
    start();

    pauseBtn?.addEventListener("click", () => {
      paused = !paused;
      syncPause();
      if (paused) stop();
      else start();
    });
    themeListeners.push(() => {
      readColors();
      if (!running) draw(0);
    });
    topicListeners.push((t) => {
      topic = t;
      if (!running) draw(0);
    });
    document.fonts?.ready.then(() => !running && draw(0));
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        resize();
        if (!running) draw(0);
      }).observe(canvas);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) {
        paused = true;
        stop();
        syncPause();
        draw(0);
      }
    });
  }
})();
