/*
PEC4 – Portada web animada (ECLIPSE) – Emilio Padilla
Adjuntos:
- eclipse.jpg
- Roboto-Bold.ttf
*/

let bgImg;
let fontTitle;

// Sol
let sunX, sunY;
let sunR = 90;

// Luna: izquierda a derecha + ondulación
let moonX, moonY;
let moonR = 75;
let moonVX = 3;

let moonWaveA = 14;
let moonWaveS = 0.06;
let moonWaveT = 0;

// Eclipse máximo de cada pasada
let passMaxCover = 0;

// Drop numérico
let dropActive = false;
let dropX, dropY;
let dropVY = 4;
let dropValue = 0;
let dropAlpha = 255;

// Atmósfera noise (criterio extra)
let t = 0;
let particlesCount = 60;

// Interacción (texto sí/no)
let showText = true;

function preload() {
  bgImg = loadImage("assets/eclipse.jpg");
  fontTitle = loadFont("assets/Roboto-Bold.ttf");
}

function setup() {
  const holder = document.getElementById("sketch-holder");
  let w = holder ? holder.clientWidth : windowWidth;
  let h = holder ? holder.clientHeight : windowHeight;

  let canvas = createCanvas(w, h);
  canvas.parent("sketch-holder");

  sunX = width / 2;
  sunY = height / 2;

  textFont(fontTitle);
  textAlign(LEFT, BASELINE);

  resetMoonFromLeft();
}

function draw() {
  // 1) Fondo
  image(bgImg, 0, 0, width, height);

  // 2) Movimiento luna (ondulatorio)
  moonWaveT += 1;
  moonX = moonX + moonVX;

  let wobbleY = sin(moonWaveT * moonWaveS) * moonWaveA;
  let moonDrawY = moonY + wobbleY;

  // 3) Eclipse actual
  let cover = eclipseCoverage(sunX, sunY, sunR, moonX, moonDrawY, moonR);

  // 4) Guardar máximo de esta pasada
  if (cover > passMaxCover) {
    passMaxCover = cover;
  }

  // 5) Si se esconde por la derecha: suelta número con el máximo y reinicia pasada
  if (moonX > width + moonR) {
    spawnDrop(passMaxCover);
    resetMoonFromLeft();
  }

  // 6) Velo atmosférico suave
  noStroke();
  fill(0, map(cover, 0, 1, 10, 40));
  rect(0, 0, width, height);

  // 7) Sol + halo
  drawSun(sunX, sunY, sunR, cover);

  // 8) Luna
  drawMoon(moonX, moonDrawY, moonR, cover);

  // 9) Oscurecimiento global
  fill(0, map(cover, 0, 1, 0, 220));
  rect(0, 0, width, height);

  // 10) Corona encima del oscurecimiento
  drawCorona(cover);

  // 11) Atmósfera con noise() por encima
  drawNoiseAtmosphere(cover);

  // 12) Drop numérico
  drawDrop();

  // 13) UI (si showText)
  drawUI(cover, passMaxCover);

  // tiempo para noise/corona
  t += 1;
}

// ----------------------------------------------------
// Eclipse 0..1 según distancia entre centros
function eclipseCoverage(sx, sy, sr, mx, my, mr) {
  let d = dist(sx, sy, mx, my);

  let maxD = sr + mr;
  let minD = abs(sr - mr);

  let c = map(d, maxD, minD, 0, 1);

  if (c < 0) c = 0;
  if (c > 1) c = 1;

  return c;
}

// ----------------------------------------------------
// Sol + halo
function drawSun(x, y, r, cover) {
  noStroke();

  // Halo concéntrico (circular) – baja con el eclipse
  for (let i = 7; i >= 1; i--) {
    let rr = r + i * 22;
    let a = map(i, 1, 7, 38, 6);
    a = a * (1 - cover);

    fill(255, 220, 130, a);
    ellipse(x, y, rr * 2, rr * 2);
  }

  // Disco del sol
  fill(255, 235, 160, map(cover, 0, 1, 255, 170));
  ellipse(x, y, r * 2, r * 2);
}

// ----------------------------------------------------
// Luna
function drawMoon(x, y, r, cover) {
  noStroke();
  fill(0);
  ellipse(x, y, r * 2, r * 2);

  // borde sutil
  let edgeA = map(cover, 0, 1, 90, 15);
  noFill();
  stroke(255, edgeA);
  strokeWeight(2);
  ellipse(x, y, r * 2 + 2, r * 2 + 2);
  noStroke();
}

// ----------------------------------------------------
// Corona solar
function drawCorona(cover) {
  if (cover < 0.65) return;

  let a = map(cover, 0.65, 1, 0, 160);
  if (a < 0) a = 0;
  if (a > 160) a = 160;

  noFill();
  stroke(255, 220, 120, a);
  strokeWeight(2);
  ellipse(sunX, sunY, (sunR + 10) * 2, (sunR + 10) * 2);

  strokeWeight(2);

  for (let ang = 0; ang < TWO_PI; ang += 0.12) {
    let s = sin(ang * 6 + t * 0.05);
    let len = map(s, -1, 1, 40, 120);

    let x1 = sunX + cos(ang) * (sunR + 12);
    let y1 = sunY + sin(ang) * (sunR + 12);
    let x2 = sunX + cos(ang) * (sunR + 12 + len);
    let y2 = sunY + sin(ang) * (sunR + 12 + len);

    line(x1, y1, x2, y2);
  }

  noStroke();
}

// ----------------------------------------------------
// Atmósfera orgánica con noise() (criterio extra)
function drawNoiseAtmosphere(cover) {
  let alphaMax = map(cover, 0, 1, 35, 160);
  let count = int(map(cover, 0, 1, 20, particlesCount));

  for (let i = 0; i < count; i++) {
    let nx = noise(i * 10 + t * 0.01);
    let ny = noise(200 + i * 10 + t * 0.01);

    let px = map(nx, 0, 1, 0, width);
    let py = map(ny, 0, 1, 0, height);

    let s = map(noise(400 + i * 10 + t * 0.01), 0, 1, 3, 14);

    noStroke();
    fill(255, alphaMax);
    ellipse(px, py, s, s);
  }
}

// ----------------------------------------------------
// UI (texto)
function drawUI(cover, maxCover) {
  if (!showText) return;

  fill(255);

  textSize(34);
  text("ECLIPSE", 30, 55);

  fill(255, 200);
  textSize(14);
  text("Eclipse parcial o total", 30, 80);

  // Barra coverage actual
  noStroke();
  fill(255, 60);
  rect(30, 95, 220, 10, 6);

  fill(255);
  rect(30, 95, 220 * cover, 10, 6);

  fill(255, 200);
  textSize(12);
  text("Eclipse actual: " + int(cover * 100) + "%", 260, 104);
  text("Máximo % eclipse: " + int(maxCover * 100) + "%", 260, 124);

  fill(255, 160);
  text("Pulsa N: texto / sin texto", 30, height - 25);

  textSize(10);
  fill(255, 120);
  text("Imagen base: Pixabay", width - 150, height - 10);
}

// ----------------------------------------------------
// Luna: eclipses ocasionales
function resetMoonFromLeft() {
  let r = random(0, 1);

  if (r < 0.15) {
    moonR = random(80, 100);
    moonY = sunY + random(-8, 8);
  } else if (r < 0.40) {
    moonR = random(60, 95);
    moonY = sunY + random(-70, 70);
  } else {
    moonR = random(55, 100);
    moonY = random(height * 0.10, height * 0.90);
  }

  moonX = -moonR;
  moonVX = random(2, 6);

  moonWaveA = random(6, 20);
  moonWaveS = random(0.04, 0.10);

  passMaxCover = 0;
}

// ----------------------------------------------------
// Drop: muestra el máximo eclipse de la pasada
function spawnDrop(maxCover) {
  if (dropActive) return;
  if (maxCover < 0.15) return;

  dropActive = true;
  dropX = sunX;
  dropY = sunY;

  dropValue = int(maxCover * 100);
  dropVY = random(2, 6);
  dropAlpha = 255;
}

function drawDrop() {
  if (!dropActive) return;

  dropY = dropY + dropVY;
  dropAlpha = dropAlpha - 2;
  if (dropAlpha < 0) dropAlpha = 0;

  fill(255, dropAlpha);
  textSize(28);
  text(dropValue, dropX - 12, dropY);

  if (dropY > height + 30 || dropAlpha === 0) {
    dropActive = false;
  }
}

// ----------------------------------------------------
// Interacción: N alterna texto / no texto
function keyPressed() {
  if (key === "n" || key === "N") {
    showText = !showText;
  }
}

// ----------------------------------------------------
// Resize: ajusta canvas al contenedor bajo el menú
function windowResized() {
  const holder = document.getElementById("sketch-holder");
  let w = holder ? holder.clientWidth : windowWidth;
  let h = holder ? holder.clientHeight : windowHeight;

  resizeCanvas(w, h);
  sunX = width / 2;
  sunY = height / 2;
}
