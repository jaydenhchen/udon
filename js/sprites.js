const TILE = 16;

const C = {
  ink: "#2a1810",
  skin: "#f0c4a0",
  blush: "#f4a0a8",
  hair: "#2b1c14",
  hair2: "#4a3022",
};

function px(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x | 0, y | 0, w, h);
}

function pset(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function blitMap(ctx, rows, pal, ox = 0, oy = 0) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const col = pal[ch];
      if (col) pset(ctx, ox + x, oy + y, col);
    }
  }
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return { c, g };
}

/* ---- ground tiles ---- */
function tileGrass(g, v) {
  px(g, 0, 0, 16, 16, v ? "#4f9a48" : "#4a9344");
  px(g, 0, 0, 16, 16, v ? "#4f9a48" : "#4a9344");
  const dots = v
    ? [[1, 2], [8, 1], [12, 7], [3, 11], [9, 13], [14, 4]]
    : [[2, 4], [7, 2], [13, 6], [4, 9], [10, 12], [6, 7]];
  g.fillStyle = "#3d7d38";
  for (const [x, y] of dots) g.fillRect(x, y, 1, 1);
  g.fillStyle = "#6ab35a";
  g.fillRect(5, 5, 1, 1);
  g.fillRect(11, 9, 1, 1);
  if (v) {
    pset(g, 4, 3, "#f4c2d0");
    pset(g, 5, 3, "#fff0f4");
    pset(g, 4, 2, "#f4c2d0");
  }
}

function tilePath(g) {
  px(g, 0, 0, 16, 16, "#cbb48a");
  px(g, 0, 0, 16, 1, "#d8c4a0");
  g.fillStyle = "#b39a70";
  for (const [x, y] of [[2, 3], [8, 2], [13, 5], [4, 8], [10, 10], [6, 13], [14, 12], [1, 11]]) {
    g.fillRect(x, y, 2, 1);
  }
  pset(g, 7, 6, "#efe0c0");
  pset(g, 12, 9, "#efe0c0");
}

function tileStone(g) {
  px(g, 0, 0, 16, 16, "#9aa4a8");
  px(g, 0, 0, 16, 1, "#c5cdd0");
  px(g, 0, 8, 16, 1, "#7e888c");
  px(g, 8, 0, 1, 16, "#7e888c");
  pset(g, 3, 3, "#d5dde0");
  pset(g, 12, 12, "#6a7276");
}

function tileWater(g, f) {
  px(g, 0, 0, 16, 16, f ? "#3b86b0" : "#347aa4");
  g.fillStyle = "#7ec8e8";
  const y = f ? 4 : 6;
  g.fillRect(2, y, 5, 1);
  g.fillRect(9, y + 5, 5, 1);
  g.fillStyle = "#2a5f86";
  g.fillRect(1, 12, 6, 1);
  pset(g, f ? 12 : 4, f ? 3 : 9, "#e8f8ff");
}

function tileWood(g) {
  px(g, 0, 0, 16, 16, "#c48a52");
  px(g, 0, 5, 16, 1, "#a86c3c");
  px(g, 0, 11, 16, 1, "#a86c3c");
  px(g, 0, 0, 16, 1, "#e0b078");
  pset(g, 3, 2, "#8a542c");
  pset(g, 11, 7, "#8a542c");
  pset(g, 6, 13, "#8a542c");
}

function tileTatami(g) {
  px(g, 0, 0, 16, 16, "#d2c05a");
  for (let y = 1; y < 16; y += 2) {
    px(g, 1, y, 14, 1, "#c4b24e");
  }
  px(g, 0, 0, 2, 16, "#2a2418");
  px(g, 14, 0, 2, 16, "#2a2418");
  pset(g, 4, 4, "#e8d878");
}

function tileDirt(g) {
  px(g, 0, 0, 16, 16, "#8a6a40");
  g.fillStyle = "#6e5230";
  g.fillRect(3, 4, 2, 1);
  g.fillRect(10, 9, 2, 1);
  g.fillRect(6, 13, 2, 1);
  pset(g, 13, 3, "#c4a070");
}

function tileShopFloor(g) {
  px(g, 0, 0, 16, 16, "#b07848");
  px(g, 0, 7, 16, 1, "#8e5c34");
  px(g, 0, 0, 16, 1, "#d4a070");
}

const ATLAS = makeCanvas(16 * 16, 16 * 3);

function buildAtlas() {
  const { g } = ATLAS;
  const draw = (id, fn) => {
    g.save();
    g.translate((id % 16) * 16, Math.floor(id / 16) * 16);
    fn(g);
    g.restore();
  };
  draw(0, (x) => tileGrass(x, false));
  draw(1, (x) => tileGrass(x, true));
  draw(2, tilePath);
  draw(3, tileStone);
  draw(4, (x) => tileWater(x, false));
  draw(5, tileWood);
  draw(6, tileTatami);
  draw(7, tileDirt);
  draw(8, tileShopFloor);
  draw(9, (x) => tileWater(x, true));
}

function drawTile(ctx, id, x, y) {
  const sx = (id % 16) * 16;
  const sy = Math.floor(id / 16) * 16;
  ctx.drawImage(ATLAS.c, sx, sy, 16, 16, x, y, 16, 16);
}

/* ---- people (16x24 kimono) ---- */
const PAL_PLAYER = {
  h: "#2a1810",
  H: "#4a3020",
  s: "#f0c4a0",
  e: "#1a1010",
  b: "#f09098",
  k: "#2c4a8c",
  K: "#1c3268",
  o: "#c44536",
  O: "#8e2418",
  w: "#f4ece0",
  f: "#5a3a22",
  g: "#3a2818",
};

const PAL_PINK = { ...PAL_PLAYER, k: "#e07a94", K: "#c45a74", o: "#d7b15c", O: "#a88830" };
const PAL_ELDER = { ...PAL_PLAYER, h: "#c8c0b4", H: "#a8a090", k: "#5a4a3a", K: "#3e3228", o: "#6a3030" };
const PAL_SHOP = { ...PAL_PLAYER, k: "#c44536", K: "#8e2418", o: "#2a1810", w: "#f4ece0", h: "#1a1010" };
const PAL_CHILD = { ...PAL_PLAYER, k: "#e8c04a", K: "#c49828", o: "#2c4a8c", h: "#5a3020" };
const PAL_BLUE = { ...PAL_PLAYER, k: "#3a6a8c", K: "#1e4460", o: "#d7b15c", O: "#a88830" };
const PAL_GREEN = { ...PAL_PLAYER, k: "#3d7a48", K: "#285830", o: "#c44536", O: "#8e2418" };
const PAL_PURPLE = { ...PAL_PLAYER, k: "#6a4a8c", K: "#4a2e68", o: "#e8c04a", O: "#c49828" };
const PAL_TEAL = { ...PAL_PLAYER, k: "#2e6e6a", K: "#1a4a48", o: "#e07a94", O: "#c45a74", h: "#3a2418" };

function personMaps(dir, frame) {
  const walk = frame % 2;
  if (dir === "down") {
    return walk
      ? [
          "....hhhhhh....",
          "...hhhhhhhh...",
          "...hssssssh...",
          "...sseesse...",
          "....sbbss.....",
          ".....ssss.....",
          "....wwwwww....",
          "...kkkkkkkk...",
          "..kkkkkkkkkk..",
          "..kkkkooookk..",
          "..kkkkkkkkkk..",
          "..kkkkkkkkkk..",
          "...kkkkkkkk...",
          "...kkk..kkk...",
          "...kk....kkk..",
          "....f......g..",
        ]
      : [
          "....hhhhhh....",
          "...hhhhhhhh...",
          "...hssssssh...",
          "...sseesse...",
          "....sbbss.....",
          ".....ssss.....",
          "....wwwwww....",
          "...kkkkkkkk...",
          "..kkkkkkkkkk..",
          "..kkkkooookk..",
          "..kkkkkkkkkk..",
          "..kkkkkkkkkk..",
          "...kkkkkkkk...",
          "...kkk..kkk...",
          "..kkk....kk...",
          "..g......f....",
        ];
  }
  if (dir === "up") {
    return [
      "....hhhhhh....",
      "...hhhhhhhh...",
      "...hhhhhhhh...",
      "...hhhhhhhh...",
      "....hhhhhh....",
      ".....ssss.....",
      "....wwwwww....",
      "...kkkkkkkk...",
      "..kkkkkkkkkk..",
      "..kkkkooookk..",
      "..kkkkkkkkkk..",
      "..kkkkkkkkkk..",
      "...kkkkkkkk...",
      "...kkk..kkk...",
      walk ? "...kk....kkk.." : "..kkk....kk...",
      walk ? "....f......g.." : "..g......f....",
    ];
  }
  // side
  return walk
    ? [
        ".....hhhhh....",
        "....hhhhhhh...",
        "....hhssssh...",
        "....hsssess...",
        ".....sbsss....",
        "......sss.....",
        "....wwwwww....",
        "...kkkkkkkk...",
        "..kkkkkkkkkk..",
        "..kkkooookkk..",
        "..kkkkkkkkkk..",
        "...kkkkkkkk...",
        "...kkkkkkkk...",
        "....kkk.kk....",
        "....kk...k....",
        ".....f...g....",
      ]
    : [
        ".....hhhhh....",
        "....hhhhhhh...",
        "....hhssssh...",
        "....hsssess...",
        ".....sbsss....",
        "......sss.....",
        "....wwwwww....",
        "...kkkkkkkk...",
        "..kkkkkkkkkk..",
        "..kkkooookkk..",
        "..kkkkkkkkkk..",
        "...kkkkkkkk...",
        "...kkkkkkkk...",
        "....kk.kkk....",
        "....k...kk....",
        ".....g...f....",
      ];
}

function sitMaps(dir) {
  if (dir === "down") {
    return [
      "..............",
      "....hhhhhh....",
      "...hhhhhhhh...",
      "...hssssssh...",
      "...sseesse...",
      "....sbbss.....",
      ".....ssss.....",
      "....wwwwww....",
      "...kkkkkkkk...",
      "..kkkkkkkkkk..",
      "..kkkkooookk..",
      ".kkkkkkkkkkkk.",
      "kkkkkkkkkkkkkk",
      ".kkkkkkkkkkkk.",
      "..kkk....kkk..",
      "..............",
    ];
  }
  if (dir === "up") {
    return [
      "..............",
      "....hhhhhh....",
      "...hhhhhhhh...",
      "...hhhhhhhh...",
      "...hhhhhhhh...",
      "....hhhhhh....",
      ".....ssss.....",
      "....wwwwww....",
      "...kkkkkkkk...",
      "..kkkkkkkkkk..",
      "..kkkkooookk..",
      ".kkkkkkkkkkkk.",
      "kkkkkkkkkkkkkk",
      ".kkkkkkkkkkkk.",
      "..kkk....kkk..",
      "..............",
    ];
  }
  return [
    "..............",
    ".....hhhhh....",
    "....hhhhhhh...",
    "....hhssssh...",
    "....hsssess...",
    ".....sbsss....",
    "......sss.....",
    "....wwwwww....",
    "...kkkkkkkk...",
    "..kkkkkkkkkk..",
    "..kkkooookkk..",
    ".kkkkkkkkkkk..",
    "kkkkkkkkkkkk..",
    ".kkkkkkkkkk...",
    "..kkkk..kkk...",
    "..............",
  ];
}

const personCache = new Map();

function personSheet(pal) {
  const key = JSON.stringify(pal);
  if (personCache.has(key)) return personCache.get(key);
  const dirs = ["down", "up", "left", "right"];
  const sheet = { sit: {} };
  for (const dir of dirs) {
    sheet[dir] = [];
    for (let f = 0; f < 2; f++) {
      const { c, g } = makeCanvas(16, 16);
      let rows = personMaps(dir === "right" ? "left" : dir, f);
      if (dir === "right") rows = rows.map((r) => [...r].reverse().join(""));
      blitMap(g, rows, pal);
      sheet[dir][f] = c;
    }
    const { c, g } = makeCanvas(16, 16);
    let rows = sitMaps(dir === "right" ? "left" : dir);
    if (dir === "right") rows = rows.map((r) => [...r].reverse().join(""));
    blitMap(g, rows, pal);
    sheet.sit[dir] = c;
  }
  personCache.set(key, sheet);
  return sheet;
}

function drawPerson(ctx, x, y, dir, frame, pal, sit) {
  const sheet = personSheet(pal);
  if (sit) {
    ctx.drawImage(sheet.sit[dir] || sheet.sit.down, Math.round(x), Math.round(y) + 1);
    return;
  }
  const img = sheet[dir][frame & 1];
  ctx.drawImage(img, Math.round(x), Math.round(y) - 4);
}

function drawCat(ctx, x, y, t) {
  const tail = Math.sin(t / 220) > 0;
  const rows = [
    "..oooo........",
    ".owowo........",
    ".owwwo........",
    ".ow0wo........",
    "..ooo...s.....",
    "..o.o.." + (tail ? "ss." : ".ss") + "...",
  ];
  blitMap(ctx, rows, { o: "#e8a048", w: "#fff4e4", 0: "#201008", s: "#e8a048" }, Math.round(x), Math.round(y) + 4);
}

function blob(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function petal(ctx, x, y, s, rot, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, -s * 0.1, s * 0.28, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, px, py, big, t = 0) {
  px = Math.round(px);
  py = Math.round(py);
  const sway = Math.sin((t || 0) / 740 + px * 0.05) * (big ? 2.1 : 1.1);
  const R = big ? 1.15 : 0.82;
  const trunkH = big ? 26 : 18;
  const cx = px + 8 + sway;
  const cy = py - (big ? 14 : 8);

  ctx.fillStyle = "rgba(36, 18, 12, 0.22)";
  ctx.beginPath();
  ctx.ellipse(px + 8, py + 16, big ? 14 : 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2414";
  ctx.fillRect(px + 6, py + 2, 5, trunkH);
  ctx.fillStyle = "#6a4428";
  ctx.fillRect(px + 7, py + 2, 2, trunkH);
  ctx.fillStyle = "#2a1810";
  ctx.fillRect(px + 10, py + 2, 1, trunkH);
  ctx.fillStyle = "#5a3820";
  ctx.fillRect(px + 3, py + 7, 5, 3);
  ctx.fillRect(px + 10, py + 10, 6, 3);
  ctx.fillStyle = "#4a2e18";
  ctx.fillRect(px + 2, py + 8, 4, 2);
  ctx.fillRect(px + 11, py + 11, 5, 2);
  ctx.fillStyle = "#2e1c10";
  ctx.fillRect(px + 4, py + trunkH, 4, 2);
  ctx.fillRect(px + 9, py + trunkH, 4, 2);
  ctx.fillStyle = "#3d7d38";
  ctx.fillRect(px + 3, py + trunkH + 1, 3, 2);
  ctx.fillRect(px + 10, py + trunkH + 1, 3, 2);

  blob(ctx, cx, cy + 8, 18 * R, 13 * R, "#8a3050");
  blob(ctx, cx - 12 * R, cy + 5, 14 * R, 11 * R, "#c45a78");
  blob(ctx, cx + 13 * R, cy + 4, 15 * R, 12 * R, "#e07898");
  blob(ctx, cx, cy - 6, 15 * R, 12 * R, "#f4b0c4");
  blob(ctx, cx - 8 * R, cy - 2, 11 * R, 9 * R, "#ffe0ea");
  blob(ctx, cx + 9 * R, cy + 10, 12 * R, 8 * R, "#d06088");
  blob(ctx, cx + 2 * R, cy + 2, 10 * R, 8 * R, "#ffc8d8");
  blob(ctx, cx - 14 * R, cy + 10, 9 * R, 7 * R, "#e890a8");
  blob(ctx, cx + 15 * R, cy - 2, 9 * R, 7 * R, "#fff0f5");

  const n = big ? 22 : 13;
  for (let i = 0; i < n; i++) {
    const a = i * 2.15 + (t || 0) / 820;
    petal(
      ctx,
      cx + Math.cos(a) * 14 * R,
      cy + Math.sin(a * 1.35) * 10 * R,
      big ? 2.8 : 2.0,
      a + 0.4,
      i % 3 === 0 ? "#fff8fb" : i % 3 === 1 ? "#ffd0dc" : "#f4a8bc"
    );
  }
  for (let i = 0; i < (big ? 6 : 3); i++) {
    const a = i * 1.7 + (t || 0) / 400;
    petal(ctx, cx + Math.sin(a) * 8, py + 12 + (i % 3) * 2, 1.6, a, "#ffd4e0");
  }
  ctx.fillStyle = "#fff8fb";
  ctx.fillRect(Math.round(cx - 5), Math.round(cy - 8), 3, 2);
  ctx.fillRect(Math.round(cx + 6), Math.round(cy - 3), 2, 2);
  ctx.fillRect(Math.round(cx - 1), Math.round(cy + 3), 2, 1);
}

function toriiSpec(size) {
  if (size === "grand") return { w: 256, h: 128, post: 12, kasagi: 18, tilesW: 16, tilesH: 8, beam: 2 };
  return { w: 160, h: 80, post: 10, kasagi: 14, tilesW: 10, tilesH: 5, beam: 2 };
}

function drawShimenawa(ctx, x, y, w) {
  ctx.strokeStyle = "#c8a868";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const bumps = Math.max(6, Math.floor(w / 12));
  for (let i = 0; i <= bumps; i++) {
    const px = x + (w * i) / bumps;
    const py = y + Math.sin(i * 1.15) * 2.4;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = "#f4e8c8";
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 1; i < bumps; i += 2) {
    const sx = x + (w * i) / bumps;
    const dip = Math.sin(i * 1.15) * 2.4;
    ctx.fillStyle = "#f7f1e4";
    ctx.fillRect(sx - 1, y + dip + 3, 2, 8);
    ctx.fillRect(sx - 4, y + dip + 8, 8, 2);
    ctx.fillRect(sx - 3, y + dip + 10, 6, 2);
    ctx.fillRect(sx - 2, y + dip + 12, 4, 2);
  }
}

function drawTorii(ctx, x, y, size = "grand", part = "all") {
  x = Math.round(x);
  y = Math.round(y);
  const spec = toriiSpec(size);
  const w = spec.w;
  const h = spec.h;
  const postW = spec.post;
  const verm = "#d44532";
  const mid = "#c03a2c";
  const deep = "#7a1c14";
  const black = "#16100e";
  const gold = "#e4c45c";
  const hi = "#f4846c";
  const left = x + 14;
  const right = x + w - 14 - postW;
  const postTop = y + 22;
  const postH = h - 28;
  const lintel = part === "all" || part === "lintel";
  const posts = part === "all" || part === "posts";

  if (posts) {
    ctx.fillStyle = "rgba(28, 12, 10, 0.28)";
    ctx.fillRect(left - 4, y + h - 8, postW + 12, 8);
    ctx.fillRect(right - 4, y + h - 8, postW + 12, 8);

    px(ctx, left - 6, y + h - 12, postW + 12, 10, "#6a645c");
    px(ctx, left - 4, y + h - 14, postW + 8, 5, "#8a8480");
    px(ctx, left - 2, y + h - 16, postW + 4, 3, "#c8c4bc");
    px(ctx, right - 6, y + h - 12, postW + 12, 10, "#6a645c");
    px(ctx, right - 4, y + h - 14, postW + 8, 5, "#8a8480");
    px(ctx, right - 2, y + h - 16, postW + 4, 3, "#c8c4bc");

    px(ctx, left, postTop, postW, postH, mid);
    px(ctx, right, postTop, postW, postH, mid);
    px(ctx, left + 2, postTop, 4, postH, hi);
    px(ctx, right + 2, postTop, 4, postH, hi);
    px(ctx, left + postW - 3, postTop, 3, postH, deep);
    px(ctx, right + postW - 3, postTop, 3, postH, deep);
    px(ctx, left + 5, postTop + 8, 2, postH - 16, "rgba(255,220,200,0.18)");
    px(ctx, right + 5, postTop + 8, 2, postH - 16, "rgba(255,220,200,0.18)");

    for (let gy = postTop + 10; gy < postTop + postH - 12; gy += 16) {
      px(ctx, left - 2, gy, postW + 4, 4, gold);
      px(ctx, right - 2, gy, postW + 4, 4, gold);
      px(ctx, left, gy + 1, postW, 1, "#fff3b8");
      px(ctx, right, gy + 1, postW, 1, "#fff3b8");
      px(ctx, left - 1, gy + 3, postW + 2, 1, "#a88828");
      px(ctx, right - 1, gy + 3, postW + 2, 1, "#a88828");
    }
  }

  if (lintel) {
    const nukiY = y + 42;
    px(ctx, left - 4, nukiY, right - left + postW + 8, 8, mid);
    px(ctx, left - 4, nukiY, right - left + postW + 8, 2, hi);
    px(ctx, left - 4, nukiY + 6, right - left + postW + 8, 2, deep);
    px(ctx, left - 4, nukiY + 3, right - left + postW + 8, 1, gold);

    const tabletW = size === "grand" ? 22 : 14;
    const tabletX = x + w / 2 - tabletW / 2;
    px(ctx, tabletX, nukiY - 14, tabletW, 20, black);
    px(ctx, tabletX + 2, nukiY - 12, tabletW - 4, 16, "#2c1a12");
    px(ctx, tabletX + tabletW / 2 - 3, nukiY - 8, 6, 10, gold);
    px(ctx, tabletX + tabletW / 2 - 2, nukiY - 7, 4, 8, "#fff0b0");

    const kasagiY = y + 6;
    px(ctx, x + 10, kasagiY + 10, w - 20, spec.kasagi - 6, mid);
    px(ctx, x + 10, kasagiY + 10, w - 20, 3, hi);
    px(ctx, x + 6, kasagiY + 4, w - 12, 10, verm);
    px(ctx, x + 6, kasagiY + 4, w - 12, 3, hi);
    px(ctx, x + 4, kasagiY, w - 8, 7, verm);
    px(ctx, x + 4, kasagiY, w - 8, 2, "#ff9a88");

    px(ctx, x, kasagiY - 5, w, 6, black);
    px(ctx, x + 8, kasagiY - 9, w - 16, 5, black);
    px(ctx, x + 18, kasagiY - 12, w - 36, 4, black);
    px(ctx, x - 4, kasagiY - 2, 14, 5, black);
    px(ctx, x + w - 10, kasagiY - 2, 14, 5, black);
    px(ctx, x - 6, kasagiY + 2, 12, 6, verm);
    px(ctx, x + w - 6, kasagiY + 2, 12, 6, verm);
    px(ctx, x - 8, kasagiY - 10, 12, 5, black);
    px(ctx, x + w - 4, kasagiY - 10, 12, 5, black);
    px(ctx, x - 10, kasagiY - 6, 8, 4, black);
    px(ctx, x + w + 2, kasagiY - 6, 8, 4, black);

    px(ctx, x + 12, kasagiY + spec.kasagi + 4, w - 24, 5, black);
    px(ctx, x + 16, kasagiY + spec.kasagi + 6, w - 32, 3, "#2a1810");

    drawShimenawa(ctx, left + postW + 6, kasagiY + spec.kasagi + 10, right - left - postW - 12);

    if (size === "grand") {
      px(ctx, left + 3, y + 56, 7, 10, "#f4ece0");
      px(ctx, right + 3, y + 56, 7, 10, "#f4ece0");
      px(ctx, left + 4, y + 58, 5, 6, "#c03a2c");
      px(ctx, right + 4, y + 58, 5, 6, "#c03a2c");
      px(ctx, x + w / 2 - 3, kasagiY - 14, 6, 3, gold);
      px(ctx, x + w / 2 - 2, kasagiY - 16, 4, 2, "#fff0b0");
      const hang = [x + 48, x + w / 2, x + w - 56];
      for (const hx of hang) {
        px(ctx, hx, kasagiY + spec.kasagi + 12, 2, 10, "#3a2818");
        px(ctx, hx - 4, kasagiY + spec.kasagi + 20, 10, 12, "#e25a48");
        px(ctx, hx - 3, kasagiY + spec.kasagi + 22, 8, 8, "#f07860");
        px(ctx, hx - 2, kasagiY + spec.kasagi + 25, 6, 2, "#f4ece0");
      }
    } else {
      const hang = [x + 36, x + w - 44];
      for (const hx of hang) {
        px(ctx, hx, kasagiY + spec.kasagi + 10, 1, 8, "#3a2818");
        px(ctx, hx - 3, kasagiY + spec.kasagi + 16, 8, 10, "#e25a48");
        px(ctx, hx - 2, kasagiY + spec.kasagi + 18, 6, 6, "#f07860");
        px(ctx, hx - 1, kasagiY + spec.kasagi + 21, 4, 1, "#f4ece0");
      }
    }
  }
}

function drawHouse(ctx, x, y, kind) {
  x = Math.round(x);
  y = Math.round(y);
  const w = 7 * TILE;
  const h = 5 * TILE;
  px(ctx, x, y + 22, w + 8, h - 16, "#2e1c12");
  px(ctx, x + 4, y + 26, w, h - 22, "#f6ead6");
  px(ctx, x + 4, y + 26, 5, h - 22, "#6b4428");
  px(ctx, x + w - 1, y + 26, 5, h - 22, "#6b4428");
  px(ctx, x + 4, y + 40, w, 3, "#8a5a32");
  px(ctx, x + 12, y + 30, 16, 16, "#fffaf0");
  px(ctx, x + 12, y + 30, 16, 1, "#6b4428");
  px(ctx, x + 12, y + 38, 16, 1, "#6b4428");
  px(ctx, x + 12, y + 30, 1, 16, "#6b4428");
  px(ctx, x + 20, y + 30, 1, 16, "#6b4428");
  px(ctx, x + 27, y + 30, 1, 16, "#6b4428");
  px(ctx, x + 14, y + 32, 3, 4, "#c4dce8");
  px(ctx, x + 22, y + 32, 3, 4, "#c4dce8");
  const doorX = x + Math.floor(w / 2) - 8;
  px(ctx, x + 4, y + h - 18, w, 8, "#8a5a32");
  px(ctx, doorX, y + h - 22, 18, 18, "#4a2e18");
  px(ctx, doorX + 1, y + h - 21, 7, 16, "#d4b080");
  px(ctx, doorX + 10, y + h - 21, 7, 16, "#d4b080");
  px(ctx, doorX + 8, y + h - 21, 2, 16, "#3a2010");
  if (kind === "shop") {
    px(ctx, doorX - 14, y + h - 36, 46, 14, "#1e2e58");
    px(ctx, doorX - 14, y + h - 36, 46, 3, "#0e182e");
    ctx.fillStyle = "#f4ece0";
    ctx.fillRect(doorX - 4, y + h - 32, 3, 8);
    ctx.fillRect(doorX + 8, y + h - 32, 3, 8);
    ctx.fillRect(doorX + 20, y + h - 32, 3, 8);
    px(ctx, doorX - 10, y + h - 28, 38, 3, "#c44536");
  } else {
    px(ctx, doorX - 12, y + h - 34, 42, 10, "#c44536");
    px(ctx, doorX - 10, y + h - 32, 3, 6, "#f4ece0");
    px(ctx, doorX + 6, y + h - 32, 3, 6, "#f4ece0");
    px(ctx, doorX + 18, y + h - 32, 3, 6, "#f4ece0");
  }
  px(ctx, x - 4, y + 16, w + 16, 16, "#2a262c");
  for (let i = 0; i < 10; i++) {
    px(ctx, x - 2 + i * 13, y + 18, 11, 3, i % 2 ? "#3a363c" : "#4a444c");
    px(ctx, x + i * 13, y + 22, 10, 2, "#1a161c");
  }
  px(ctx, x + 2, y + 8, w + 4, 12, "#3a363c");
  px(ctx, x + 14, y + 2, w - 20, 12, "#4a444c");
  px(ctx, x + 22, y - 2, w - 36, 8, "#5a545c");
  px(ctx, x + 6, y + 14, w - 4, 2, "#6a646c");
  px(ctx, x + 20, y + 4, 5, 5, kind === "player" ? "#c44536" : "#8a2418");
}

function drawLantern(ctx, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  px(ctx, x + 6, y + 10, 4, 12, "#5a5048");
  px(ctx, x + 1, y + 3, 14, 10, "#8a8480");
  px(ctx, x + 2, y + 4, 12, 8, "#f0e0b8");
  px(ctx, x + 3, y + 5, 10, 6, "#fff6d0");
  px(ctx, x + 4, y - 1, 8, 5, "#6a6660");
  px(ctx, x + 5, y, 6, 3, "#c8c0a8");
  pset(ctx, x + 7, y + 8, "#c44536");
  px(ctx, x + 4, y + 22, 8, 2, "#4a4440");
}

function drawChochin(ctx, x, y, t) {
  x = Math.round(x);
  y = Math.round(y);
  const glow = 0.55 + 0.22 * Math.sin((t || 0) / 240);
  ctx.fillStyle = `rgba(255, 140, 80, ${0.18 + glow * 0.2})`;
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 11, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, x + 7, y, 2, 4, "#3a2818");
  px(ctx, x + 2, y + 4, 12, 14, "#e25a48");
  px(ctx, x + 3, y + 5, 10, 12, "#f07860");
  px(ctx, x + 4, y + 8, 8, 2, "#f4ece0");
  px(ctx, x + 2, y + 4, 12, 1, "#2a1810");
  px(ctx, x + 2, y + 17, 12, 1, "#2a1810");
}

function drawRoofFence(ctx, x, y, n) {
  for (let i = 0; i < n; i++) {
    px(ctx, x + i * 8, y, 2, 10, "#5a4030");
    px(ctx, x + i * 8, y, 8, 2, "#5a4030");
  }
}

function drawZabuton(ctx, x, y, col) {
  x = Math.round(x);
  y = Math.round(y);
  const c = col || "#c44536";
  px(ctx, x, y + 10, 16, 6, "#3a2414");
  px(ctx, x + 1, y + 6, 14, 9, c);
  px(ctx, x + 2, y + 7, 12, 7, "#fff6ea");
  px(ctx, x + 3, y + 8, 10, 5, c);
  px(ctx, x + 4, y + 9, 8, 3, "#fff0e0");
  px(ctx, x + 5, y + 10, 6, 1, c);
  pset(ctx, x + 1, y + 7, "#d7b15c");
  pset(ctx, x + 14, y + 7, "#d7b15c");
  pset(ctx, x + 1, y + 13, "#d7b15c");
  pset(ctx, x + 14, y + 13, "#d7b15c");
  px(ctx, x + 2, y + 14, 3, 2, "#c8a050");
  px(ctx, x + 11, y + 14, 3, 2, "#c8a050");
}

function drawLowTable(ctx, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  px(ctx, x, y + 10, 32, 6, "#2a1810");
  px(ctx, x + 1, y + 5, 30, 8, "#5a3218");
  px(ctx, x + 2, y + 4, 28, 6, "#c48a52");
  px(ctx, x + 2, y + 4, 28, 2, "#f0c888");
  px(ctx, x + 3, y + 6, 26, 1, "#8a5428");
  px(ctx, x + 3, y + 12, 2, 5, "#2a1810");
  px(ctx, x + 27, y + 12, 2, 5, "#2a1810");
  px(ctx, x + 6, y + 1, 6, 5, "#f4ece0");
  px(ctx, x + 7, y, 4, 4, "#c44536");
  px(ctx, x + 8, y + 1, 2, 2, "#fff8ee");
  px(ctx, x + 20, y + 1, 6, 5, "#f4ece0");
  px(ctx, x + 21, y, 4, 4, "#283a6b");
  px(ctx, x + 13, y + 2, 6, 3, "#2a1810");
  px(ctx, x + 14, y + 1, 4, 2, "#1a1008");
  px(ctx, x + 15, y + 2, 2, 1, "#d7b15c");
}

function drawDais(ctx, x, y, tilesW, tilesH) {
  x = Math.round(x);
  y = Math.round(y);
  const w = tilesW * 16;
  const h = (tilesH || 2) * 16;
  px(ctx, x - 3, y + 2, w + 6, h + 6, "#2a1810");
  px(ctx, x - 1, y + 4, w + 2, h + 2, "#6a4428");
  px(ctx, x, y + 5, w, h, "#8a5a32");
  px(ctx, x, y + 5, w, 2, "#e0b078");
  px(ctx, x, y + h + 3, w, 3, "#3a2010");
  for (let i = 0; i < tilesW; i++) {
    px(ctx, x + i * 16, y + 5, 1, h, "#5a3218");
    px(ctx, x + i * 16 + 2, y + 8, 12, 1, "#c48a52");
  }
  px(ctx, x + 2, y + h, w - 4, 1, "#2a1810");
}

function drawNoren(ctx, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  px(ctx, x, y, 32, 3, "#2a1810");
  px(ctx, x + 1, y + 3, 9, 16, "#c44536");
  px(ctx, x + 11, y + 3, 10, 16, "#c44536");
  px(ctx, x + 22, y + 3, 9, 16, "#c44536");
  px(ctx, x + 3, y + 7, 5, 7, "#f4ece0");
  px(ctx, x + 13, y + 7, 6, 7, "#f4ece0");
  px(ctx, x + 24, y + 7, 5, 7, "#f4ece0");
}

function drawBasket(ctx, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  px(ctx, x + 2, y + 6, 12, 8, "#8a5a28");
  px(ctx, x + 3, y + 5, 10, 9, "#c48a48");
  px(ctx, x + 4, y + 7, 8, 5, "#e0b070");
  px(ctx, x + 5, y + 3, 3, 3, "#c44536");
  px(ctx, x + 9, y + 2, 3, 4, "#2e6e6a");
  px(ctx, x + 7, y + 4, 3, 3, "#e8c04a");
}

function drawButterfly(ctx, x, y, t, i) {
  const flap = Math.sin((t || 0) / 90 + i) > 0;
  const px_ = Math.round(x);
  const py_ = Math.round(y);
  ctx.fillStyle = i % 2 ? "#f4b3c2" : "#fff0f4";
  ctx.fillRect(px_ - (flap ? 3 : 1), py_, flap ? 3 : 1, 2);
  ctx.fillRect(px_ + 1, py_, flap ? 3 : 1, 2);
  ctx.fillStyle = "#2a1810";
  ctx.fillRect(px_, py_, 1, 3);
}

function drawKoi(ctx, x, y, t, i) {
  const u = (t / 900 + i * 0.37) % 1;
  const kx = x + Math.sin(u * Math.PI * 2 + i) * 5;
  const ky = y + Math.cos(u * Math.PI * 2 * 0.7) * 2;
  ctx.fillStyle = i % 2 ? "#e07048" : "#f4ece0";
  ctx.beginPath();
  ctx.ellipse(kx, ky, 4.5, 2.2, u * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = i % 2 ? "#f4ece0" : "#c44536";
  ctx.fillRect(Math.round(kx - 1), Math.round(ky - 1), 2, 1);
}

function drawBird(ctx, x, y, t) {
  const flap = Math.sin(t / 80) > 0;
  ctx.fillStyle = "#2a1810";
  ctx.fillRect(Math.round(x), Math.round(y), 3, 1);
  ctx.fillRect(Math.round(x + 1), Math.round(y - (flap ? 2 : 0)), 1, 2);
  ctx.fillRect(Math.round(x + 2), Math.round(y - (flap ? 1 : 0)), 2, 1);
}

function drawHeldBowl(ctx, x, y, t) {
  x = Math.round(x);
  y = Math.round(y + Math.sin((t || 0) / 180) * 1);
  px(ctx, x + 1, y + 6, 14, 4, "#3a2010");
  px(ctx, x + 2, y + 2, 12, 8, "#f4ece0");
  px(ctx, x + 3, y + 3, 10, 6, "#e8dcc8");
  px(ctx, x + 4, y + 4, 8, 4, "#c48a48");
  px(ctx, x + 5, y + 5, 6, 2, "#e07040");
  px(ctx, x + 6, y + 1, 4, 3, "#fff8ee");
  pset(ctx, x + 7, y + 6, "#fff0e0");
}

function drawBalloon(ctx, x, y, ch) {
  x = Math.round(x);
  y = Math.round(y);
  px(ctx, x + 2, y - 10, 12, 9, "#fffaf1");
  px(ctx, x + 6, y - 1, 3, 3, "#fffaf1");
  ctx.fillStyle = "#c44536";
  ctx.font = "7px sans-serif";
  ctx.fillText(ch, x + 5, y - 3);
}

const SPR = {
  TILE,
  buildAtlas,
  drawTile,
  drawPerson,
  drawCat,
  drawTree,
  drawTorii,
  drawHouse,
  drawLantern,
  drawChochin,
  drawRoofFence,
  drawZabuton,
  drawLowTable,
  drawDais,
  drawNoren,
  drawBasket,
  drawButterfly,
  drawKoi,
  drawBird,
  drawHeldBowl,
  drawBalloon,
  toriiSpec,
  PAL_PLAYER,
  PAL_PINK,
  PAL_ELDER,
  PAL_SHOP,
  PAL_CHILD,
  PAL_BLUE,
  PAL_GREEN,
  PAL_PURPLE,
  PAL_TEAL,
};
