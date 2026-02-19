export function initAnimations() {
  initScrollReveal();
  initCounters();
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .stagger');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const startTime = performance.now();
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'fr-FR';

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    el.textContent = prefix + current.toLocaleString(locale) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 3D extruded donut chart
export function initPieChart() {
  const svg = document.querySelector('.pie-chart');
  if (!svg) return;

  const data = [
    { label: 'Prepas Top 5', value: 22, color: '#1B2A4A', dark: '#8A6F2A', side: '#9E832E' },
    { label: 'EPFL', value: 22, color: '#5B8C85', dark: '#2E5750', side: '#3D6B65' },
    { label: 'McGill', value: 12, color: '#A0522D', dark: '#5E2F18', side: '#7A3D1F' },
    { label: 'Autres', value: 16, color: '#6B7B8D', dark: '#3A4550', side: '#4D5A68' },
    { label: 'Ginette', value: 11, color: '#B8973B', dark: '#8A6F2A', side: '#9E832E' },
    { label: 'Sydney', value: 9, color: '#8B4513', dark: '#52280B', side: '#6B340E' },
    { label: 'UPenn', value: 7, color: '#4A6FA5', dark: '#283D5C', side: '#35507A' },
    { label: 'Stanford', value: 5, color: '#B85C3C', dark: '#6E3521', side: '#8E4429' },
    { label: 'MIT', value: 4, color: '#7B6D8D', dark: '#463E50', side: '#5C5169' },
    { label: 'UCL', value: 2, color: '#3D7A5F', dark: '#1F4030', side: '#2B5944' },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 200, cy = 155;
  const R = 155, innerR = 80;
  const depth = 30;
  const tilt = 0.55;

  const g = svg.querySelector('g');
  g.innerHTML = '';

  // Point on tilted ellipse
  function ep(angle, r, dy) {
    const rad = angle * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) * tilt + dy };
  }

  // Elliptical arc SVG command
  function arc(angle, r, dy, largeArc, sweep) {
    const p = ep(angle, r, dy);
    return `A ${r} ${r * tilt} 0 ${largeArc} ${sweep} ${p.x} ${p.y}`;
  }

  // Build segments
  const segments = [];
  let startAngle = -90;
  data.forEach((item, i) => {
    const sweep = (item.value / total) * 360;
    segments.push({
      start: startAngle,
      end: startAngle + sweep,
      sweep,
      ...item,
      index: i
    });
    startAngle += sweep;
  });

  function makePath(d, fill) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', '#FAFAF7');
    path.setAttribute('stroke-width', '0.8');
    return path;
  }

  // --- PHASE 1: Outer side walls (visible when arc passes through bottom half: 0° to 180°) ---
  const outerWalls = [];
  segments.forEach(seg => {
    const clampStart = Math.max(seg.start, 0);
    const clampEnd = Math.min(seg.end, 180);
    if (clampStart >= clampEnd) return;
    outerWalls.push({ s: clampStart, e: clampEnd, mid: (clampStart + clampEnd) / 2, fill: seg.side });
  });
  // Sort: farthest from viewer first (near 0° and 180°), closest last (near 90°)
  outerWalls.sort((a, b) => Math.abs(b.mid - 90) - Math.abs(a.mid - 90));

  outerWalls.forEach(w => {
    const large = (w.e - w.s) > 180 ? 1 : 0;
    const ts = ep(w.s, R, 0);
    const d = `M ${ts.x} ${ts.y} ${arc(w.e, R, 0, large, 1)} L ${ep(w.e, R, depth).x} ${ep(w.e, R, depth).y} ${arc(w.s, R, depth, large, 0)} Z`;
    g.appendChild(makePath(d, w.fill));
  });

  // --- PHASE 2: Inner side walls (visible on top half: 180° to 360°, i.e. -180° to 0°) ---
  const innerWalls = [];
  segments.forEach(seg => {
    const clampStart = Math.max(seg.start, -180);
    const clampEnd = Math.min(seg.end, 0);
    if (clampStart >= clampEnd) return;
    innerWalls.push({ s: clampStart, e: clampEnd, mid: (clampStart + clampEnd) / 2, fill: seg.dark });
  });
  innerWalls.sort((a, b) => Math.abs(b.mid + 90) - Math.abs(a.mid + 90));

  innerWalls.forEach(w => {
    const large = (w.e - w.s) > 180 ? 1 : 0;
    const ts = ep(w.s, innerR, 0);
    const d = `M ${ts.x} ${ts.y} ${arc(w.e, innerR, 0, large, 1)} L ${ep(w.e, innerR, depth).x} ${ep(w.e, innerR, depth).y} ${arc(w.s, innerR, depth, large, 0)} Z`;
    g.appendChild(makePath(d, w.fill));
  });

  // --- PHASE 3: Top faces (donut segments on tilted ellipse) ---
  segments.forEach((seg, i) => {
    const large = seg.sweep > 180 ? 1 : 0;
    const os = ep(seg.start, R, 0);
    const ie = ep(seg.end, innerR, 0);
    const d = `M ${os.x} ${os.y} ${arc(seg.end, R, 0, large, 1)} L ${ie.x} ${ie.y} ${arc(seg.start, innerR, 0, large, 0)} Z`;

    const path = makePath(d, seg.color);
    path.style.opacity = '0';
    path.style.transition = `opacity 0.5s ease ${i * 0.06}s`;
    g.appendChild(path);

    requestAnimationFrame(() => { path.style.opacity = '1'; });
  });

  // --- PHASE 4: Center text (80%) ---
  const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text1.setAttribute('x', cx);
  text1.setAttribute('y', cy - 2);
  text1.setAttribute('text-anchor', 'middle');
  text1.setAttribute('dominant-baseline', 'central');
  text1.setAttribute('fill', '#B8973B');
  text1.setAttribute('font-family', "'Playfair Display', Georgia, serif");
  text1.setAttribute('font-size', '36');
  text1.setAttribute('font-weight', '700');
  text1.textContent = '80%';
  text1.style.opacity = '0';
  text1.style.transition = 'opacity 0.8s ease 0.4s';
  svg.appendChild(text1);

  requestAnimationFrame(() => { text1.style.opacity = '1'; });
}
