// ---------------------------------------------------------------------------
// photographerSprite.ts -- Thea the photographer, as a walking sprite
//
// Her head + hair + red top come straight from the hand-inked sketch
// ("Contact Photo Figure"): the cream background was flood-filled away and the
// cutout mirrored to face right — served from /photographer-head.png. Only the
// legs, arm, camera and shutter flash are drawn procedurally, so the walk and
// the "raise the camera" beat stay animated. Geometry is drawn facing RIGHT
// with the feet at the local origin (0,0) and "up" as negative-y; the renderer
// flips the canvas to face left.
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;

/** Height of the fixed bottom strip the figure lives in (px). */
export const STRIP_HEIGHT = 150;

/** Gap from the strip's bottom edge to the figure's feet (px). */
export const FOOT_MARGIN = 22;

/** Number of frames in the walk cycle. */
export const WALK_FRAMES = 4;

/** Overall opacity of the figure — present, but a hair soft. */
export const FIGURE_ALPHA = 0.96;

/** Path (public/) of the sketch-head cutout, already mirrored to face right. */
export const HEAD_SRC = "/photographer-head.png";

// Procedural palette (matched to the sketch's ink / fill / red).
const INK = "#20202e";
const FILL = "#f6f4ef";
const RED = "#f24e4b"; // sampled from the sketch's halter top
const BORDER = 1.7;

// ---- placement of the sketch head/body image within the local frame ----
const IMG_SCALE = 0.125; // multiplies the image's natural px
const IMG_CX = 1.5; // local x of the image's horizontal center
const IMG_BOTTOM = -39; // local y of the image's bottom (its flared red edge)
// The sketch crops her at mid-torso; these continue the red top down to a hem.
const REDBL: Pt = [-8.3, IMG_BOTTOM]; // image red bottom-left (measured)
const REDBR: Pt = [14.1, IMG_BOTTOM]; // image red bottom-right
const HEML: Pt = [-1.5, -14]; // hemline left (lowered + tapered in, slim waist)
const HEMR: Pt = [7, -14]; // hemline right
const HEMC: Pt = [2.75, -11.5]; // hemline curve control
const HIP: Pt = [2.75, -14];
const GROUND = 16; // feet line — also sets the leg length
const SHOULDER: Pt = [4, -54];
const EYE: Pt = [11.5, -71]; // where the raised camera meets her eye
const DOWN_HAND: Pt = [11, -34];
const DOWN_CAM: Pt = [14, -35];

export interface DrawOptions {
  /** True while striding (legs + arm swing); false while planted/shooting. */
  walking: boolean;
  /** Walk-cycle frame index (0..WALK_FRAMES-1). */
  frame: number;
  /** 0 = camera slung at the side, 1 = raised to the eye. */
  raiseAmt: number;
  /** 0..1 brightness of the shutter flash bloom. */
  flashAlpha: number;
}

type Pt = [number, number];

function lerp(a: Pt, b: Pt, t: number): Pt {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** An outlined limb: a dark capsule with a cream core (two stroked passes). */
function limb(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number): void {
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  ctx.strokeStyle = FILL;
  ctx.lineWidth = Math.max(1, w - 2 * BORDER);
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

/** One continuous outlined limb through several points — no seam at the joints. */
function limbPath(ctx: CanvasRenderingContext2D, pts: Pt[], w: number): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  };
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  trace();
  ctx.stroke();
  ctx.strokeStyle = FILL;
  ctx.lineWidth = Math.max(1, w - 2 * BORDER);
  trace();
  ctx.stroke();
}

/** An outlined shoe pointing forward (+x), matching the leg's line style. */
function drawShoe(ctx: CanvasRenderingContext2D, foot: Pt): void {
  const x = foot[0];
  const y = foot[1];
  const s = 1.4; // shoe scale about the foot point
  ctx.fillStyle = FILL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 1.8 * s, y - 2.4 * s); // ankle back
  ctx.quadraticCurveTo(x - 3.2 * s, y + 1.4 * s, x - 0.6 * s, y + 2.4 * s); // heel
  ctx.lineTo(x + 5 * s, y + 2.4 * s); // sole
  ctx.quadraticCurveTo(x + 7.2 * s, y + 2.4 * s, x + 6 * s, y + 0.2 * s); // toe up
  ctx.lineTo(x + 2.2 * s, y - 1.6 * s); // instep back toward ankle
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** A bent leg (thigh + shin) from the hip to a foot, with a shoe. */
function drawLeg(ctx: CanvasRenderingContext2D, foot: Pt): void {
  const lift = GROUND - foot[1];
  const bend = 0.8 + lift * 0.5; // gentler bend — straighter legs
  const knee: Pt = [(HIP[0] + foot[0]) / 2 + bend, (HIP[1] + foot[1]) / 2];
  limbPath(ctx, [HIP, knee, foot], 7.2);
  drawShoe(ctx, foot);
}

/**
 * Redraw the ponytail. The sketch's lock is a dark outline with no fill, so it
 * vanishes on dark pages; it's also wide. We erase the sketch's lock where it
 * lies over the background, then draw a narrower, white-filled lock that reads
 * on any background.
 */
function drawPonytail(ctx: CanvasRenderingContext2D): void {
  // 1. erase the sketch's wide lock over the background (right edge stays left
  //    of the head's back at ~ -13). Force alpha to 1 so it clears fully.
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(-13.5, -64);
  ctx.lineTo(-24, -64);
  ctx.lineTo(-24, -31);
  ctx.lineTo(-13.5, -31);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 2. narrower, tapered white-filled lock, ring -> tip
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(-8.8, -66);
    ctx.quadraticCurveTo(-14, -54, -14.5, -43);
    ctx.quadraticCurveTo(-14.2, -38, -13, -36.5); // tip
    ctx.quadraticCurveTo(-11, -39, -10.8, -43);
    ctx.quadraticCurveTo(-9.6, -54, -7.8, -66);
  };
  ctx.fillStyle = FILL;
  trace();
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.95;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  trace();
  ctx.stroke();
}

/** Continue the sketch's red top from its cropped flared edge down to a hem. */
function torsoExtension(ctx: CanvasRenderingContext2D): void {
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(REDBL[0], REDBL[1] - 1.5); // overlap up into the image
    ctx.lineTo(HEML[0], HEML[1]);
    ctx.quadraticCurveTo(HEMC[0], HEMC[1], HEMR[0], HEMR[1]);
    ctx.lineTo(REDBR[0], REDBR[1] - 1.5);
  };
  trace();
  ctx.closePath();
  ctx.fillStyle = RED;
  ctx.fill();
  // Outline the sides + hem only — the top edge meets the image seamlessly.
  trace();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

/**
 * Draw Thea at the local origin, facing right. Caller owns the outer
 * save/restore, the translate to (x, baselineY), any facing flip, the vertical
 * walk-bob, and setting globalAlpha to FIGURE_ALPHA beforehand.
 *
 * `head` is the loaded sketch-head image; if it isn't ready yet nothing draws.
 */
export function drawPhotographer(
  ctx: CanvasRenderingContext2D,
  { walking, frame, raiseAmt, flashAlpha }: DrawOptions,
  head: HTMLImageElement | null,
): void {
  if (!head || !head.complete || !head.naturalWidth) return;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const cyc = (frame / WALK_FRAMES) * TAU;
  const stride = 6.5;

  // ---- legs: natural stride (near + far, opposite phase) or planted stance ----
  const nearFoot: Pt = walking
    ? [Math.sin(cyc) * stride, GROUND - Math.max(0, -Math.cos(cyc)) * 3.5]
    : [3, GROUND];
  const farFoot: Pt = walking
    ? [Math.sin(cyc + Math.PI) * stride, GROUND - Math.max(0, -Math.cos(cyc + Math.PI)) * 3.5]
    : [-4, GROUND];

  drawLeg(ctx, farFoot); // far leg (behind)

  // ---- head + hair + red top: the sketch cutout ----
  const iw = head.naturalWidth * IMG_SCALE;
  const ih = head.naturalHeight * IMG_SCALE;
  ctx.drawImage(head, IMG_CX - iw / 2, IMG_BOTTOM - ih, iw, ih);

  drawPonytail(ctx); // hide the sketch's lock; draw a narrower, filled one
  torsoExtension(ctx); // extend the cropped torso down to a hemline

  drawLeg(ctx, nearFoot); // near leg (in front)

  // ---- near arm + camera (blended between slung and raised) ----
  const upHand: Pt = [EYE[0] + 1, EYE[1] + 1];
  const upCam: Pt = [EYE[0] + 6, EYE[1]];
  const hand = lerp(DOWN_HAND, upHand, raiseAmt);
  const cam = lerp(DOWN_CAM, upCam, raiseAmt);

  // camera strap (fades out as the camera rises)
  if (raiseAmt < 0.5) {
    ctx.save();
    ctx.globalAlpha *= 1 - raiseAmt * 2;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(2, -50);
    ctx.lineTo(cam[0] - 2, cam[1] - 2);
    ctx.stroke();
    ctx.restore();
  }

  limb(ctx, SHOULDER, hand, 5.6);

  // ---- camera: a compact stills camera silhouette (lens faces +x) ----
  const cx = cam[0];
  const cy = cam[1];
  const rrect = (rx: number, ry: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(rx, ry, w, h, r);
    else ctx.rect(rx, ry, w, h);
    ctx.fill();
    ctx.stroke();
  };
  // Matches the reference icon, turned so the ringed lens points forward (+x):
  // a body block at the eye, then the lens built from rings out to a flared hood.
  ctx.fillStyle = FILL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";

  // body block (sits back near the eye)
  rrect(cx - 8.5, cy - 5, 9, 10, 2);
  // shutter-release bump on the top plate
  rrect(cx - 6.6, cy - 6.4, 2.6, 1.6, 0.5);
  // small back dial / viewfinder detail
  ctx.beginPath();
  ctx.arc(cx - 6.1, cy - 0.4, 1.5, 0, TAU);
  ctx.fillStyle = FILL;
  ctx.fill();
  ctx.stroke();

  // lens: concentric rings from the mount out to a flared front hood
  ctx.fillStyle = FILL;
  rrect(cx - 0.5, cy - 3.6, 2.4, 7.2, 0.8); // mount ring
  rrect(cx + 1.9, cy - 4.3, 3.4, 8.6, 1); // barrel
  rrect(cx + 5.3, cy - 4.7, 3.6, 9.4, 1); // zoom ring (ribbed below)
  rrect(cx + 8.9, cy - 5.4, 2.3, 10.8, 1); // flared front hood

  // grip ribs on the zoom ring
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (const rx of [6.2, 7.1, 8.0]) {
    ctx.beginPath();
    ctx.moveTo(cx + rx, cy - 3.4);
    ctx.lineTo(cx + rx, cy + 3.4);
    ctx.stroke();
  }

  // dark lens opening at the front + a glass glint
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx + 10.7, cy, 1.1, 4.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(cx + 10.5, cy - 1.6, 0.5, 1.3, 0, 0, TAU);
  ctx.fill();

  // shutter flash — a soft white bloom that reads on dark backgrounds.
  if (flashAlpha > 0.01) {
    const lens: Pt = [cam[0] + 11, cam[1]];
    ctx.save();
    ctx.globalAlpha = Math.min(1, flashAlpha);
    // white bloom — additive, for dark backgrounds
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(lens[0], lens[1], 0, lens[0], lens[1], 60);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.32, "rgba(255,255,255,0.72)");
    g.addColorStop(0.62, "rgba(255,255,255,0.3)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lens[0], lens[1], 60, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}
