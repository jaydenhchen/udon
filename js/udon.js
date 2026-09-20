function mulberry(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 15), 0x45d9f3b);
    return ((s ^ (s >>> 15)) >>> 0) / 4294967296;
  };
}

function hashRecipe(recipe) {
  const keys = [...recipe.items].sort().join(",") + recipe.temp;
  let h = 2166136261;
  for (let i = 0; i < keys.length; i++) {
    h ^= keys.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}

function detectRecipe(recipe) {
  const has = (id) => recipe.items.has(id);
  const cold = recipe.temp === "cold";
  const noodles = has("udon");
  if (!noodles) {
    if (recipe.items.size === 0) return { id: "empty", name: "Empty bowl", jp: "空の丼", score: 0 };
    return { id: "broth", name: "Lonely soup", jp: "汁だけ", score: 1 };
  }
  const spicy = has("chili_oil") || has("togarashi");
  const niku = has("niku");
  if (cold && niku && spicy) {
    return {
      id: "cold_niku_spicy",
      name: "Cold Niku Spicy Udon",
      jp: "冷やし肉辛うどん",
      score: 10,
      flavor: [
        "The first slurp is ice, then fire.",
        "Chili oil clings to each chewy ribbon. The beef is sweet, the noodles snap.",
        "Spring itself — cold, spicy, marbled, perfect.",
      ],
    };
  }
  if (niku && spicy) {
    return { id: "niku_spicy", name: "Spicy Niku Udon", jp: "肉辛うどん", score: 8, flavor: ["Hot broth, chili bloom, melting beef."] };
  }
  if (cold && spicy) {
    return { id: "hiyashi_spicy", name: "Cold Spicy Udon", jp: "冷やし辛うどん", score: 7, flavor: ["Chilled noodles, a red sheen of rayu."] };
  }
  if (cold && niku) {
    return { id: "hiyashi_niku", name: "Cold Niku Udon", jp: "冷やし肉うどん", score: 7, flavor: ["Sweet beef on a winter-cold noodle."] };
  }
  if (has("tempura") && !cold) {
    return { id: "tempura", name: "Tempura Udon", jp: "天うどん", score: 7, flavor: ["Crunch, then steam, then dashi."] };
  }
  if (niku) {
    return { id: "niku", name: "Niku Udon", jp: "肉うどん", score: 7, flavor: ["Glazed beef drapes the hot noodles."] };
  }
  if (cold) {
    return { id: "hiyashi", name: "Hiyashi Udon", jp: "冷やしうどん", score: 5, flavor: ["A clean cold chew. Add chili and beef next time?"] };
  }
  if (has("dashi") || has("tsuyu")) {
    return { id: "kake", name: "Kake Udon", jp: "かけうどん", score: 5, flavor: ["Simple, golden, honest."] };
  }
  if (has("egg")) {
    return { id: "egg", name: "Tamago Udon", jp: "卵うどん", score: 6, flavor: ["Yolk silk on wheat."] };
  }
  return { id: "plain", name: "Plain Udon", jp: "うどん", score: 3, flavor: ["Noodles, waiting for a story."] };
}

function ellipsePt(cx, cy, rx, ry, a) {
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
}

function strokeStrand(ctx, pts, width, color, alpha = 1) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
  ctx.restore();
}

function makeStrands(rng, count, cx, cy, rx, ry, eat) {
  const strands = [];
  const n = Math.max(4, Math.floor(count * (1 - eat * 0.85)));
  for (let i = 0; i < n; i++) {
    const pts = [];
    let a = rng() * Math.PI * 2;
    let r = 0.15 + rng() * 0.75;
    let x = cx + Math.cos(a) * rx * r;
    let y = cy + Math.sin(a) * ry * r * 0.9;
    const k = 8 + (rng() * 7) | 0;
    for (let j = 0; j < k; j++) {
      pts.push([x, y]);
      a += (rng() - 0.42) * 1.1;
      r = Math.min(0.92, Math.max(0.08, r + (rng() - 0.45) * 0.22));
      x = cx + Math.cos(a) * rx * r;
      y = cy + Math.sin(a) * ry * r * 0.92 + j * 1.2;
    }
    if (rng() > 0.72) {
      pts.push([cx + (rng() - 0.5) * rx * 1.7, cy + ry * 0.55 + rng() * 18]);
    }
    strands.push({
      pts,
      w: 8.8 + rng() * 6.2,
      tint: rng(),
    });
  }
  return strands;
}

function drawSeigaiha(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, rx + 18, ry + 28, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(40, 70, 130, 0.22)";
  ctx.lineWidth = 1.2;
  for (let y = cy - 70; y < cy + 120; y += 14) {
    for (let x = cx - 120; x < cx + 120; x += 16) {
      ctx.beginPath();
      ctx.arc(x + ((y / 14) % 2) * 8, y, 9, Math.PI, 0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBowlCeramic(ctx, cx, cy, rx, ry, cold) {
  ctx.save();
  ctx.fillStyle = "rgba(40, 20, 10, 0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry + 18, rx * 0.92, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy + ry);
  body.addColorStop(0, "#f7f1e6");
  body.addColorStop(0.4, cold ? "#e8eef4" : "#efe6d4");
  body.addColorStop(1, "#c9b8a0");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, rx + 22, ry + 32, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSeigaiha(ctx, cx, cy, rx, ry);

  ctx.strokeStyle = cold ? "rgba(170, 190, 210, 0.55)" : "rgba(90, 70, 50, 0.4)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 6, ry + 8, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();

  const inner = ctx.createRadialGradient(cx - 20, cy - 10, 10, cx, cy, rx);
  inner.addColorStop(0, cold ? "#f2f6fa" : "#fff8ee");
  inner.addColorStop(1, cold ? "#c5d0dc" : "#d8c4a4");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, -0.8, 0.6);
  ctx.stroke();

  ctx.strokeStyle = "rgba(80,50,30,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBroth(ctx, recipe, cx, cy, rx, ry, eat, t) {
  const has = (id) => recipe.items.has(id);
  const cold = recipe.temp === "cold";
  const spicy = has("chili_oil") || has("togarashi");
  const level = 0.92 - eat * 0.28;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, rx * 0.9, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.clip();

  let c0 = "#c9a060";
  let c1 = "#8a5a28";
  if (has("dashi") || has("tsuyu")) {
    c0 = cold ? "#6b4a28" : "#d4a24a";
    c1 = cold ? "#3a2414" : "#8a5a1c";
  }
  if (spicy && cold) {
    c0 = "#6a2418";
    c1 = "#2a0c08";
  } else if (spicy) {
    c0 = "#b84a28";
    c1 = "#6a2010";
  }
  if (!has("dashi") && !has("tsuyu") && !spicy) {
    c0 = "#e8dcc8";
    c1 = "#c8b49a";
  }

  const g = ctx.createRadialGradient(cx - 30, cy - 20, 20, cx, cy, rx);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.globalAlpha = 0.92 * level;
  ctx.fillStyle = g;
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);

  if (spicy) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#9a1c0c";
    for (let i = 0; i < 8; i++) {
      const a = t / 1400 + i * 0.8;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 50, cy + Math.sin(a * 1.3) * 28, 34, 14, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#e05020";
    ctx.beginPath();
    ctx.ellipse(cx + 40, cy - 10, 36, 16, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#fff6e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx - 16, cy - ry * 0.25, rx * 0.35, 8, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawNoodles(ctx, strands, eat, spicy) {
  for (const s of strands) {
    const dim = 1 - eat * 0.15;
    const base = spicy ? `rgb(${228 + s.tint * 10},${210 - s.tint * 20},${170 - s.tint * 30})` : `rgb(${236 + s.tint * 12},${220 - s.tint * 8},${186 - s.tint * 20})`;
    const shadow = `rgb(${168 - s.tint * 20},${130 - s.tint * 10},${80})`;
    const hi = "#fffaf0";
    strokeStrand(ctx, s.pts.map((p) => [p[0] + 1.2, p[1] + 1.8]), s.w + 2.2, shadow, 0.35 * dim);
    strokeStrand(ctx, s.pts, s.w, base, 0.98 * dim);
    const hiPts = s.pts.map((p, i) => [p[0] - 1.4, p[1] - 1.1 - (i % 3 === 0 ? 0.4 : 0)]);
    strokeStrand(ctx, hiPts, Math.max(1.6, s.w * 0.28), hi, 0.55 * dim);
    if (spicy) {
      strokeStrand(ctx, s.pts, Math.max(1.2, s.w * 0.2), "rgba(160,30,12,0.35)", 0.5);
    }
  }
}

function drawBeef(ctx, rng, cx, cy, rx, ry, eat, t) {
  const n = Math.max(2, Math.floor(7 * (1 - eat)));
  for (let i = 0; i < n; i++) {
    const a = -0.9 + i * 0.35 + rng() * 0.1;
    const [x, y] = ellipsePt(cx, cy + 6, rx * (0.35 + rng() * 0.35), ry * (0.3 + rng() * 0.3), a);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6 + rng() * 0.9);
    const w = 38 + rng() * 18;
    const h = 16 + rng() * 8;
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, h);
    g.addColorStop(0, "#6a2e18");
    g.addColorStop(0.35, "#a85028");
    g.addColorStop(0.55, "#e8b090");
    g.addColorStop(0.7, "#8a3818");
    g.addColorStop(1, "#4a1c0c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,180,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -2);
    ctx.quadraticCurveTo(0, -h * 0.4, w * 0.25, 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, 3);
    ctx.lineTo(w * 0.15, 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(-w * 0.15, -h * 0.15, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawNegi(ctx, rng, cx, cy, rx, ry, eat) {
  const n = Math.max(3, Math.floor(14 * (1 - eat * 0.7)));
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const r = rng() * 0.7;
    const x = cx + Math.cos(a) * rx * r * 0.85;
    const y = cy + Math.sin(a) * ry * r * 0.75;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rng() * Math.PI);
    const L = 10 + rng() * 10;
    const g = ctx.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, "#f2efe4");
    g.addColorStop(0.35, "#d4e8a8");
    g.addColorStop(1, "#3a8a3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, 3.4);
    ctx.fillStyle = "#2e6a2e";
    ctx.fillRect(L * 0.7, 0, 1, 3.4);
    ctx.restore();
  }
}

function drawEgg(ctx, cx, cy, eat) {
  if (eat > 0.6) return;
  ctx.save();
  ctx.translate(cx + 70, cy + 10);
  ctx.rotate(-0.4);
  ctx.fillStyle = "#5a4030";
  ctx.beginPath();
  ctx.ellipse(0, 2, 34, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0e6d4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  const yolk = ctx.createRadialGradient(-2, -2, 2, 0, 0, 14);
  yolk.addColorStop(0, "#ffe27a");
  yolk.addColorStop(0.6, "#e0a020");
  yolk.addColorStop(1, "#c47818");
  ctx.fillStyle = yolk;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(-8, -6, 5, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNori(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx - 80, cy - 8);
  ctx.rotate(-0.2);
  ctx.fillStyle = "#142418";
  ctx.fillRect(0, 0, 28, 46);
  ctx.fillStyle = "#1e3a28";
  ctx.fillRect(2, 2, 24, 42);
  ctx.fillStyle = "rgba(180,220,160,0.25)";
  ctx.fillRect(4, 6, 8, 3);
  ctx.restore();
}

function drawTempura(ctx, cx, cy, t) {
  ctx.save();
  ctx.translate(cx - 40, cy - 20);
  ctx.rotate(-0.5 + Math.sin(t / 800) * 0.02);
  ctx.fillStyle = "#c47a20";
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c060";
  ctx.beginPath();
  ctx.ellipse(-2, 8, 14, 24, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.ellipse(-6, 0, 5, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e87890";
  ctx.beginPath();
  ctx.ellipse(0, -22, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawKamaboko(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx + 50, cy - 30);
  ctx.fillStyle = "#f4eef2";
  ctx.beginPath();
  ctx.moveTo(-16, 10);
  ctx.quadraticCurveTo(0, -16, 16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e07090";
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.quadraticCurveTo(0, -12, 14, 8);
  ctx.quadraticCurveTo(0, -4, -14, 8);
  ctx.fill();
  ctx.restore();
}

function drawIce(ctx, rng, cx, cy, rx, ry, t) {
  for (let i = 0; i < 4; i++) {
    const x = cx + (i - 1.5) * 28 + Math.sin(t / 900 + i) * 2;
    const y = cy - 18 + (i % 2) * 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.2 * i);
    const g = ctx.createLinearGradient(-12, -10, 14, 12);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.4, "rgba(190, 220, 235, 0.7)");
    g.addColorStop(1, "rgba(120, 160, 190, 0.55)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-4, -14);
    ctx.lineTo(12, -8);
    ctx.lineTo(10, 10);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.stroke();
    ctx.restore();
  }
}

function drawChiliFlakes(ctx, rng, cx, cy, rx, ry) {
  for (let i = 0; i < 22; i++) {
    const a = rng() * Math.PI * 2;
    const r = rng() * 0.75;
    ctx.fillStyle = rng() > 0.5 ? "#c42818" : "#8a1408";
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r);
    ctx.rotate(rng() * 6);
    ctx.fillRect(0, 0, 3 + rng() * 3, 1.4);
    ctx.restore();
  }
}

function drawSesame(ctx, rng, cx, cy, rx, ry) {
  for (let i = 0; i < 18; i++) {
    const a = rng() * Math.PI * 2;
    const r = rng() * 0.7;
    ctx.fillStyle = rng() > 0.5 ? "#f4e0b0" : "#4a3020";
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 1.6, 1.1, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSteam(ctx, cx, cy, t) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const u = (t / 900 + i * 0.16) % 1;
    ctx.globalAlpha = (1 - u) * 0.28;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(cx - 30 + i * 14 + Math.sin(t / 300 + i) * 8, cy - 70 - u * 70, 10 + u * 8, 16 + u * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawFrost(ctx, cx, cy, rx, ry, t) {
  ctx.save();
  ctx.strokeStyle = "rgba(220,235,255,0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 1, ry + 1, 0, 0.15, 1.2);
  ctx.stroke();
  ctx.ellipse(cx, cy, rx + 1, ry + 1, 0, 0.2, 2.4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 10; i++) {
    const a = i * 0.5 + t / 5000;
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t / 400 + i);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (rx + 10), cy + Math.sin(a) * (ry + 12), 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTray(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 40, 0, h);
  g.addColorStop(0, "#7a2418");
  g.addColorStop(0.4, "#4a120c");
  g.addColorStop(1, "#2a0c08");
  ctx.fillStyle = g;
  roundRect(ctx, 48, 70, w - 96, h - 130, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(212, 160, 70, 0.65)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 180, 200, 0.8)";
  for (const p of [[90, 100], [420, 120], [110, 430], [400, 410], [260, 86]]) {
    ctx.beginPath();
    ctx.ellipse(p[0], p[1], 6, 4, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawChopsticks(ctx, cx, cy, lift, t) {
  const grab = lift > 0;
  ctx.save();
  if (grab) {
    ctx.translate(cx + 55, cy - 36 - lift * 64);
    ctx.rotate(-0.85 - lift * 0.15);
  } else {
    ctx.translate(cx + 188, cy + 78);
    ctx.rotate(-1.22);
  }
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i ? "#7a4a24" : "#e0b068";
    ctx.save();
    ctx.translate(i * 9, i * 5);
    ctx.fillRect(0, 0, 7, grab ? 150 : 118);
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(0, grab ? 130 : 100, 7, 18);
    ctx.restore();
  }
  ctx.restore();
  if (grab) {
    const bundle = [
      [cx + 10, cy - 10 - lift * 40],
      [cx + 30, cy - 50 - lift * 55],
      [cx + 55, cy - 30 - lift * 48],
    ];
    for (const [x, y] of bundle) {
      strokeStrand(
        ctx,
        [
          [cx, cy + 10],
          [x - 10, (cy + y) / 2],
          [x, y],
        ],
        7,
        "#f0e2c4",
        0.95
      );
      strokeStrand(
        ctx,
        [
          [cx, cy + 10],
          [x - 10, (cy + y) / 2],
          [x, y],
        ],
        2,
        "#fffaf0",
        0.5
      );
    }
    ctx.fillStyle = "rgba(160, 30, 12, 0.55)";
    ctx.beginPath();
    ctx.ellipse(cx + 40, cy - 20 - lift * 30, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderUdon(canvas, recipe, t, eat, lift = 0) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const wood = ctx.createLinearGradient(0, 0, 0, h);
  wood.addColorStop(0, "#c9a06a");
  wood.addColorStop(1, "#8a5a32");
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 14) {
    ctx.fillStyle = "rgba(80,40,16,0.08)";
    ctx.fillRect(0, y, w, 2);
  }
  ctx.save();
  const scale = Math.min(w, h) / 560;
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-280, -280);
  drawTray(ctx, 560, 560);

  const cx = 280;
  const cy = 298;
  const rx = 168;
  const ry = 112;
  const has = (id) => recipe.items.has(id);
  const rng = mulberry(hashRecipe(recipe));
  const info = detectRecipe(recipe);

  drawBowlCeramic(ctx, cx, cy, rx, ry, recipe.temp === "cold");
  if (has("udon") || has("dashi") || has("tsuyu") || has("chili_oil")) {
    drawBroth(ctx, recipe, cx, cy, rx, ry, eat, t);
  }
  if (has("udon")) {
    const strands = makeStrands(rng, 62, cx, cy + 6, rx * 0.82, ry * 0.72, eat);
    drawNoodles(ctx, strands, eat, has("chili_oil") || has("togarashi"));
  }
  if (has("nori")) drawNori(ctx, cx, cy);
  if (has("niku")) drawBeef(ctx, rng, cx, cy, rx, ry, eat, t);
  if (has("egg")) drawEgg(ctx, cx, cy, eat);
  if (has("tempura")) drawTempura(ctx, cx, cy, t);
  if (has("kamaboko")) drawKamaboko(ctx, cx, cy);
  if (has("negi")) drawNegi(ctx, rng, cx, cy, rx, ry, eat);
  if (has("chili_oil") || has("togarashi")) drawChiliFlakes(ctx, rng, cx, cy, rx * 0.8, ry * 0.7);
  if (has("sesame")) drawSesame(ctx, rng, cx, cy, rx * 0.8, ry * 0.7);
  if (has("ice") || (recipe.temp === "cold" && has("udon"))) drawIce(ctx, rng, cx, cy, rx, ry, t);
  if (recipe.temp === "hot" && (has("udon") || has("dashi"))) drawSteam(ctx, cx, cy, t);
  if (recipe.temp === "cold") drawFrost(ctx, cx, cy, rx, ry, t);

  drawChopsticks(ctx, cx, cy, lift, t);

  if (info.id === "cold_niku_spicy" && eat < 0.9) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t / 200);
    ctx.fillStyle = "#fff8e0";
    for (let i = 0; i < 5; i++) {
      const a = t / 400 + i * 1.2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 90, cy - 20 + Math.sin(a * 1.3) * 40, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
  return info;
}

function drawShopIcon(ctx, id) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#1a100e";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const recipe = { temp: id === "ice" ? "cold" : "hot", items: new Set(["udon", id]) };
  if (id === "udon") recipe.items = new Set(["udon"]);
  renderUdon(ctx.canvas, recipe, 0, 0, 0);
}
