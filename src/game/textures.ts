import * as THREE from "three";

// Canvas-generated textures for the city — shared, generated once.

function canvas(size = 128): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!];
}

function tex(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function asphaltTexture() {
  const [c, ctx] = canvas(128);
  ctx.fillStyle = "#3a3a40";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#424248" : "#333338";
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  // Edge lines + center dashes (runs along the V axis)
  ctx.fillStyle = "#d8d5c8";
  ctx.fillRect(3, 0, 3, 128);
  ctx.fillRect(122, 0, 3, 128);
  ctx.fillStyle = "#e8c14a";
  for (let y = 0; y < 128; y += 32) ctx.fillRect(62, y, 4, 18);
  return tex(c);
}

export function sidewalkTexture() {
  const [c, ctx] = canvas(64);
  ctx.fillStyle = "#b9b3a4";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "#a49e8f";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 32, 32);
  ctx.strokeRect(32, 32, 32, 32);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = "#b0aa9b";
    ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
  }
  return tex(c, 8);
}

export function groundTexture() {
  const [c, ctx] = canvas(128);
  ctx.fillStyle = "#8f9b62";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = ["#7f8b55", "#98a46c", "#86925f"][Math.floor(Math.random() * 3)];
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
  }
  return tex(c, 30);
}

export function facadeTexture(color: string, lit: boolean) {
  const [c, ctx] = canvas(64);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  for (let wy = 0; wy < 2; wy++) {
    for (let wx = 0; wx < 2; wx++) {
      const x = 10 + wx * 26;
      const y = 10 + wy * 26;
      ctx.fillStyle = lit ? "#f5d98a" : "#2f3b4c";
      ctx.fillRect(x, y, 12, 14);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(x, y, 12, 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function signTexture(label: string, bg: string, fg = "#ffffff") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = fg;
  ctx.font = "bold 64px 'Space Grotesk', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fit = label.length > 14 ? 46 : 58;
  ctx.font = `bold ${fit}px 'Space Grotesk', Arial, sans-serif`;
  ctx.fillText(label, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function kekeTexture() {
  const [c, ctx] = canvas(128);
  ctx.fillStyle = "#f2c230";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, 128, 34);
  ctx.fillStyle = "#f2c230";
  ctx.fillRect(8, 44, 112, 40);
  ctx.fillStyle = "#e2574c";
  ctx.font = "bold 30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("LAGOS", 64, 74);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
