(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const VIEW_W = 320;
  const VIEW_H = 288;
  const T = 16;

  SPR.buildAtlas();

  const palettes = {
    player: SPR.PAL_PLAYER,
    pink: SPR.PAL_PINK,
    elder: SPR.PAL_ELDER,
    shop: SPR.PAL_SHOP,
    child: SPR.PAL_CHILD,
    blue: SPR.PAL_BLUE,
    green: SPR.PAL_GREEN,
    purple: SPR.PAL_PURPLE,
    teal: SPR.PAL_TEAL,
  };

  const state = {
    mode: "title",
    map: WORLD.home,
    mapId: "home",
    player: { x: WORLD.home.spawn.x, y: WORLD.home.spawn.y, px: 0, py: 0, dir: "up", moving: false, t: 0, frame: 0 },
    keys: {},
    yen: 680,
    hunger: 2,
    bag: { udon: 3, niku: 2, chili_oil: 2, ice: 2, dashi: 2, negi: 2, egg: 1, tsuyu: 1 },
    recipe: { temp: "cold", items: new Set() },
    shopSel: 0,
    dialog: { name: "", lines: [], i: 0 },
    fade: 0,
    fadeDir: 0,
    warpTo: null,
    petals: [],
    time: 0,
    eat: { progress: 0, lift: 0, slurps: 0, flavor: "", dish: null },
    prompt: "",
    anim: 0,
    restaurantOpen: false,
    heldBowl: null,
    floaters: [],
    birds: [],
    flies: [],
    spawnWait: 0,
    yenFlash: 0,
  };

  state.player.px = state.player.x * T;
  state.player.py = state.player.y * T;

  const els = {
    title: document.getElementById("title"),
    dialog: document.getElementById("dialog"),
    dialogName: document.getElementById("dialogName"),
    dialogText: document.getElementById("dialogText"),
    shop: document.getElementById("shop"),
    shopList: document.getElementById("shopList"),
    shopDesc: document.getElementById("shopDesc"),
    shopYen: document.getElementById("shopYen"),
    shopPreview: document.getElementById("shopPreview"),
    bag: document.getElementById("bag"),
    bagList: document.getElementById("bagList"),
    kitchen: document.getElementById("kitchen"),
    ingList: document.getElementById("ingList"),
    bowl: document.getElementById("bowl"),
    recipeName: document.getElementById("recipeName"),
    eating: document.getElementById("eating"),
    eatBowl: document.getElementById("eatBowl"),
    eatBanner: document.getElementById("eatBanner"),
    eatFlavor: document.getElementById("eatFlavor"),
    eatHint: document.getElementById("eatHint"),
    yen: document.getElementById("yen"),
    hunger: document.getElementById("hunger"),
    prompt: document.getElementById("prompt"),
    btnMute: document.getElementById("btnMute"),
    btnHot: document.getElementById("btnHot"),
    btnCold: document.getElementById("btnCold"),
    eatPay: document.getElementById("eatPay"),
    guests: document.getElementById("guests"),
    btnServe: document.getElementById("btnServe"),
  };

  function show(el, on) {
    el.classList.toggle("hidden", !on);
  }

  function count(id) {
    return state.bag[id] || 0;
  }

  function addItem(id, n = 1) {
    state.bag[id] = (state.bag[id] || 0) + n;
  }

  function takeItem(id) {
    if (!count(id)) return false;
    state.bag[id]--;
    if (state.bag[id] <= 0) delete state.bag[id];
    return true;
  }

  function hud() {
    els.yen.textContent = "¥" + state.yen;
    els.yen.style.color = state.yenFlash > 0 ? "#ffe27a" : "";
    els.hunger.textContent = "腹 " + "●".repeat(state.hunger) + "○".repeat(Math.max(0, 4 - state.hunger));
    if (els.guests) {
      const n = guestCount();
      els.guests.textContent = state.restaurantOpen ? "客 " + n : "店 閉";
      els.guests.classList.toggle("open", state.restaurantOpen);
    }
    if (state.prompt && state.mode === "world") {
      els.prompt.textContent = state.prompt;
      show(els.prompt, true);
    } else show(els.prompt, false);
  }

  function guestCount() {
    return WORLD.home.npcs.filter((n) => n.guest && !n.leaving).length;
  }

  function dishPay(dish) {
    let n = 480 + (dish.score || 0) * 120;
    if (dish.id === "cold_niku_spicy") n += 920;
    return n;
  }

  function popFloater(x, y, text, col) {
    state.floaters.push({ x, y, text, col: col || "#ffe9b8", life: 1.25 });
  }

  function prepNpcs() {
    for (const map of Object.values(WORLD)) {
      for (const n of map.npcs) {
        n.px = n.x * T;
        n.py = n.y * T;
      }
    }
  }
  prepNpcs();

  function spawnGuests() {
    const home = WORLD.home;
    if (!home.seats) return;
    for (const seat of home.seats) {
      if (home.npcs.some((n) => n.guest && n.x === seat.x && n.y === seat.y && !n.leaving)) continue;
      if (guestCount() >= 4) continue;
      if (guestCount() >= 2 && Math.random() > 0.55) continue;
      const who = GUEST_NAMES[(Math.random() * GUEST_NAMES.length) | 0];
      const order = GUEST_ORDERS[(Math.random() * GUEST_ORDERS.length) | 0];
      const npc = {
        x: seat.x,
        y: seat.y,
        px: seat.x * T,
        py: seat.y * T,
        dir: seat.dir || "up",
        pal: who.pal,
        name: who.name,
        id: "guest",
        guest: true,
        orderId: order.id,
        orderLine: order.line,
        wander: false,
        happy: 0,
        leaving: false,
      };
      home.npcs.push(npc);
      if (home.collision[seat.y]) home.collision[seat.y][seat.x] = true;
    }
  }

  function spawnPetals(n) {
    for (let i = 0; i < n; i++) {
      state.petals.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        z: 0.4 + Math.random() * 0.8,
        r: Math.random() * 6,
        s: 0.6 + Math.random() * 1.2,
        c: Math.random() > 0.5 ? "#f8c4d0" : "#ffe0e8",
      });
    }
  }
  spawnPetals(70);

  function resize() {
    const scale = Math.max(2, Math.floor(Math.min((window.innerWidth - 40) / VIEW_W, (window.innerHeight - 40) / VIEW_H)));
    canvas.style.width = VIEW_W * scale + "px";
    canvas.style.height = VIEW_H * scale + "px";
    document.getElementById("stage").style.width = VIEW_W * scale + "px";
    document.getElementById("stage").style.height = VIEW_H * scale + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  const titlePetals = document.querySelector(".title-petals");
  for (let i = 0; i < 24; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.animationDuration = 6 + Math.random() * 8 + "s";
    s.style.animationDelay = Math.random() * 8 + "s";
    s.style.background = Math.random() > 0.5 ? "#ffd0dc" : "#fff0f4";
    titlePetals.appendChild(s);
  }

  function inOverlay() {
    return state.mode !== "world" && state.mode !== "title";
  }

  function solid(map, x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    return !!map.collision[y][x];
  }

  function tryMove(dx, dy) {
    if (state.player.moving || state.fadeDir) return;
    const dir = dy < 0 ? "up" : dy > 0 ? "down" : dx < 0 ? "left" : "right";
    state.player.dir = dir;
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;
    const warp = state.map.warps.find((w) => w.x === nx && w.y === ny);
    if (warp) {
      beginWarp(warp);
      return;
    }
    if (solid(state.map, nx, ny)) {
      SFX.bump();
      return;
    }
    state.player.moving = true;
    state.player.t = 0;
    state.player.nx = nx;
    state.player.ny = ny;
    state.player.ox = state.player.px;
    state.player.oy = state.player.py;
  }

  function beginWarp(warp) {
    state.fadeDir = 1;
    state.warpTo = warp;
    SFX.door();
  }

  function applyWarp() {
    const w = state.warpTo;
    state.mapId = w.map;
    state.map = WORLD[w.map];
    state.player.x = w.sx;
    state.player.y = w.sy;
    state.player.px = w.sx * T;
    state.player.py = w.sy * T;
    state.player.moving = false;
    state.warpTo = null;
    if (w.map === "shop") SFX.bell();
  }

  function facingTile() {
    let { x, y, dir } = state.player;
    if (dir === "up") y--;
    if (dir === "down") y++;
    if (dir === "left") x--;
    if (dir === "right") x++;
    return { x, y };
  }

  function aroundTiles() {
    const { x, y } = state.player;
    const f = facingTile();
    return [f, { x, y }, { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
  }

  function lookPrompt() {
    const f = facingTile();
    const npc = state.map.npcs.find((n) => n.x === f.x && n.y === f.y);
    if (npc) {
      state.prompt = npc.guest ? (state.heldBowl ? "E  Serve " + npc.name : "E  " + npc.name + " is waiting") : "E  " + npc.name;
      return;
    }
    if (state.heldBowl) {
      const itHold =
        state.map.interacts.find((n) => n.x === f.x && n.y === f.y) ||
        state.map.interacts.find((n) => n.x === state.player.x && n.y === state.player.y);
      if (itHold && (itHold.type === "table" || itHold.type === "seat")) {
        state.prompt = "E  Eat this bowl";
        return;
      }
    }
    const it =
      state.map.interacts.find((n) => n.x === f.x && n.y === f.y) ||
      state.map.interacts.find((n) => n.x === state.player.x && n.y === state.player.y);
    const warp = state.map.warps.find((n) => n.x === f.x && n.y === f.y);
    if (it) {
      const labels = { kitchen: "E  Cook udon", table: "E  Low table", seat: "E  Zabuton", teatable: "E  Tea table", counter: "E  Shop", plaque: "E  Recipe plaque", shrine: "E  Shrine" };
      state.prompt = labels[it.type] || "E";
      return;
    }

    if (warp) {
      state.prompt = warp.map === "town" ? "E  Outside" : warp.map === "shop" ? "E  Market" : "E  Home";
      return;
    }
    const under = state.map.warps.find((n) => n.x === state.player.x && n.y === state.player.y);
    if (under) state.prompt = "↑ enter";
    else if (state.heldBowl) state.prompt = "丼  " + state.heldBowl.dish.jp;
    else state.prompt = "";
  }

  function talk(name, lines) {
    state.mode = "dialog";
    state.dialog = { name, lines: lines.slice(), i: 0 };
    els.dialogName.textContent = name;
    els.dialogText.textContent = lines[0];
    show(els.dialog, true);
    SFX.ui();
  }

  function advanceDialog() {
    state.dialog.i++;
    if (state.dialog.i >= state.dialog.lines.length) {
      show(els.dialog, false);
      state.mode = "world";
      return;
    }
    els.dialogText.textContent = state.dialog.lines[state.dialog.i];
    SFX.ui();
  }

  function interact() {
    const spots = aroundTiles();
    const npc = spots.map((t) => state.map.npcs.find((n) => n.x === t.x && n.y === t.y)).find(Boolean);
    if (npc) {
      const face = { up: "down", down: "up", left: "right", right: "left" };
      if (!npc.guest && !npc.sit) npc.dir = face[state.player.dir] || npc.dir;
      if (npc.id === "keeper") {
        openShop();
        return;
      }
      if (npc.guest) {
        if (state.heldBowl) serveGuest(npc);
        else talk(npc.name, [npc.orderLine, "Cook it at the kamado, then carry the bowl to my zabuton."]);
        return;
      }
      talk(npc.name, npc.lines);
      return;
    }
    const it = spots.map((t) => state.map.interacts.find((n) => n.x === t.x && n.y === t.y)).find(Boolean);
    if (!it) {
      const f = facingTile();
      const warp =
        state.map.warps.find((n) => n.x === f.x && n.y === f.y) ||
        state.map.warps.find((n) => n.x === state.player.x && n.y === state.player.y);
      if (warp) beginWarp(warp);
      return;
    }
    if (it.type === "kitchen") openKitchen();
    else if (it.type === "counter") openShop();
    else if (it.type === "teatable") {
      talk("Tea table", ["Lacquer, sesame, and a cushion still warm.", "The market keeps its knees close to the floor."]);
    } else if (it.type === "table" || it.type === "seat") {
      if (state.heldBowl) {
        const dish = state.heldBowl.dish;
        const recipe = state.heldBowl.recipe;
        state.heldBowl = null;
        beginEat(dish, recipe);
      } else if (state.restaurantOpen) {
        talk("Low table", ["Guests wait on the zabuton.", "Cook a bowl, carry it, press E beside them."]);
      } else if (state.hunger >= 4) talk("You", ["You are already full. A walk under the blossoms might help."]);
      else talk("Low table", ["Cook at the kitchen first. Taste a bowl — then the tables may fill."]);
    } else if (it.type === "plaque") {
      talk("Recipe plaque", [
        "春の特製 — Cold Niku Spicy Udon.",
        "1. Walk the path through the red gates. Buy noodles, beef, chili oil, ice.",
        "2. Return. Set the kitchen to 冷 (cold). Noodles, niku, chili. Taste it.",
        "3. Yen follows a good cook. Then serve the guests who sit at your tables.",
      ]);
    } else if (it.type === "shrine") {
      talk("Torii shrine", ["Two vermillion gates, taller than a wish.", "Walk through. Never on the kasagi — that beam belongs to the kami."]);
    }
  }

  function serveGuest(npc) {
    const dish = state.heldBowl.dish;
    let pay = dishPay(dish);
    let lines;
    if (dish.id === npc.orderId) {
      pay = Math.floor(pay * 1.4) + 120;
      lines = [`Perfect. ${dish.jp}. This is the bowl I walked here for.`, `A purse of ¥${pay} slides across the lacquer.`];
    } else if (dish.score >= 7) {
      pay = Math.floor(pay * 0.85);
      lines = [`Not what I named… but it is wonderful.`, `¥${pay} for a surprise this kind.`];
    } else if (dish.score >= 4) {
      pay = Math.floor(pay * 0.55);
      lines = [`A humble bowl. I am still grateful.`, `¥${pay}.`];
    } else {
      pay = 50;
      lines = [`I will pay, because the path was long.`, `¥${pay}. Perhaps next time, noodles with a story.`];
    }
    state.yen += pay;
    state.yenFlash = 0.9;
    state.heldBowl = null;
    npc.happy = 2.8;
    npc.leaving = true;
    popFloater(npc.px, npc.py - 10, "+¥" + pay, "#ffe27a");
    SFX.coin();
    talk(npc.name, lines);
  }

  function openShop() {
    state.mode = "shop";
    state.shopSel = 0;
    show(els.shop, true);
    SFX.bell();
    renderShop();
  }

  function renderShop() {
    els.shopList.innerHTML = "";
    SHOP_ORDER.forEach((id, i) => {
      const it = ITEMS[id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "item" + (i === state.shopSel ? " sel" : "");
      b.innerHTML = `<span>${it.jp}</span><span>${it.name}</span><span class="qty">¥${it.price} · have ${count(id)}</span>`;
      b.addEventListener("click", () => {
        state.shopSel = i;
        renderShop();
        SFX.ui();
      });
      els.shopList.appendChild(b);
    });
    const it = ITEMS[SHOP_ORDER[state.shopSel]];
    els.shopDesc.textContent = it.desc;
    els.shopYen.textContent = "You have ¥" + state.yen;
    const recipe = { temp: it.id === "ice" || it.id === "chili_oil" ? "cold" : "hot", items: new Set(["udon", it.id]) };
    if (it.id === "udon") recipe.items = new Set(["udon", "dashi"]);
    renderUdon(els.shopPreview, recipe, state.time, 0, 0);
  }

  function buy() {
    const it = ITEMS[SHOP_ORDER[state.shopSel]];
    if (state.yen < it.price) {
      SFX.bump();
      els.shopDesc.textContent = "Not enough yen… the blossoms are free, the beef is not.";
      return;
    }
    state.yen -= it.price;
    addItem(it.id);
    SFX.buy();
    renderShop();
    hud();
  }

  function closeShop() {
    show(els.shop, false);
    state.mode = "world";
  }

  function openBag() {
    state.mode = "bag";
    show(els.bag, true);
    els.bagList.innerHTML = "";
    const ids = Object.keys(state.bag);
    if (!ids.length) {
      els.bagList.innerHTML = "<p style='padding:8px'>The furoshiki is empty. The market sits beyond the red gates.</p>";
    }
    for (const id of ids) {
      const it = ITEMS[id];
      const b = document.createElement("div");
      b.className = "item";
      b.innerHTML = `<span>${it.jp}</span><span>${it.name}</span><span class="qty">×${count(id)}</span>`;
      els.bagList.appendChild(b);
    }
    if (state.heldBowl) {
      const b = document.createElement("div");
      b.className = "item sel";
      b.innerHTML = `<span>丼</span><span>Carrying ${state.heldBowl.dish.name}</span><span class="qty">hot</span>`;
      els.bagList.appendChild(b);
    }
    SFX.ui();
  }

  function closeBag() {
    show(els.bag, false);
    state.mode = "world";
  }

  function openKitchen() {
    state.mode = "kitchen";
    state.recipe = { temp: "cold", items: new Set() };
    show(els.kitchen, true);
    SFX.ui();
    renderKitchen();
  }

  function renderKitchen() {
    els.ingList.innerHTML = "";
    for (const id of SHOP_ORDER) {
      const it = ITEMS[id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ing" + (state.recipe.items.has(id) ? " on" : "");
      b.disabled = count(id) <= 0 && !state.recipe.items.has(id);
      b.textContent = `${it.jp}  ${it.name}` + (count(id) ? `  ×${count(id)}` : "  (none)");
      b.addEventListener("click", () => toggleIng(id));
      els.ingList.appendChild(b);
    }
    els.btnHot.classList.toggle("on", state.recipe.temp === "hot");
    els.btnCold.classList.toggle("on", state.recipe.temp === "cold");
    const info = renderUdon(els.bowl, state.recipe, state.time, 0, 0);
    els.recipeName.textContent = info.jp + " · " + info.name;
    const waiting = guestCount();
    if (els.btnServe) {
      els.btnServe.textContent = state.restaurantOpen && waiting ? "出す · Serve guest" : "盛る · Plate & taste";
    }
  }

  function toggleIng(id) {
    if (state.recipe.items.has(id)) {
      state.recipe.items.delete(id);
      SFX.ui();
    } else {
      if (count(id) <= 0) return;
      state.recipe.items.add(id);
      if (id === "chili_oil" || id === "dashi" || id === "tsuyu") SFX.pour();
      else if (id === "niku") SFX.sizzle();
      else if (id === "ice") SFX.ice();
      else if (id === "negi") SFX.chop();
      else if (id === "udon") SFX.boil();
      else SFX.ui();
    }
    renderKitchen();
  }

  function setTemp(temp) {
    state.recipe.temp = temp;
    if (temp === "cold") SFX.ice();
    else SFX.boil();
    renderKitchen();
  }

  function serve() {
    if (!state.recipe.items.has("udon")) {
      els.recipeName.textContent = "You need noodles.";
      SFX.bump();
      return;
    }
    for (const id of [...state.recipe.items]) takeItem(id);
    const dish = detectRecipe(state.recipe);
    const recipe = { temp: state.recipe.temp, items: new Set(state.recipe.items) };
    show(els.kitchen, false);
    if (state.restaurantOpen && guestCount() > 0) {
      state.heldBowl = { dish, recipe };
      state.mode = "world";
      talk("You", [
        `${dish.jp} — plated, fragrant, ready.`,
        "Carry it to a guest on the zabuton. Press E beside them.",
      ]);
    } else {
      beginEat(dish, recipe);
    }
  }

  function beginEat(dish, recipe) {
    state.mode = "eating";
    state.eat = { progress: 0, lift: 0, slurps: 0, flavor: dish.flavor ? dish.flavor[0] : "", dish, recipe, pay: 0 };
    els.eatBanner.textContent = "いただきます";
    els.eatFlavor.textContent = dish.jp + " — " + dish.name;
    els.eatHint.textContent = "Press Space to slurp";
    if (els.eatPay) els.eatPay.textContent = "";
    show(els.eating, true);
    SFX.itadakimasu();
  }

  function slurp() {
    if (state.mode !== "eating") return;
    if (state.eat.slurps >= 5) return;
    if (state.eat.lift > 0.4) return;
    state.eat.slurps++;
    state.eat.lift = 1;
    state.eat.progress = state.eat.slurps / 5;
    SFX.slurp();
    const dish = state.eat.dish;
    const lines = dish.flavor || ["Mmm."];
    els.eatFlavor.textContent = lines[Math.min(state.eat.slurps - 1, lines.length - 1)];
    if (state.eat.slurps === 1) els.eatBanner.textContent = dish.jp;
    if (state.eat.slurps >= 5) finishEat();
  }

  function finishEat() {
    const dish = state.eat.dish;
    const pay = dishPay(dish);
    state.eat.done = true;
    state.eat.pay = pay;
    state.yen += pay;
    state.yenFlash = 1.2;
    state.hunger = Math.min(4, state.hunger + (dish.score >= 8 ? 3 : dish.score >= 5 ? 2 : 1));
    els.eatBanner.textContent = "ごちそうさま";
    els.eatHint.textContent = "Press E / Space to return";
    if (els.eatPay) els.eatPay.textContent = "The village pays a cook who has tasted — +¥" + pay;
    if (dish.id === "cold_niku_spicy") {
      els.eatFlavor.textContent = "The village, the gate, the petals — all of it lives in this bowl.";
      SFX.gochiso();
    } else SFX.yum();
    SFX.coin();
    popFloater(state.player.px, state.player.py - 12, "+¥" + pay, "#ffe27a");
    if (!state.restaurantOpen) {
      state.restaurantOpen = true;
      spawnGuests();
      els.eatHint.textContent = "Your tables are filling. Press E to greet them.";
    }
  }

  function closeEat() {
    if (!state.eat.done) slurp();
    else {
      show(els.eating, false);
      state.mode = "world";
      if (state.restaurantOpen && guestCount() > 0) {
        talk("A guest", ["Irasshaimase — we heard the slurping from the path.", "Cook another bowl. We will wait on the zabuton."]);
      }
    }
  }

  function closeKitchen() {
    show(els.kitchen, false);
    state.mode = "world";
  }

  document.getElementById("btnStart").addEventListener("click", startGame);
  document.getElementById("btnBuy").addEventListener("click", buy);
  document.getElementById("btnShopLeave").addEventListener("click", closeShop);
  document.getElementById("btnBagLeave").addEventListener("click", closeBag);
  document.getElementById("btnHot").addEventListener("click", () => setTemp("hot"));
  document.getElementById("btnCold").addEventListener("click", () => setTemp("cold"));
  document.getElementById("btnServe").addEventListener("click", serve);
  document.getElementById("btnKitchenLeave").addEventListener("click", closeKitchen);
  els.btnMute.addEventListener("click", () => {
    const m = SFX.toggleMute();
    els.btnMute.textContent = m ? "×" : "♪";
  });

  function startGame() {
    SFX.unlock();
    show(els.title, false);
    state.mode = "world";
    spawnPetals(40);
    talk("Morning", [
      "Shoji glow pink. Cherry petals stick to the engawa.",
      "Taste today's special: cold niku spicy udon. A cook who has eaten is paid in yen.",
      "Then the low tables fill. Carry bowls to guests. The red gates will watch.",
    ]);
  }

  function keyDir(e) {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") return [0, -1];
    if (k === "s" || k === "arrowdown") return [0, 1];
    if (k === "a" || k === "arrowleft") return [-1, 0];
    if (k === "d" || k === "arrowright") return [1, 0];
    return null;
  }

  function isConfirm(e) {
    const k = e.key.toLowerCase();
    return k === "e" || k === " " || k === "enter" || k === "z";
  }

  window.addEventListener("keydown", (e) => {
    SFX.unlock();
    const k = e.key.toLowerCase();
    state.keys[k] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(k)) e.preventDefault();

    if (state.mode === "title") {
      if (isConfirm(e)) startGame();
      return;
    }
    if (state.mode === "dialog") {
      if (isConfirm(e)) advanceDialog();
      return;
    }
    if (state.mode === "shop") {
      if (k === "escape") closeShop();
      else if (k === "w" || k === "arrowup") {
        state.shopSel = (state.shopSel + SHOP_ORDER.length - 1) % SHOP_ORDER.length;
        renderShop();
        SFX.ui();
      } else if (k === "s" || k === "arrowdown") {
        state.shopSel = (state.shopSel + 1) % SHOP_ORDER.length;
        renderShop();
        SFX.ui();
      } else if (isConfirm(e)) buy();
      return;
    }
    if (state.mode === "bag") {
      if (k === "escape" || k === "i" || isConfirm(e)) closeBag();
      return;
    }
    if (state.mode === "kitchen") {
      if (k === "escape") closeKitchen();
      else if (k === "h") setTemp("hot");
      else if (k === "c") setTemp("cold");
      else if (k === "enter") serve();
      return;
    }
    if (state.mode === "eating") {
      if (isConfirm(e) || k === " ") closeEat();
      return;
    }
    if (state.mode === "world") {
      if (k === "i") openBag();
      else if (isConfirm(e)) interact();
      else {
        const d = keyDir(e);
        if (d) tryMove(d[0], d[1]);
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    state.keys[e.key.toLowerCase()] = false;
  });

  function heldMove() {
    if (state.mode !== "world" || state.player.moving) return;
    if (state.keys.w || state.keys.arrowup) tryMove(0, -1);
    else if (state.keys.s || state.keys.arrowdown) tryMove(0, 1);
    else if (state.keys.a || state.keys.arrowleft) tryMove(-1, 0);
    else if (state.keys.d || state.keys.arrowright) tryMove(1, 0);
  }

  function camera() {
    const map = state.map;
    const px = state.player.px + 8;
    const py = state.player.py + 8;
    let cx = px - VIEW_W / 2;
    let cy = py - VIEW_H / 2;
    cx = Math.max(0, Math.min(cx, map.w * T - VIEW_W));
    cy = Math.max(0, Math.min(cy, map.h * T - VIEW_H));
    if (map.w * T < VIEW_W) cx = -(VIEW_W - map.w * T) / 2;
    if (map.h * T < VIEW_H) cy = -(VIEW_H - map.h * T) / 2;
    return { cx, cy };
  }

  function drawInteriorWalls(ox, oy) {
    const map = state.map;
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (!map.collision[y][x]) continue;
        if (map.warps.some((w) => w.x === x && w.y === y)) continue;
        const sx = Math.round(x * T - ox);
        const sy = Math.round(y * T - oy);
        const interact = map.interacts.find((i) => i.x === x && i.y === y);
        const edge = x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1;

        if (interact && interact.type === "kitchen") {
          ctx.fillStyle = "#4a2e18";
          ctx.fillRect(sx, sy + 2, T, 14);
          ctx.fillStyle = "#e0b070";
          ctx.fillRect(sx, sy, T, 6);
          ctx.fillStyle = "#8a4a22";
          ctx.fillRect(sx, sy + 5, T, 2);
          ctx.fillStyle = "#1a100c";
          ctx.fillRect(sx + 3, sy + 8, 10, 7);
          ctx.fillStyle = "#c44536";
          ctx.fillRect(sx + 5, sy + 10, 6, 4);
          ctx.fillStyle = "#f0d0a0";
          ctx.fillRect(sx + 6, sy + 11, 4, 2);
          const puff = (Math.sin(state.time / 180 + x) + 1) * 0.5;
          ctx.fillStyle = `rgba(255,244,230,${0.25 + puff * 0.35})`;
          ctx.beginPath();
          ctx.ellipse(sx + 8, sy + 4 - puff * 4, 3 + puff, 2 + puff, 0, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        if (interact && (interact.type === "table" || interact.type === "teatable" || interact.type === "seat")) continue;
        if (interact && interact.type === "counter") {
          ctx.fillStyle = "#6b4428";
          ctx.fillRect(sx, sy + 4, T, 12);
          ctx.fillStyle = "#e0b070";
          ctx.fillRect(sx, sy + 2, T, 6);
          ctx.fillStyle = "#c44536";
          ctx.fillRect(sx + 4, sy + 3, 8, 3);
          ctx.fillStyle = "#f4ece0";
          ctx.fillRect(sx + 5, sy + 8, 6, 4);
          continue;
        }
        if (interact && interact.type === "plaque") {
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = "#f0e0c0";
          ctx.fillRect(sx + 3, sy + 3, 10, 11);
          ctx.fillStyle = "#c44536";
          ctx.fillRect(sx + 5, sy + 6, 6, 5);
          continue;
        }
        if (!edge && map.name === "home") {
          ctx.fillStyle = "#6b4428";
          ctx.fillRect(sx, sy + 4, T, 12);
          ctx.fillStyle = "#d4a060";
          ctx.fillRect(sx, sy, T, 7);
          ctx.fillStyle = "#8a5a32";
          ctx.fillRect(sx, sy + 6, T, 1);
          continue;
        }
        if (!edge && map.name === "shop") {
          ctx.fillStyle = "#5a3a22";
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = "#c48a48";
          ctx.fillRect(sx + 2, sy + 2, 12, 5);
          ctx.fillStyle = "#c44536";
          ctx.fillRect(sx + 3, sy + 9, 10, 5);
          ctx.fillStyle = "#e8dcc8";
          ctx.fillRect(sx + 4, sy + 3, 8, 2);
          continue;
        }

        ctx.fillStyle = map.name === "shop" ? "#6b4a32" : "#e6d5bc";
        ctx.fillRect(sx, sy, T, T);
        ctx.fillStyle = "#5a3a22";
        if (x === 0) ctx.fillRect(sx, sy, 4, T);
        if (x === map.w - 1) ctx.fillRect(sx + 12, sy, 4, T);
        if (y === 0) ctx.fillRect(sx, sy, T, 4);
        if (y === map.h - 1) ctx.fillRect(sx, sy + 12, T, 4);
        if (x % 2 === 0) ctx.fillRect(sx, sy, 2, T);

        if (map.name === "home" && y === 0 && x > 1 && x < map.w - 2) {
          ctx.fillStyle = "#fbf6ea";
          ctx.fillRect(sx + 3, sy + 5, 11, 11);
          ctx.fillStyle = "#6b4428";
          ctx.fillRect(sx + 3, sy + 5, 11, 1);
          ctx.fillRect(sx + 3, sy + 10, 11, 1);
          ctx.fillRect(sx + 8, sy + 5, 1, 11);
        }
      }
    }
  }

  function sortYForDecor(d) {
    if (d.type === "torii") {
      const spec = SPR.toriiSpec(d.size || "grand");
      return d.y * T + spec.h - 6;
    }
    if (d.type === "house") return (d.y + 4) * T;
    if (d.type === "tree") return (d.y + 1) * T;
    if (d.type === "noren") return (d.y + 1) * T;
    if (d.type === "dais") return d.y * T - 12;
    if (d.type === "zabuton") return d.y * T - 2;
    if (d.type === "lowtable") return d.y * T + 6;
    return d.y * T;
  }

  function drawDecorItem(d, sx, sy, part) {
    if (d.type === "house") SPR.drawHouse(ctx, sx, sy, d.kind);
    else if (d.type === "torii") SPR.drawTorii(ctx, sx, sy, d.size || "grand", part || "posts");
    else if (d.type === "lantern") SPR.drawLantern(ctx, sx, sy);
    else if (d.type === "chochin") SPR.drawChochin(ctx, sx, sy, state.time);
    else if (d.type === "fence") SPR.drawRoofFence(ctx, sx, sy, d.n);
    else if (d.type === "tree") SPR.drawTree(ctx, sx, sy, d.big, state.time);
    else if (d.type === "zabuton") SPR.drawZabuton(ctx, sx, sy, d.col);
    else if (d.type === "lowtable") SPR.drawLowTable(ctx, sx, sy);
    else if (d.type === "noren") SPR.drawNoren(ctx, sx, sy);
    else if (d.type === "basket") SPR.drawBasket(ctx, sx, sy);
    else if (d.type === "dais") SPR.drawDais(ctx, sx, sy, d.tilesW || 2, d.tilesH || 2);
  }

  function drawWorld() {
    const map = state.map;
    const { cx, cy } = camera();
    ctx.fillStyle = map.name === "town" ? "#7ec0ee" : "#2a1c14";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    if (map.name === "town") {
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, "#8ec8f0");
      sky.addColorStop(0.35, "#f8d0dc");
      sky.addColorStop(0.55, "#c8e4f8");
      sky.addColorStop(1, "#7cb86a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    const x0 = Math.max(0, Math.floor(cx / T) - 1);
    const y0 = Math.max(0, Math.floor(cy / T) - 1);
    const x1 = Math.min(map.w, Math.ceil((cx + VIEW_W) / T) + 1);
    const y1 = Math.min(map.h, Math.ceil((cy + VIEW_H) / T) + 1);
    const waterFrame = Math.floor(state.time / 400) % 2;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        let id = map.tiles[y][x];
        if (id === 4) id = waterFrame ? 9 : 4;
        SPR.drawTile(ctx, id, Math.round(x * T - cx), Math.round(y * T - cy));
      }
    }

    if (map.name === "town") {
      let koi = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (map.tiles[y][x] === 4 && ((x + y) % 5 === 0)) {
            SPR.drawKoi(ctx, x * T - cx + 8, y * T - cy + 8, state.time, koi++);
          }
        }
      }
    }

    if (map.name === "home" || map.name === "shop") drawInteriorWalls(cx, cy);

    const doors = map.warps;
    for (const d of doors) {
      const sx = Math.round(d.x * T - cx);
      const sy = Math.round(d.y * T - cy);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(sx + 2, sy + 2, 12, 14);
      ctx.fillStyle = "#c44536";
      ctx.fillRect(sx + 3, sy + 4, 10, 8);
    }

    const sprites = [];
    for (const d of map.decor || []) {
      sprites.push({
        y: sortYForDecor(d),
        draw: () => drawDecorItem(d, d.x * T - cx, d.y * T - cy),
      });
    }
    sprites.push({
      y: state.player.py,
      draw: () => {
        const f = state.player.moving ? (Math.floor(state.player.t * 8) & 1) : 0;
        SPR.drawPerson(ctx, state.player.px - cx, state.player.py - cy, state.player.dir, f, palettes.player);
        if (state.heldBowl) SPR.drawHeldBowl(ctx, state.player.px - cx, state.player.py - cy - 10, state.time);
      },
    });
    for (const n of map.npcs) {
      sprites.push({
        y: n.py != null ? n.py : n.y * T,
        draw: () => {
          const nx = (n.px != null ? n.px : n.x * T) - cx;
          const ny = (n.py != null ? n.py : n.y * T) - cy;
          if (n.pal === "cat") SPR.drawCat(ctx, nx, ny, state.time);
          else {
            const sitting = !!(n.guest || n.sit);
            const fr = n.moving ? (Math.floor((n.t || 0) * 8) & 1) : 0;
            SPR.drawPerson(ctx, nx, ny, n.dir || "down", fr, palettes[n.pal] || palettes.player, sitting);
          }
          if (n.guest && !n.leaving) SPR.drawBalloon(ctx, nx, ny, "!");
          if (n.guest && n.happy > 0) {
            SPR.drawBalloon(ctx, nx, ny, "¥");
            SPR.drawHeldBowl(ctx, nx, ny - 12, state.time);
          }
        },
      });
    }
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.draw();

    for (const d of map.decor || []) {
      if (d.type !== "lowtable") continue;
      const tx = d.x * T - cx + 16;
      const ty = d.y * T - cy + 2;
      const puff = (Math.sin(state.time / 220 + d.x) + 1) * 0.5;
      ctx.fillStyle = `rgba(255,244,230,${0.12 + puff * 0.22})`;
      ctx.beginPath();
      ctx.ellipse(tx, ty - puff * 6, 3 + puff, 2 + puff, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const d of map.decor || []) {
      if (d.type === "torii") SPR.drawTorii(ctx, d.x * T - cx, d.y * T - cy, d.size || "grand", "lintel");
    }

    if (map.name === "town") {
      for (const b of state.birds) {
        SPR.drawBird(ctx, b.x - cx * 0.3, b.y, state.time);
      }
      for (const f of state.flies) {
        SPR.drawButterfly(ctx, f.x - cx, f.y - cy * 0.4, state.time, f.i);
      }
    }

    for (const p of state.petals) {
      if (map.name === "shop") continue;
      const x = Math.round(p.x - cx * p.z);
      const y = Math.round(p.y - cy * 0.3);
      if (x < -8 || x > VIEW_W + 8 || y < -8 || y > VIEW_H + 8) continue;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(x, y, 2.2 * p.s, 1.4 * p.s, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const f of state.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 1.4);
      ctx.fillStyle = f.col;
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(f.text, Math.round(f.x - cx), Math.round(f.y - cy - (1.25 - f.life) * 18));
      ctx.globalAlpha = 1;
    }

    if (map.name === "home") {
      ctx.fillStyle = "rgba(80, 40, 20, 0.06)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    if (state.fade > 0) {
      ctx.fillStyle = `rgba(20,8,8,${state.fade})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  function tickNpcs(dt) {
    const map = state.map;
    for (const n of map.npcs.slice()) {
      if (n.guest && n.leaving && n.happy > 0) {
        n.happy -= dt;
        if (n.happy <= 0) {
          if (map.collision[n.y]) map.collision[n.y][n.x] = false;
          map.npcs = map.npcs.filter((o) => o !== n);
        }
        continue;
      }
      if (!n.wander || n.guest) continue;
      if (n.px == null) {
        n.px = n.x * T;
        n.py = n.y * T;
      }
      if (n.moving) {
        n.t = (n.t || 0) + dt * 4.2;
        const t = Math.min(1, n.t);
        n.px = n.ox + (n.nx * T - n.ox) * t;
        n.py = n.oy + (n.ny * T - n.oy) * t;
        if (t >= 1) {
          if (map.collision[n.y]) map.collision[n.y][n.x] = false;
          n.x = n.nx;
          n.y = n.ny;
          n.px = n.x * T;
          n.py = n.y * T;
          n.moving = false;
          if (map.collision[n.y]) map.collision[n.y][n.x] = true;
        }
      } else {
        n.wait = (n.wait || 0) - dt;
        if (n.wait <= 0) {
          n.wait = 1.4 + Math.random() * 2.2;
          const dirs = [
            [0, 1, "down"],
            [0, -1, "up"],
            [1, 0, "right"],
            [-1, 0, "left"],
          ];
          const [dx, dy, dir] = dirs[(Math.random() * 4) | 0];
          const nx = n.x + dx;
          const ny = n.y + dy;
          if (nx === state.player.x && ny === state.player.y) continue;
          if (solid(map, nx, ny)) continue;
          if (map.warps.some((w) => w.x === nx && w.y === ny)) continue;
          n.dir = dir;
          n.moving = true;
          n.t = 0;
          n.nx = nx;
          n.ny = ny;
          n.ox = n.px;
          n.oy = n.py;
        }
      }
    }
  }

  for (let i = 0; i < 7; i++) {
    state.birds.push({ x: Math.random() * 480, y: 10 + Math.random() * 70, s: 16 + Math.random() * 30 });
  }
  state.flies = [];
  for (let i = 0; i < 8; i++) {
    state.flies.push({ x: 40 + Math.random() * 400, y: 40 + Math.random() * 200, i, a: Math.random() * 6 });
  }

  let last = performance.now();
  function loop(now) {
    ctx.imageSmoothingEnabled = false;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time = now;
    state.anim += dt;
    if (state.yenFlash > 0) state.yenFlash -= dt;

    if (state.player.moving) {
      state.player.t += dt * 5.6;
      const t = Math.min(1, state.player.t);
      state.player.px = state.player.ox + (state.player.nx * T - state.player.ox) * t;
      state.player.py = state.player.oy + (state.player.ny * T - state.player.oy) * t;
      if (t >= 1) {
        state.player.x = state.player.nx;
        state.player.y = state.player.ny;
        state.player.px = state.player.x * T;
        state.player.py = state.player.y * T;
        state.player.moving = false;
        SFX.step(state.map.floor || "gravel");
      }
    } else heldMove();

    if (state.fadeDir !== 0) {
      state.fade += state.fadeDir * dt * 3.2;
      if (state.fade >= 1) {
        state.fade = 1;
        applyWarp();
        state.fadeDir = -1;
      } else if (state.fade <= 0) {
        state.fade = 0;
        state.fadeDir = 0;
      }
    }

    tickNpcs(dt);

    if (state.restaurantOpen && state.mapId === "home") {
      state.spawnWait -= dt;
      if (guestCount() < 2 && state.spawnWait <= 0) {
        spawnGuests();
        state.spawnWait = 6 + Math.random() * 5;
      }
    }

    for (const p of state.petals) {
      p.y += (12 + p.s * 18) * dt;
      p.x += Math.sin(now / 600 + p.r) * 18 * dt;
      p.r += dt;
      if (p.y > 1400) {
        p.y = -20;
        p.x = Math.random() * 2000;
      }
    }
    for (const f of state.flies) {
      f.a += dt;
      f.x += Math.sin(now / 400 + f.i) * 22 * dt;
      f.y += Math.cos(now / 520 + f.i * 1.3) * 16 * dt;
      if (f.x < 0) f.x = 460;
      if (f.x > 480) f.x = 10;
      if (f.y < 20) f.y = 220;
      if (f.y > 260) f.y = 40;
    }

    for (const b of state.birds) {
      b.x += b.s * dt;
      b.y += Math.sin(now / 400 + b.s) * 8 * dt;
      if (b.x > 520) {
        b.x = -20;
        b.y = 10 + Math.random() * 80;
      }
    }

    for (let i = state.floaters.length - 1; i >= 0; i--) {
      state.floaters[i].life -= dt;
      if (state.floaters[i].life <= 0) state.floaters.splice(i, 1);
    }

    if (state.mode === "world") lookPrompt();
    hud();
    drawWorld();

    if (state.mode === "kitchen") {
      const info = renderUdon(els.bowl, state.recipe, now, 0, 0);
      els.recipeName.textContent = info.jp + " · " + info.name;
    }
    if (state.mode === "eating") {
      state.eat.lift = Math.max(0, state.eat.lift - dt * 1.8);
      renderUdon(els.eatBowl, state.eat.recipe, now, state.eat.progress, state.eat.lift);
    }
    if (state.mode === "shop") {
      const it = ITEMS[SHOP_ORDER[state.shopSel]];
      const recipe = { temp: it.id === "ice" || it.id === "chili_oil" ? "cold" : "hot", items: new Set(["udon", it.id]) };
      renderUdon(els.shopPreview, recipe, now, 0, 0);
    }

    requestAnimationFrame(loop);
  }
  window.GAME = { state, openKitchen, addItem, beginEat, spawnGuests };
  requestAnimationFrame(loop);

})();
