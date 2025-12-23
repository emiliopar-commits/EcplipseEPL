/*
PEC4 – Portada web animada (ECLIPSE) – Emilio Padilla
Versión web fullscreen (GitHub/Netlify) – Ajuste responsive

Adjuntos:
- assets/eclipse.jpg
- assets/Roboto-Bold.ttf
*/

let bgImg;
let fontTitle;

// Sol
let sunX, sunY;
let sunR; // ahora es responsive

// Luna: izquierda a derecha + ondulación
let moonX, moonY;
let moonR;
let moonVX;

let moonWaveA;
let moonWaveS;
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
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");

  // Ajuste responsive inicial
  applyResponsiveLayout();

  textFont(fontTitle);
  textAlign(LEFT, BASELINE);

  resetMoonFromLeft();
}

function draw() {
  // 1) Fondo (cover, sin deformar)
  drawBackgroundCover(bgImg);

  // 2) Movimiento luna (ondulatorio)
  moonWaveT += 1;
  moonX = moonX + moonVX;

  let wobbleY = sin(moonWaveT * moonWaveS) * moonWaveA;
  let moonDrawY = moonY + wobbleY;

  // 3) Eclipse actual
  let cover = eclipseCoverage(sunX, sunY, sunR, moonX, moonDrawY, moonR);

  // 4) Guardar máximo de esta pasada
  if (cover > passMaxCover) passMaxCover = cover;

  // 5) Si se esconde por la derecha: suelta número con el máximo y reinicia pasada
  if (moonX > width + moonR) {
    spawnDrop(passMaxCover);
    resetMoonFromLeft();
  }

  // 6) Velo atmosférico suave (antes del sol)
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
// Fondo “cover”: rellena el canvas sin deformar la imagen
function drawBackgroundCover(img) {
  // Evitar fallos si aún no está lista
  if (!img) return;

  let canvasRatio = width / height;
  let imgRatio = img.width / img.height;

  let sx, sy, sw, sh;

  if (imgRatio > canvasRatio) {
    // la imagen es más ancha -> recorta lados
    sh = img.height;
    sw = sh * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // la imagen es más alta -> recorta arriba/abajo
    sw = img.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  image(img, 0, 0, width, height, sx, sy, sw, sh);
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

  // Halo concéntrico – baja con el eclipse
  // Mantengo tu lógica, pero escalada
  let rings = 7;
  let ringStep = r * 0.24; // antes ~22 para r=90 => 0.244

  for (let i = rings; i >= 1; i--) {
    let rr = r + i * ringStep;
    let a = map(i, 1, rings, 38, 6);
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
  strokeWeight(max(1, r * 0.02)); // antes 2 fijo
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

  // 1) Anillo brillante
  noFill();
  stroke(255, 220, 120, a);
  strokeWeight(max(1, sunR * 0.02));
  ellipse(sunX, sunY, (sunR + sunR * 0.11) * 2, (sunR + sunR * 0.11) * 2);

  // 2) Rayos
  strokeWeight(max(1, sunR * 0.02));

  for (let ang = 0; ang < TWO_PI; ang += 0.12) {
    let s = sin(ang * 6 + t * 0.05);
    let len = map(s, -1, 1, sunR * 0.45, sunR * 1.35); // antes 40..120

    let x1 = sunX + cos(ang) * (sunR + sunR * 0.13);
    let y1 = sunY + sin(ang) * (sunR + sunR * 0.13);
    let x2 = sunX + cos(ang) * (sunR + sunR * 0.13 + len);
    let y2 = sunY + sin(ang) * (sunR + sunR * 0.13 + len);

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

    let s = map(noise(400 + i * 10 + t * 0.01), 0, 1, 3, max(10, sunR * 0.16));

    noStroke();
    fill(255, alphaMax);
    ellipse(px, py, s, s);
  }
}

// ----------------------------------------------------
// UI (texto) responsive
function drawUI(cover, maxCover) {
  if (!showText) return;

  let margin = max(18, min(width, height) * 0.03);

  // Tamaños responsive (antes 34/14/12/10)
  let titleSize = max(22, min(width, height) * 0.055);
  let subSize = max(12, min(width, height) * 0.022);
  let smallSize = max(11, min(width, height) * 0.018);
  let tinySize = max(10, min(width, height) * 0.015);

  fill(255);
  textSize(titleSize);
  text("ECLIPSE", margin, margin + titleSize);

  fill(255, 200);
  textSize(subSize);
  text("Eclipse parcial o total", margin, margin + titleSize + subSize + 6);

  // Barra coverage actual
  let barW = min(260, width * 0.28);
  let barH = max(10, min(width, height) * 0.018);

  noStroke();
  fill(255, 60);
  rect(margin, margin + titleSize + subSize + 22, barW, barH, 6);

  fill(255);
  rect(margin, margin + titleSize + subSize + 22, barW * cover, barH, 6);

  fill(255, 200);
  textSize(smallSize);

  let infoX = margin + barW + 14;
  let infoY = margin + titleSize + subSize + 22 + barH - 1;

  // Si la pantalla es estrecha, bajamos la info debajo de la barra
  if (width < 720) {
    infoX = margin;
    infoY = margin + titleSize + subSize + 22 + barH + smallSize + 10;
  }

  text("Eclipse actual: " + int(cover * 100) + "%", infoX, infoY);
  text("Máximo % eclipse: " + int(maxCover * 100) + "%", infoX, infoY + smallSize + 6);

  // Footer UI
  fill(255, 160);
  textSize(tinySize);
  text("Pulsa N: texto / sin texto", margin, height - margin);

  textSize(tinySize - 1);
  fill(255, 120);
  text("Imagen base: Pixabay", width - margin - textWidth("Imagen base: Pixabay"), height - margin);
}

// ----------------------------------------------------
// Luna: eclipses ocasionales (responsive)
function resetMoonFromLeft() {
  // Probabilidades iguales que tu versión
  let r = random(0, 1);

  // Rangos basados en sunR (para mantener “look & feel”)
  if (r < 0.15) {
    moonR = random(sunR * 0.90, sunR * 1.10);
    moonY = sunY + random(-sunR * 0.08, sunR * 0.08);
  } else if (r < 0.40) {
    moonR = random(sunR * 0.70, sunR * 1.05);
    moonY = sunY + random(-sunR * 0.80, sunR * 0.80);
  } else {
    moonR = random(sunR * 0.65, sunR * 1.10);
    moonY = random(height * 0.10, height * 0.90);
  }

  moonX = -moonR;

  // Velocidad adaptada al ancho (antes 2..6)
  moonVX = map(width, 360, 1400, 2.2, 6.2);
  moonVX = constrain(moonVX, 2.2, 6.2);
  moonVX = moonVX * random(0.9, 1.15);

  // Ondulación adaptada
  moonWaveA = random(sunR * 0.07, sunR * 0.22); // antes 6..20
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

  // caída responsive (antes 2..6)
  dropVY = random(2, 6) * map(min(width, height), 360, 1400, 0.9, 1.2);
  dropAlpha = 255;
}

function drawDrop() {
  if (!dropActive) return;

  dropY = dropY + dropVY;
  dropAlpha = dropAlpha - 2;
  if (dropAlpha < 0) dropAlpha = 0;

  fill(255, dropAlpha);

  let dropSize = max(22, min(width, height) * 0.05); // antes 28
  textSize(dropSize);

  // centrado visual del número
  let s = str(dropValue);
  text(s, dropX - textWidth(s) / 2, dropY);

  if (dropY > height + 40 || dropAlpha === 0) {
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
// Layout responsive: recalcula tamaños clave al cambiar pantalla
function applyResponsiveLayout() {
  sunX = width / 2;
  sunY = height / 2;

  // 90 cuando alto ~550 => 90/550 ≈ 0.163
  sunR = min(width, height) * 0.163;
  sunR = constrain(sunR, 55, 150);

  // Partículas: aumenta un poco en pantallas grandes
  particlesCount = int(map(min(width, height), 360, 1400, 50, 90));
  particlesCount = constrain(particlesCount, 50, 90);
}

// ----------------------------------------------------
// Fullscreen real
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  applyResponsiveLayout();
}
