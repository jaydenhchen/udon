/* Synthesized SFX + a quiet yo-scale koto loop. */
const SFX = (() => {
  let ctx = null;
  let master;
  let musicGain;
  let mute = false;
  let musicTimer = 0;
  let step = 0;
  let ambientOn = false;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.12;
      musicGain.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function envGain(dur, peak = 0.2, start = 0.001, end = 0.001) {
    const c = ac();
    const g = c.createGain();
    g.gain.setValueAtTime(start, c.currentTime);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(end, c.currentTime + dur);
    g.connect(master);
    return g;
  }

  function tone(freq, dur, type = "sine", peak = 0.12) {
    const c = ac();
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = envGain(dur, peak);
    o.connect(g);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  function noiseBuf(dur, fn) {
    const c = ac();
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = fn(i / n, i);
    return buf;
  }

  function playBuf(buf, peak, dur, filterType, freq, q = 1) {
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filterType || "lowpass";
    f.frequency.value = freq || 1200;
    f.Q.value = q;
    const g = envGain(dur, peak);
    src.connect(f);
    f.connect(g);
    src.start();
  }

  function koto(freq, when, vel = 0.08) {
    const c = ac();
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, when);
    o.frequency.exponentialRampToValueAtTime(freq * 0.985, when + 0.4);
    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2.01;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vel, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.2);
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.0001, when);
    g2.gain.exponentialRampToValueAtTime(vel * 0.18, when + 0.008);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.25);
    o.connect(g);
    o2.connect(g2);
    g.connect(musicGain);
    g2.connect(musicGain);
    o.start(when);
    o2.start(when);
    o.stop(when + 1.3);
    o2.stop(when + 0.3);
  }

  const YO = [261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33];
  const MELODY = [4, 2, 0, 2, 3, 4, 4, -1, 3, 2, 2, 3, 4, 0, -1, -1, 2, 4, 5, 4, 3, 2, 0, 2];

  function tickMusic() {
    if (!ctx || mute) return;
    const c = ctx;
    const bpm = 76;
    const beat = 60 / bpm;
    const now = c.currentTime;
    if (now < musicTimer - 0.05) return;
    const note = MELODY[step % MELODY.length];
    if (note >= 0) koto(YO[note], Math.max(now, musicTimer), 0.07);
    if (step % 8 === 0) koto(YO[0] / 2, Math.max(now, musicTimer), 0.04);
    musicTimer = Math.max(now, musicTimer) + beat * 0.5;
    step++;
  }

  function bird() {
    if (mute || Math.random() > 0.4) return;
    const c = ac();
    const o = c.createOscillator();
    o.type = "sine";
    const f0 = 1400 + Math.random() * 900;
    o.frequency.setValueAtTime(f0, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.3, c.currentTime + 0.08);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.9, c.currentTime + 0.16);
    const g = envGain(0.18, 0.03);
    o.connect(g);
    o.start();
    o.stop(c.currentTime + 0.2);
  }

  function wind() {
    if (mute) return;
    const buf = noiseBuf(2.2, (t) => (Math.random() * 2 - 1) * (0.15 + 0.15 * Math.sin(t * 6)));
    playBuf(buf, 0.035, 2.2, "bandpass", 600, 0.4);
  }

  return {
    unlock() {
      ac();
      if (!ambientOn) {
        ambientOn = true;
        musicTimer = ac().currentTime + 0.2;
        setInterval(tickMusic, 120);
        setInterval(() => {
          if (!mute && document.visibilityState === "visible") {
            if (Math.random() < 0.35) bird();
            if (Math.random() < 0.12) wind();
          }
        }, 2200);
      }
    },
    toggleMute() {
      mute = !mute;
      if (master) master.gain.value = mute ? 0 : 0.55;
      return mute;
    },
    isMute() {
      return mute;
    },
    step(kind) {
      if (mute) return;
      const buf = noiseBuf(0.07, (t) => (Math.random() * 2 - 1) * (1 - t));
      playBuf(buf, 0.08, 0.07, "lowpass", kind === "wood" ? 700 : 1400, 0.7);
      tone(kind === "wood" ? 140 : 190, 0.05, "sine", 0.03);
    },
    bump() {
      tone(90, 0.08, "square", 0.04);
    },
    ui() {
      tone(660, 0.05, "sine", 0.05);
      tone(990, 0.08, "sine", 0.03);
    },
    door() {
      const buf = noiseBuf(0.28, (t) => (Math.random() * 2 - 1) * (1 - t));
      playBuf(buf, 0.1, 0.28, "bandpass", 420, 2);
      tone(220, 0.2, "triangle", 0.05);
    },
    bell() {
      tone(784, 0.4, "sine", 0.1);
      tone(1175, 0.55, "sine", 0.07);
    },
    buy() {
      tone(523, 0.08, "triangle", 0.08);
      tone(659, 0.12, "triangle", 0.07);
      tone(784, 0.18, "triangle", 0.06);
    },
    pour() {
      const buf = noiseBuf(0.45, (t) => (Math.random() * 2 - 1) * Math.pow(1 - t, 0.5));
      playBuf(buf, 0.12, 0.45, "bandpass", 1800, 0.8);
    },
    boil() {
      const buf = noiseBuf(0.5, () => (Math.random() * 2 - 1) * 0.7);
      playBuf(buf, 0.07, 0.5, "highpass", 400, 0.5);
    },
    sizzle() {
      const buf = noiseBuf(0.4, (t) => (Math.random() * 2 - 1) * (1 - t * 0.5));
      playBuf(buf, 0.1, 0.4, "highpass", 2500, 0.6);
    },
    ice() {
      tone(1800, 0.04, "sine", 0.05);
      tone(2400, 0.06, "sine", 0.04);
      tone(900, 0.08, "triangle", 0.03);
    },
    chop() {
      const buf = noiseBuf(0.06, (t) => (Math.random() * 2 - 1) * (1 - t));
      playBuf(buf, 0.12, 0.06, "lowpass", 1800);
      tone(180, 0.05, "square", 0.04);
    },
    slurp() {
      if (mute) return;
      const c = ac();
      const dur = 0.38;
      const buf = noiseBuf(dur, (t) => {
        const wob = 0.5 + 0.5 * Math.sin(t * 40 + Math.sin(t * 70));
        return (Math.random() * 2 - 1) * (1 - t) * wob;
      });
      const src = c.createBufferSource();
      src.buffer = buf;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(700, c.currentTime);
      bp.frequency.exponentialRampToValueAtTime(2100, c.currentTime + dur);
      bp.Q.value = 5;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.55, c.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start();
      tone(220, 0.12, "sine", 0.04);
    },
    yum() {
      tone(392, 0.12, "sine", 0.06);
      tone(494, 0.16, "sine", 0.05);
      tone(587, 0.28, "sine", 0.05);
    },
    itadakimasu() {
      tone(330, 0.12, "triangle", 0.06);
      setTimeout(() => tone(392, 0.12, "triangle", 0.06), 90);
      setTimeout(() => tone(523, 0.2, "triangle", 0.07), 180);
    },
    gochiso() {
      tone(523, 0.14, "sine", 0.07);
      tone(659, 0.2, "sine", 0.06);
      tone(784, 0.35, "sine", 0.06);
    },
    blossom() {
      tone(988, 0.2, "sine", 0.03);
    },
    coin() {
      tone(784, 0.07, "triangle", 0.08);
      tone(1046, 0.1, "triangle", 0.07);
      tone(1318, 0.18, "sine", 0.06);
    },
  };
})();
