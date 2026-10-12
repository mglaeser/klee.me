// A single bounded canvas replaces the old blurred DOM rays. No meadow state lives here.
export function createAurora(parent) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const noop = () => {};
  if (!parent || !ctx) return { move: noop, release: noop, resize: noop };
  canvas.className = "aurora";
  canvas.setAttribute("aria-hidden", "true");
  parent.append(canvas);

  // Cache the emission profile: a bright green lower edge, faint red/violet tops.
  const ray = document.createElement("canvas");
  ray.width = 8;
  ray.height = 256;
  const light = ray.getContext("2d");
  const emission = light.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of [
    [0, "rgba(133,65,120,0)"], [0.18, "rgba(151,71,130,0.045)"],
    [0.38, "rgba(84,182,155,0.07)"], [0.66, "rgba(57,208,128,0.2)"],
    [0.88, "rgba(93,242,143,0.5)"], [0.96, "rgba(157,255,171,0.72)"],
    [1, "rgba(97,236,154,0)"]
  ]) emission.addColorStop(stop, color);
  light.fillStyle = emission;
  light.fillRect(0, 0, 8, 256);

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)");
  let width = 1, height = 1, frame = 0, last = 0, time = 0;
  let targetX = 0.5, targetY = 0.35, pointerX = 0.5, pointerY = 0.35;
  let inputAt = -Infinity, influence = 0, pulse = 0;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    const samples = coarse.matches ? 180 : 300;
    for (let layer = 0; layer < 3; layer++) {
      const phase = time * (0.13 + layer * 0.018) + layer * 2.3;
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const distance = (u - pointerX) / 0.23;
        const near = Math.exp(-distance * distance) * influence;
        const fold = Math.sin(u * 9 + phase) * 0.065
          + Math.sin(u * 19 - phase * 0.7) * 0.018;
        const pleat = Math.sin(u * 73 + Math.sin(u * 13 - phase) * 2 + phase) * 0.007;
        const x = (u * 1.2 - 0.1 + Math.sin(u * 11 + phase) * 0.025
          + near * (pointerX - u) * 0.12) * width;
        const edge = (0.37 + layer * 0.105 + fold + pleat
          + near * (pointerY - 0.4) * 0.13) * height;
        const length = (0.22 + 0.07 * Math.sin(u * 6 + phase)
          + 0.06 * Math.sin(u * 17 - phase) ** 2) * height;
        const taper = Math.sin(Math.PI * u) ** 0.6;
        const filaments = 0.58 + 0.42 * Math.sin(u * 173 + Math.sin(u * 31 + phase) * 2) ** 2;
        const shimmer = 0.85 + 0.15 * Math.sin(u * 23 + phase * 1.5);
        const brightness = (layer === 1 ? 0.74 : 0.36) * taper * filaments * shimmer;
        ctx.globalAlpha = clamp(brightness * (1 + near * 0.35 + pulse * 0.25), 0, 1);
        // A shared lean keeps the rays aligned like a curtain, not independent particles.
        ctx.setTransform(1, 0, 0.12 + Math.sin(phase * 0.3) * 0.025, 1, x, edge - length);
        ctx.drawImage(ray, -width / samples, 0, width / samples * 2.5, length);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    if (!last) last = now;
    const elapsed = now - last;
    if (elapsed >= 1000 / 30) {
      const dt = Math.min(elapsed / 1000, 0.08);
      last = now;
      time += dt;
      const ease = 1 - Math.exp(-dt * 2.5);
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;
      influence += ((now - inputAt < 2400 ? 1 : 0) - influence) * ease;
      pulse *= Math.exp(-dt * 0.7);
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    if (!frame && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = parent.getBoundingClientRect();
    const scale = Math.min(1.25, 1200 / Math.max(1, rect.width), 800 / Math.max(1, rect.height));
    width = Math.max(1, Math.round(rect.width * scale));
    height = Math.max(1, Math.round(rect.height * scale));
    canvas.width = width;
    canvas.height = height;
    if (!document.hidden) draw();
    resume();
  }

  function move(x, y, brighten = false) {
    if (motion.matches) return;
    targetX = clamp(x / Math.max(1, innerWidth), 0, 1);
    if (Number.isFinite(y)) targetY = clamp(y / Math.max(1, innerHeight), 0, 1);
    inputAt = performance.now();
    if (brighten) pulse = 1;
  }

  function release() { inputAt = -Infinity; }

  function visibility() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    resume();
  }

  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", () => {
    influence = pulse = 0;
    visibility();
    if (!document.hidden) draw();
  });
  resize();
  return { move, release, resize };
}
