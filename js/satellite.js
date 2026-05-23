/**
 * satellite.js — Three.js OBJ satellite on a GSAP scroll-driven path
 * The canvas is position:fixed, moved across viewport via GSAP ScrollTrigger.
 * The Three.js model auto-rotates inside and reacts to mouse/touch drag.
 *
 * SETUP: Put your model in assets/satellite/satellite.obj
 * Edit OBJ_PATH below if your filename differs.
 */
'use strict';

const OBJ_PATH        = 'assets/satellite/Satellite.obj';
const CANVAS_SIZE     = 900;
const CAMERA_Z        = 3.2;
const AUTO_ROTATE_SPD = 220; // Higher number = slower idle spin.
const SCRUB_SPEED     = 1.8;

/*
 * Scroll waypoints are expressed as viewport fractions so the satellite can
 * stay compositionally useful across devices. Keep every profile the same
 * length and the same p values; ScrollTrigger reuses these indexes on refresh.
 */
const WAYPOINTS = {
  desktop: [
    { p: 0.00, x: 0.64, y: 0.45, rotZ:  -1, scale: 1.58 },
    { p: 0.15, x: 0.80, y: 0.30, rotZ:  -8, scale: 0.78 },
    { p: 0.40, x: 0.15, y: 0.28, rotZ: -72, scale: 0.66 },
    { p: 0.60, x: 0.88, y: 0.70, rotZ: -52, scale: 1.72 },
    { p: 1.00, x: -0.48, y: 0.66, rotZ:  90, scale: 1.58 },
    { p: 1.00, x: 0.50, y: 1.50, rotZ:   0, scale: 1.50 },
    { p: 1.20, x: 0.52, y: 0.75, rotZ:   0, scale: 1.50 },
  ],
  tablet: [
    { p: 0.00, x: 0.66, y: 0.42, rotZ:  -1, scale: 0.82 },
    { p: 0.20, x: 0.28, y: 0.14, rotZ: -12, scale: 0.58 },
    { p: 0.40, x: 0.18, y: 0.40, rotZ: -62, scale: 0.50 },
    { p: 0.60, x: 0.82, y: 0.68, rotZ: -44, scale: 0.54 },
    { p: 0.80, x: -0.18, y: 0.62, rotZ:  80, scale: 0.46 },
    { p: 1.00, x: 0.58, y: 0.76, rotZ:   0, scale: 0.82 },
  ],
  mobile: [
    { p: 0.00, x: 0.58, y: 0.36, rotZ:  -1, scale: 0.48 },
    { p: 0.20, x: 0.22, y: 0.16, rotZ: -10, scale: 0.34 },
    { p: 0.40, x: 0.14, y: 0.42, rotZ: -56, scale: 0.32 },
    { p: 0.60, x: 0.78, y: 0.70, rotZ: -38, scale: 0.34 },
    { p: 0.80, x: -0.08, y: 0.62, rotZ:  72, scale: 0.30 },
    { p: 1.00, x: 0.55, y: 0.72, rotZ:   0, scale: 0.48 },
  ],
};

class SatelliteViewer {
  constructor() {
    this.canvas = document.getElementById('sat-canvas');
    this.loader = document.getElementById('sat-loader');
    if (!this.canvas) return;
    if (typeof THREE === 'undefined') {
      console.warn('[satellite.js] Three.js not found.');
      return;
    }
    this.renderer = null; this.scene = null; this.camera = null; this.model = null;
    this._autoRot = true; this._dragging = false;
    this._prevMouse = { x: 0, y: 0 };
    this._rot = { x: -0.18, y: 0.5 };
    this._tgtRot = { x: -0.18, y: 0.5 };

    this._setupCanvas();
    this._setupRenderer();
    this._setupScene();
    this._setupLights();
    this._loadModel();
    this._setupScrollPath();
    this._bindEvents();
    this._loop();
  }

  _getWaypoints() {
    const w = window.innerWidth;
    if (w <= 640) return WAYPOINTS.mobile;
    if (w <= 1100) return WAYPOINTS.tablet;
    return WAYPOINTS.desktop;
  }

  _setupCanvas() {
    const wp0 = this._getWaypoints()[0];
    const x = wp0.x * window.innerWidth;
    const y = wp0.y * window.innerHeight;
    Object.assign(this.canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: CANVAS_SIZE + 'px', height: CANVAS_SIZE + 'px',
      zIndex: '1', pointerEvents: 'none',
      transform: `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${wp0.rotZ}deg) scale(${wp0.scale})`,
      cursor: 'grab',
      filter: 'drop-shadow(0 0 24px rgba(77,166,255,0.4)) drop-shadow(0 8px 32px rgba(0,0,0,0.6))',
    });
    if (this.loader) {
      Object.assign(this.loader.style, {
        position: 'fixed', top: '0', left: '0',
        width: CANVAS_SIZE + 'px', height: CANVAS_SIZE + 'px',
        transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(${wp0.scale})`,
        zIndex: '2', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        pointerEvents: 'none', background: 'rgba(5,8,16,0.7)',
        borderRadius: '50%',
      });
    }
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
    this.renderer.outputEncoding          = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping             = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure     = 1.5;
    this.renderer.shadowMap.enabled       = true;
    this.renderer.shadowMap.type          = THREE.PCFSoftShadowMap;
  }

  _setupScene() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 0.1, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x334466, 0.7));
    const sun = new THREE.DirectionalLight(0xfff6e8, 4.0);
    sun.position.set(-3, 4, 3); sun.castShadow = true;
    sun.shadow.mapSize.setScalar(2048);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4488ff, 1.4);
    rim.position.set(5, -1, -4);
    this.scene.add(rim);
    this.scene.add(new THREE.PointLight(0x22aacc, 0.5, 20));
    this.scene.add(new THREE.HemisphereLight(0x223355, 0x111122, 0.4));
  }

  _loadModel() {
    const onErr  = () => this._showFallback();
    const onProg = (xhr) => {
      if (xhr.lengthComputable && this.loader) {
        const span = this.loader.querySelector('span');
        if (span) span.textContent = `Loading... ${Math.round(xhr.loaded / xhr.total * 100)}%`;
      }
    };
    const loader = new THREE.OBJLoader();
    loader.load(OBJ_PATH, obj => this._onLoaded(obj), onProg, onErr);
  }

  _onLoaded(obj) {
    const box    = new THREE.Box3().setFromObject(obj);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    obj.scale.setScalar(2.0 / maxDim);
    obj.position.sub(center.multiplyScalar(2.0 / maxDim));
    obj.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = child.receiveShadow = true;
      if (!child.material?.map) this._fallbackMat(child);
    });
    this.model = obj;
    this.scene.add(obj);
    if (this.loader) {
      this.loader.style.transition = 'opacity 0.5s ease';
      this.loader.style.opacity = '0';
      setTimeout(() => { if (this.loader) this.loader.style.display = 'none'; }, 500);
    }
    this.canvas.style.pointerEvents = 'none';
    console.info('[satellite.js] Model loaded.');
  }

  _fallbackMat(mesh) {
    const tl = new THREE.TextureLoader();
    const diffuse  = tl.load('assets/satellite/textures/BaseColor.jpg');
    const normal   = tl.load('assets/satellite/textures/Normal.jpg');
    const metRough = tl.load('assets/satellite/textures/Metallic.jpg');
    diffuse.encoding = THREE.sRGBEncoding;

    // The asset ships as OBJ-only, so we assign the PBR maps manually.
    mesh.material = new THREE.MeshStandardMaterial({
      map: diffuse, normalMap: normal,
      metalnessMap: metRough, roughnessMap: metRough,
      metalness: 0.8, roughness: 0.35,
    });
  }

  _showFallback() {
    if (this.loader) {
      const span = this.loader.querySelector('span');
      if (span) span.textContent = 'Add satellite.obj to assets/satellite/';
      const ring = this.loader.querySelector('.sat-loader-ring');
      if (ring) ring.style.display = 'none';
    }
    const group  = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0x4da6ff, metalness: 0.75, roughness: 0.25 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.04, 16, 80),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.6, roughness: 0.3 })
    );
    ring.rotation.x = Math.PI / 2.5;
    group.add(sphere, ring);
    this.model = group;
    this.scene.add(group);
    this.canvas.style.pointerEvents = 'none';
    if (this.loader) {
      this.loader.style.transition = 'opacity 0.5s ease';
      this.loader.style.opacity = '0';
      setTimeout(() => { if (this.loader) this.loader.style.display = 'none'; }, 500);
    }
  }

  _setupScrollPath() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      this._rafScrollFallback(); return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const els = [this.canvas, this.loader].filter(Boolean);
    const wps = this._getWaypoints();

    gsap.set(els, {
      x: () => this._getWaypoints()[0].x * window.innerWidth,
      y: () => this._getWaypoints()[0].y * window.innerHeight,
      xPercent: -50,
      yPercent: -50,
      rotation: () => this._getWaypoints()[0].rotZ,
      scale: () => this._getWaypoints()[0].scale,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body, start: 'top top', end: 'bottom bottom',
        scrub: SCRUB_SPEED, invalidateOnRefresh: true,
      },
    });

    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i], b = wps[i + 1];
      tl.to(els, {
        x: () => this._getWaypoints()[i + 1].x * window.innerWidth,
        y: () => this._getWaypoints()[i + 1].y * window.innerHeight,
        rotation: () => this._getWaypoints()[i + 1].rotZ,
        scale: () => this._getWaypoints()[i + 1].scale,
        ease: 'power2.inOut',
        duration: b.p - a.p,
      }, a.p);
    }

    window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
  }

  _rafScrollFallback() {
    const canvas = this.canvas;
    let wps = this._getWaypoints();
    let cx = wps[0].x * window.innerWidth, cy = wps[0].y * window.innerHeight, cr = wps[0].rotZ, cs = wps[0].scale;
    let tx = cx, ty = cy, tr = cr, ts = cs;
    window.addEventListener('scroll', () => {
      wps = this._getWaypoints();
      const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      let a = wps[0], b = wps[wps.length - 1];
      for (let i = 0; i < wps.length - 1; i++) {
        if (p >= wps[i].p && p <= wps[i+1].p) { a = wps[i]; b = wps[i+1]; break; }
      }
      const t = (p - a.p) / ((b.p - a.p) || 1);
      tx = (a.x + (b.x - a.x) * t) * window.innerWidth;
      ty = (a.y + (b.y - a.y) * t) * window.innerHeight;
      tr = a.rotZ + (b.rotZ - a.rotZ) * t;
      ts = a.scale + (b.scale - a.scale) * t;
    }, { passive: true });
    (function move() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07; cr += (tr - cr) * 0.07; cs += (ts - cs) * 0.07;
      canvas.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%) rotate(${cr}deg) scale(${cs})`;
      requestAnimationFrame(move);
    })();
  }

  _loop() {
    this.raf = requestAnimationFrame(() => this._loop());
    if (!this.model) { this.renderer.render(this.scene, this.camera); return; }
    if (this._autoRot && !this._dragging) {
      this._tgtRot.y += 1 / AUTO_ROTATE_SPD;
    }

    this._rot.x += (this._tgtRot.x - this._rot.x) * 0.08;
    this._rot.y += (this._tgtRot.y - this._rot.y) * 0.08;
    this.model.rotation.x = this._rot.x;
    this.model.rotation.y = this._rot.y;
    this.model.position.y = Math.sin(Date.now() * 0.0008) * 0.04;
    this.renderer.render(this.scene, this.camera);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this.renderer.setSize(CANVAS_SIZE, CANVAS_SIZE), { passive: true });
    this.canvas.addEventListener('mousedown', e => this._dragStart(e));
    window.addEventListener('mousemove',  e => this._dragMove(e));
    window.addEventListener('mouseup',    () => this._dragEnd());
    this.canvas.addEventListener('touchstart', e => this._dragStart(e.touches[0]), { passive: true });
    window.addEventListener('touchmove',  e => this._dragMove(e.touches[0]), { passive: true });
    window.addEventListener('touchend',   () => this._dragEnd());
  }
  _dragStart(e) { this._dragging = true; this._autoRot = false; this._prevMouse = { x: e.clientX, y: e.clientY }; this.canvas.style.cursor = 'grabbing'; }
  _dragMove(e)  { if (!this._dragging) return; this._tgtRot.y += (e.clientX - this._prevMouse.x) * 0.009; this._tgtRot.x += (e.clientY - this._prevMouse.y) * 0.009; this._prevMouse = { x: e.clientX, y: e.clientY }; }
  _dragEnd()    { this._dragging = false; this.canvas.style.cursor = 'grab'; setTimeout(() => { this._autoRot = true; }, 2500); }
}

window.addEventListener('load', () => {
  if (typeof THREE === 'undefined') { console.warn('[satellite.js] Three.js not loaded.'); return; }
  new SatelliteViewer();
});
