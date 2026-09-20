const ITEMS = {
  udon: {
    id: "udon",
    name: "Fresh udon",
    jp: "うどん",
    price: 80,
    desc: "Thick Sanuki-style wheat noodles. Chewy, snow-white, made this morning.",
  },
  dashi: {
    id: "dashi",
    name: "Dashi broth",
    jp: "出汁",
    price: 50,
    desc: "Kombu and bonito. Golden, smoky, the soul of the bowl.",
  },
  tsuyu: {
    id: "tsuyu",
    name: "Tsuyu",
    jp: "つゆ",
    price: 40,
    desc: "Soy-dashi dipping sauce. Salty-sweet, for hot or cold.",
  },
  niku: {
    id: "niku",
    name: "Wagyu niku",
    jp: "肉",
    price: 220,
    desc: "Thin-sliced beef, marbled. Glazed with sweet soy until it shines.",
  },
  chili_oil: {
    id: "chili_oil",
    name: "Chili oil",
    jp: "ラー油",
    price: 70,
    desc: "Ruby rayu. It blooms on cold noodles like sunset on snow.",
  },
  togarashi: {
    id: "togarashi",
    name: "Shichimi",
    jp: "七味",
    price: 30,
    desc: "Seven-spice. Orange peel, chili, sesame, a little fire.",
  },
  negi: {
    id: "negi",
    name: "Spring onion",
    jp: "ねぎ",
    price: 20,
    desc: "Sharp green rings. The crunch that wakes a cold bowl.",
  },
  egg: {
    id: "egg",
    name: "Soy egg",
    jp: "味玉",
    price: 80,
    desc: "Jammy yolk, tea-stained white. It wants chili oil.",
  },
  nori: {
    id: "nori",
    name: "Nori",
    jp: "海苔",
    price: 30,
    desc: "Toasted seaweed. Briny, crisp, then silk on the tongue.",
  },
  tempura: {
    id: "tempura",
    name: "Shrimp tempura",
    jp: "海老天",
    price: 160,
    desc: "A golden curl of shrimp. Still whispering from the fryer.",
  },
  ice: {
    id: "ice",
    name: "Block ice",
    jp: "氷",
    price: 15,
    desc: "Clear as glass. For hiyashi — cold enough to make the bowl sweat.",
  },
  sesame: {
    id: "sesame",
    name: "Sesame",
    jp: "ごま",
    price: 25,
    desc: "Toasted seeds. Nutty perfume over spicy oil.",
  },
  kamaboko: {
    id: "kamaboko",
    name: "Kamaboko",
    jp: "かまぼこ",
    price: 60,
    desc: "Pink-and-white fish cake. A little festival on the rim.",
  },
};

const SHOP_ORDER = [
  "udon",
  "dashi",
  "tsuyu",
  "niku",
  "chili_oil",
  "togarashi",
  "negi",
  "egg",
  "nori",
  "tempura",
  "ice",
  "sesame",
  "kamaboko",
];

function grid(w, h, tile, solid) {
  const tiles = [];
  const collision = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    collision[y] = [];
    for (let x = 0; x < w; x++) {
      tiles[y][x] = tile;
      collision[y][x] = solid;
    }
  }
  return { w, h, tiles, collision, warps: [], interacts: [], npcs: [], decor: [], spawn: { x: 2, y: 2 } };
}

function fill(map, x, y, w, h, tile, solid) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= map.w || yy >= map.h) continue;
      map.tiles[yy][xx] = tile;
      if (solid !== undefined) map.collision[yy][xx] = solid;
    }
  }
}

function parseInterior(ascii, legend) {
  const rows = ascii.trim().split("\n");
  const w = Math.max(...rows.map((r) => r.length));
  for (let i = 0; i < rows.length; i++) rows[i] = rows[i].padEnd(w, "#");
  const h = rows.length;
  const map = grid(w, h, 5, false);
  map.warps = [];
  map.interacts = [];
  map.npcs = [];
  map.decor = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const spec = legend[rows[y][x]] || legend["."] || { tile: 5, solid: true };
      map.tiles[y][x] = spec.tile;
      map.collision[y][x] = !!spec.solid;
      if (spec.warp) map.warps.push({ x, y, ...spec.warp });
      if (spec.interact) map.interacts.push({ x, y, type: spec.interact });
      if (spec.spawn) map.spawn = { x, y };
    }
  }
  return map;
}
function makeHome() {
  const ascii = `
##################
#================#
#KKKKssKK========#
#================#
#==++============#
#==++==TTTTTTTT==#
#======zzzzzzzz==#
#========P=======#
#================#
########DD########
`.replace(/^\n/, "");
  const map = parseInterior(ascii, {
    "#": { tile: 5, solid: true },
    "=": { tile: 5, solid: false },
    "+": { tile: 5, solid: false },
    K: { tile: 5, solid: true },
    s: { tile: 5, solid: true, interact: "kitchen" },
    T: { tile: 5, solid: true, interact: "table" },
    z: { tile: 6, solid: false, interact: "seat" },
    P: { tile: 5, solid: false, spawn: true },
    D: { tile: 5, solid: false, warp: { map: "town", sx: 7, sy: 18 } },
    ".": { tile: 5, solid: false },
  });
  map.name = "home";
  map.floor = "wood";
  map.npcs = [];
  map.seats = [
    { x: 8, y: 6, dir: "up" },
    { x: 9, y: 6, dir: "up" },
    { x: 10, y: 6, dir: "up" },
    { x: 11, y: 6, dir: "up" },
    { x: 12, y: 6, dir: "up" },
    { x: 13, y: 6, dir: "up" },
    { x: 14, y: 6, dir: "up" },
    { x: 15, y: 6, dir: "up" },
  ];
  const zcols = ["#c44536", "#283a6b", "#e07a94", "#2e6e6a", "#c44536", "#6a4a8c", "#d7b15c", "#3a6a8c"];
  map.decor = [
    { type: "lowtable", x: 8, y: 5 },
    { type: "lowtable", x: 10, y: 5 },
    { type: "lowtable", x: 12, y: 5 },
    { type: "lowtable", x: 14, y: 5 },
    { type: "chochin", x: 7, y: 1 },
    { type: "chochin", x: 14, y: 1 },
    { type: "noren", x: 7, y: 9 },
    { type: "basket", x: 2, y: 4 },
    { type: "dais", x: 8, y: 5, tilesW: 8, tilesH: 1 },
  ];
  zcols.forEach((col, i) => map.decor.push({ type: "zabuton", x: 8 + i, y: 6, col }));
  map.interacts.push({ x: 8, y: 0, type: "plaque" });
  map.interacts.push({ x: 5, y: 3, type: "kitchen" });
  map.interacts.push({ x: 6, y: 3, type: "kitchen" });
  return map;
}

function makeShop() {
  const ascii = `
################
#ssssssssssssss#
#s............s#
#s.tt......tt.s#
#s.zz......zz.s#
#s............s#
#s.tt......tt.s#
#s.zz......zz.s#
#s............s#
#s.....CC.....s#
#s.....CC.....s#
#s............s#
#s.....P......s#
#######DD#######
`.replace(/^\n/, "");
  const map = parseInterior(ascii, {
    "#": { tile: 8, solid: true },
    s: { tile: 8, solid: true },
    ".": { tile: 5, solid: false },
    t: { tile: 5, solid: true, interact: "teatable" },
    z: { tile: 6, solid: false },
    C: { tile: 8, solid: true, interact: "counter" },
    P: { tile: 5, solid: false, spawn: true },
    D: { tile: 8, solid: false, warp: { map: "town", sx: 23, sy: 13 } },
  });
  map.name = "shop";
  map.floor = "wood";
  map.decor = [
    { type: "lowtable", x: 3, y: 3 },
    { type: "lowtable", x: 10, y: 3 },
    { type: "lowtable", x: 3, y: 6 },
    { type: "lowtable", x: 10, y: 6 },
    { type: "zabuton", x: 3, y: 4, col: "#c44536" },
    { type: "zabuton", x: 4, y: 4, col: "#283a6b" },
    { type: "zabuton", x: 10, y: 4, col: "#e07a94" },
    { type: "zabuton", x: 11, y: 4, col: "#2e6e6a" },
    { type: "zabuton", x: 3, y: 7, col: "#d7b15c" },
    { type: "zabuton", x: 4, y: 7, col: "#6a4a8c" },
    { type: "zabuton", x: 10, y: 7, col: "#c44536" },
    { type: "zabuton", x: 11, y: 7, col: "#3a6a8c" },
    { type: "chochin", x: 2, y: 1 },
    { type: "chochin", x: 7, y: 1 },
    { type: "chochin", x: 13, y: 1 },
    { type: "noren", x: 6, y: 12 },
    { type: "basket", x: 1, y: 8 },
    { type: "basket", x: 14, y: 8 },
    { type: "basket", x: 1, y: 5 },
    { type: "basket", x: 14, y: 5 },
    { type: "dais", x: 3, y: 3, tilesW: 2, tilesH: 2 },
    { type: "dais", x: 10, y: 3, tilesW: 2, tilesH: 2 },
    { type: "dais", x: 3, y: 6, tilesW: 2, tilesH: 2 },
    { type: "dais", x: 10, y: 6, tilesW: 2, tilesH: 2 },
  ];
  map.npcs = [
    { x: 7, y: 9, dir: "down", pal: "shop", name: "Shopkeeper", id: "keeper", lines: [] },
    {
      x: 4,
      y: 4,
      dir: "up",
      pal: "teal",
      name: "Tea guest",
      id: "teaguest",
      sit: true,
      wander: false,
      lines: [
        "These zabuton are stuffed with buckwheat husks. Kind on the knees, kind on the heart.",
        "Sit, sip, watch the noren breathe. The market smells of dashi and plum.",
        "If you open your own tables, hungry people will come like swallows.",
      ],
    },
    {
      x: 10,
      y: 7,
      dir: "up",
      pal: "pink",
      name: "Poet",
      id: "shoppoet",
      sit: true,
      wander: false,
      lines: [
        "I came for sesame and stayed for the cushions.",
        "Write a bowl the way I write a verse — cold, spicy, a little beef.",
      ],
    },
    {
      x: 11,
      y: 4,
      dir: "up",
      pal: "child",
      name: "Apprentice",
      id: "shopkid",
      sit: true,
      wander: false,
      lines: [
        "The zabuton here are so puffy my feet do not reach the boards.",
        "Auntie says if I sit straight I may taste the sesame.",
      ],
    },
    {
      x: 3,
      y: 7,
      dir: "up",
      pal: "elder",
      name: "Regular",
      id: "shopregular",
      sit: true,
      wander: false,
      lines: [
        "Same cushion, same hour, forty springs.",
        "Buy the ice and the red oil. Your guests will come.",
      ],
    },
    { x: 1, y: 11, dir: "down", pal: "cat", name: "Shop cat", id: "shopcat", wander: true, lines: ["Nyaa.", "It claims this basket."] },
  ];
  for (const n of map.npcs) {
    if (!n.wander && map.collision[n.y]) map.collision[n.y][n.x] = true;
  }
  return map;
}

function stampTorii(map, x, y, size) {
  const spec = size === "grand"
    ? { w: 16, h: 8, post: 2, beam: 2 }
    : { w: 10, h: 5, post: 2, beam: 2 };
  for (let by = 0; by < spec.beam; by++) {
    for (let xx = x; xx < x + spec.w; xx++) {
      if (xx >= 0 && xx < map.w && y + by >= 0 && y + by < map.h) map.collision[y + by][xx] = true;
    }
  }
  for (let yy = y; yy < y + spec.h; yy++) {
    for (let p = 0; p < spec.post; p++) {
      const lx = x + p;
      const rx = x + spec.w - 1 - p;
      if (yy >= 0 && yy < map.h) {
        if (lx >= 0 && lx < map.w) map.collision[yy][lx] = true;
        if (rx >= 0 && rx < map.w) map.collision[yy][rx] = true;
      }
    }
  }
}

function openGate(map, x0, y0, x1, y1) {
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      if (xx >= 0 && yy >= 0 && xx < map.w && yy < map.h) map.collision[yy][xx] = false;
    }
  }
}

function makeTown() {
  const W = 30;
  const H = 22;
  const map = grid(W, H, 0, false);
  map.name = "town";
  map.floor = "gravel";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x * 13 + y * 7) % 11 === 0) map.tiles[y][x] = 1;
    }
  }
  fill(map, 0, 0, 2, H, 4, true);
  fill(map, 1, 8, 1, 6, 4, true);
  fill(map, 11, 2, 8, 19, 2, false);
  fill(map, 10, 10, 10, 3, 2, false);
  fill(map, 9, 1, 12, 3, 3, false);
  fill(map, 12, 8, 6, 2, 3, false);

  map.decor = [
    { type: "torii", x: 7, y: 0, size: "grand" },
    { type: "torii", x: 10, y: 8, size: "inner" },
    { type: "house", x: 4, y: 13, kind: "player" },
    { type: "house", x: 20, y: 8, kind: "shop" },
    { type: "lantern", x: 9, y: 7 },
    { type: "lantern", x: 20, y: 7 },
    { type: "lantern", x: 11, y: 12 },
    { type: "lantern", x: 18, y: 12 },
    { type: "chochin", x: 10, y: 11 },
    { type: "chochin", x: 18, y: 11 },
    { type: "fence", x: 6, y: 0, n: 18 },
  ];

  const trees = [
    [3, 3, 1],
    [5, 1, 1],
    [24, 1, 1],
    [26, 3, 1],
    [8, 4, 1],
    [22, 4, 1],
    [12, 7, 0],
    [17, 7, 0],
    [3, 8, 0],
    [25, 6, 1],
    [27, 15, 1],
    [2, 16, 1],
    [27, 10, 0],
    [24, 18, 1],
    [11, 19, 0],
    [17, 18, 1],
    [2, 12, 0],
    [22, 19, 1],
    [5, 19, 0],
    [28, 7, 1],
    [1, 5, 0],
    [28, 18, 0],
  ];
  for (const [tx, ty, big] of trees) {
    map.decor.push({ type: "tree", x: tx, y: ty, big: !!big });
    if (ty >= 0 && ty < H && tx >= 0 && tx < W) map.collision[ty][tx] = true;
  }

  fill(map, 4, 13, 7, 5, 0, true);
  fill(map, 20, 8, 7, 5, 0, true);
  fill(map, 7, 18, 6, 1, 2, false);
  fill(map, 18, 13, 7, 1, 2, false);
  stampTorii(map, 7, 0, "grand");
  stampTorii(map, 10, 8, "inner");
  openGate(map, 9, 2, 20, 7);
  openGate(map, 12, 10, 17, 12);
  map.collision[17][7] = false;
  map.collision[12][23] = false;
  map.tiles[17][7] = 2;
  map.tiles[12][23] = 2;

  map.warps.push({ x: 7, y: 17, map: "home", sx: 8, sy: 8 });
  map.warps.push({ x: 23, y: 12, map: "shop", sx: 7, sy: 12 });

  map.npcs = [
    {
      x: 14,
      y: 14,
      dir: "down",
      pal: "elder",
      name: "Grandmother",
      id: "elder",
      wander: true,
      lines: [
        "Two vermillion gates, long as a wish. Walk under them — never on the kasagi.",
        "Taste a bowl first. A cook who has eaten can feed a village.",
        "Cold noodles love chili oil. Beef loves both.",
      ],
    },
    {
      x: 13,
      y: 16,
      dir: "left",
      pal: "pink",
      name: "Hanami-goer",
      id: "villager",
      wander: true,
      lines: [
        "Petals in the tea, petals in the path…",
        "You should make 冷やし肉辛うどん. Cold niku spicy udon.",
        "Then open your tables. Hungry people follow the smell of rayu.",
      ],
    },
    {
      x: 25,
      y: 17,
      dir: "down",
      pal: "child",
      name: "Child",
      id: "child",
      wander: true,
      lines: [
        "The shop lady has ice! And meat! And the red oil that makes Papa go hwaah!",
        "If you cook, can I smell it from the path?",
      ],
    },
    {
      x: 16,
      y: 17,
      dir: "left",
      pal: "blue",
      name: "Monk",
      id: "monk",
      wander: true,
      lines: [
        "The inner gate is shorter so the heart may bow.",
        "Noodles are a prayer you can chew.",
      ],
    },
    { x: 3, y: 17, dir: "down", pal: "cat", name: "Cat", id: "cat", wander: true, lines: ["Nyaa.", "…nya.", "The cat stares as if you owe it broth."] },
    {
      x: 18,
      y: 15,
      dir: "right",
      pal: "green",
      name: "Farmer",
      id: "farmer",
      wander: true,
      lines: [
        "I sold spring onions at first light. They still smell of the field.",
        "Your noren should face the gates. Guests will find you.",
      ],
    },
  ];
  for (const n of map.npcs) {
    if (n.y >= 0 && n.y < H && n.x >= 0 && n.x < W) map.collision[n.y][n.x] = true;
  }

  map.spawn = { x: 7, y: 18 };
  map.interacts.push({ x: 14, y: 1, type: "shrine" });
  return map;
}

const WORLD = {
  home: makeHome(),
  town: makeTown(),
  shop: makeShop(),
};

const GUEST_ORDERS = [
  { id: "cold_niku_spicy", line: "The spring special — cold niku spicy udon. I can already taste the rayu." },
  { id: "niku", line: "Hot niku udon, please. Sweet glazed beef on a winter of noodles." },
  { id: "hiyashi_spicy", line: "Something cold and spicy. The blossoms made me bold." },
  { id: "kake", line: "A simple kake udon. Dashi, noodles, and a little quiet." },
  { id: "tempura", line: "Tempura udon, while the shrimp still sings." },
  { id: "hiyashi", line: "Hiyashi udon. Ice on the noodles, please." },
  { id: "niku_spicy", line: "Spicy niku, hot as a festival drum." },
];

const GUEST_NAMES = [
  { name: "Traveler", pal: "blue" },
  { name: "Merchant", pal: "green" },
  { name: "Poet", pal: "purple" },
  { name: "Hanami guest", pal: "pink" },
  { name: "Fisherman", pal: "teal" },
  { name: "Auntie", pal: "elder" },
];
