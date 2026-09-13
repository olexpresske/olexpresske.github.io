import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Compass,
  MapPin,
  Eye,
  Sliders,
  Play,
  Pause,
  Info,
} from 'lucide-react';
import { OlexLogo } from './OlexLogo';

interface GalaxyGlobe3DProps {
  height?: string | number;
  interactive?: boolean;
  className?: string;
  showControls?: boolean;
  onCloseFullScreen?: () => void;
  isFullScreen?: boolean;
}

export function GalaxyGlobe3D({
  height = 360,
  interactive = true,
  className = '',
  showControls = true,
  onCloseFullScreen,
  isFullScreen = false,
}: GalaxyGlobe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'galaxy' | 'kenya' | 'rings'>('galaxy');
  const [starCount, setStarCount] = useState(3000);
  const [cameraZoom, setCameraZoom] = useState(5.5);

  // References to communicate with Three.js animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const galaxyGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef({ x: 0.1, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const isRotatingRef = useRef(true);
  const speedRef = useRef(1);

  // Sync state with refs for the 60fps loop
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE, CAMERA, RENDERER
    const width = container.clientWidth || 600;
    const currentHeight = typeof height === 'number' ? height : container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / currentHeight, 0.1, 1000);
    camera.position.z = isFullScreen ? 4.8 : 5.4;
    camera.position.y = 0.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, currentHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent so dark theme shines through
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // ROOT GROUPS
    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);
    galaxyGroupRef.current = galaxyGroup;

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. WORLD-CLASS STARFIELD & GALAXY PARTICLES
    // A. Cosmic background stars (multi-color depth)
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const cosmicPalette = [
      new THREE.Color('#ffffff'), // Pure diamond white
      new THREE.Color('#22d3ee'), // Celestial Cyan
      new THREE.Color('#34d399'), // OlexPress Emerald
      new THREE.Color('#fbbf24'), // OlexPress Golden Amber
      new THREE.Color('#a78bfa'), // Deep Violet
    ];

    for (let i = 0; i < starCount; i++) {
      // Spherical distribution with deep cosmos radius
      const radius = 6 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = cosmicPalette[Math.floor(Math.random() * cosmicPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;

      starSizes[i] = Math.random() * 2.2 + 0.8;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Circle texture for smooth round stars
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(34, 197, 94, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const starMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: createStarTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    galaxyGroup.add(starField);

    // B. Spiral Galaxy Arms Dust
    const spiralCount = 1200;
    const spiralGeo = new THREE.BufferGeometry();
    const spiralPositions = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);

    for (let i = 0; i < spiralCount; i++) {
      const armIndex = i % 3;
      const armAngle = (armIndex * (2 * Math.PI)) / 3;
      const dist = 1.5 + Math.random() * 5.5;
      const angle = armAngle + dist * 0.8 + (Math.random() - 0.5) * 0.4;

      spiralPositions[i * 3] = Math.cos(angle) * dist;
      spiralPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.6 * (1 - dist / 7);
      spiralPositions[i * 3 + 2] = Math.sin(angle) * dist;

      // Color from inner gold to emerald to outer cyan
      const ratio = dist / 6.5;
      const col = new THREE.Color().lerpColors(
        new THREE.Color('#fbbf24'),
        ratio > 0.5 ? new THREE.Color('#22d3ee') : new THREE.Color('#22c55e'),
        ratio
      );
      spiralColors[i * 3] = col.r;
      spiralColors[i * 3 + 1] = col.g;
      spiralColors[i * 3 + 2] = col.b;
    }

    spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));

    const spiralMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      map: createStarTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spiralArms = new THREE.Points(spiralGeo, spiralMaterial);
    galaxyGroup.add(spiralArms);

    // 2. WORLD-CLASS 3D EARTH GLOBE
    const globeRadius = 1.6;

    // A. Holographic Wireframe / Latitude-Longitude Grid Sphere
    const innerSphereGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const innerSphereMat = new THREE.MeshBasicMaterial({
      color: 0x051b11,
      transparent: true,
      opacity: 0.85,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    globeGroup.add(innerSphere);

    // B. Glowing Atmospheric Rim (Fresnel Back-Sphere)
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.05, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.13, 0.77, 0.37, 1.0) * intensity * 1.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // C. Neon Latitude / Longitude Grids
    const gridGroup = new THREE.Group();
    // Equator (Gold)
    const equatorGeo = new THREE.BufferGeometry();
    const equatorPoints: number[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      equatorPoints.push(
        Math.cos(a) * (globeRadius + 0.008),
        0,
        Math.sin(a) * (globeRadius + 0.008)
      );
    }
    equatorGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(equatorPoints, 3)
    );
    const equatorLine = new THREE.Line(
      equatorGeo,
      new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.75 })
    );
    gridGroup.add(equatorLine);

    // Tropics & Meridians
    for (const lat of [-45, -23.5, 23.5, 45]) {
      const rad = (lat * Math.PI) / 180;
      const r = Math.cos(rad) * (globeRadius + 0.005);
      const y = Math.sin(rad) * (globeRadius + 0.005);
      const latGeo = new THREE.BufferGeometry();
      const points: number[] = [];
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        points.push(Math.cos(a) * r, y, Math.sin(a) * r);
      }
      latGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const latLine = new THREE.Line(
        latGeo,
        new THREE.LineBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.35,
        })
      );
      gridGroup.add(latLine);
    }
    globeGroup.add(gridGroup);

    // D. Global Landmass Point Grid (Cyber-Globe Dot Matrix)
    // Generating recognizable continental clusters (Africa, Europe, Americas, Asia)
    const landDotsGeo = new THREE.BufferGeometry();
    const landDotPositions: number[] = [];
    const landDotColors: number[] = [];

    // Realistic Lat/Long boundary sampling for Earth continents
    const isLand = (lat: number, lon: number) => {
      // Africa (Nyandarua / Kenya is centered near lat: 0, lon: 37)
      if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
        if (lon > 40 && lat < -12) return false;
        return true;
      }
      // Europe
      if (lat >= 36 && lat <= 70 && lon >= -10 && lon <= 45) return true;
      // Asia
      if (lat >= 10 && lat <= 75 && lon >= 45 && lon <= 145) return true;
      // North America
      if (lat >= 15 && lat <= 70 && lon >= -165 && lon <= -55) return true;
      // South America
      if (lat >= -55 && lat <= 12 && lon >= -82 && lon <= -34) return true;
      // Australia
      if (lat >= -40 && lat <= -10 && lon >= 113 && lon <= 154) return true;
      return false;
    };

    for (let lat = -80; lat <= 80; lat += 3.5) {
      for (let lon = -180; lon <= 180; lon += 4) {
        if (isLand(lat, lon)) {
          // Convert Lat/Long to 3D Cartesian coords
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lon + 180) * (Math.PI / 180);
          const r = globeRadius + 0.015;

          const x = -(r * Math.sin(phi) * Math.cos(theta));
          const z = r * Math.sin(phi) * Math.sin(theta);
          const y = r * Math.cos(phi);

          landDotPositions.push(x, y, z);

          // Highlight Kenya / East Africa region in vibrant gold/emerald
          const isKenyaRegion = lat >= -4.5 && lat <= 4.5 && lon >= 33.5 && lon <= 42;
          if (isKenyaRegion) {
            landDotColors.push(0.98, 0.75, 0.14); // Gold for Kenya
          } else {
            landDotColors.push(0.13, 0.77, 0.37); // Emerald for World
          }
        }
      }
    }

    landDotsGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(landDotPositions, 3)
    );
    landDotsGeo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(landDotColors, 3)
    );

    const landDotsMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: createStarTexture(),
      blending: THREE.AdditiveBlending,
    });
    const landPoints = new THREE.Points(landDotsGeo, landDotsMat);
    globeGroup.add(landPoints);

    // E. NYANDARUA / OL KALOU, KENYA PINPOINT (Beacon & Hologram)
    // Ol Kalou Coordinates: Lat -0.2721°, Lon 36.3792°
    const olKalouLat = -0.2721;
    const olKalouLon = 36.3792;
    const olKalouPhi = (90 - olKalouLat) * (Math.PI / 180);
    const olKalouTheta = (olKalouLon + 180) * (Math.PI / 180);
    const pinRadius = globeRadius + 0.03;

    const pinX = -(pinRadius * Math.sin(olKalouPhi) * Math.cos(olKalouTheta));
    const pinZ = pinRadius * Math.sin(olKalouPhi) * Math.sin(olKalouTheta);
    const pinY = pinRadius * Math.cos(olKalouPhi);

    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(pinX, pinY, pinZ);
    // Align with surface normal
    beaconGroup.lookAt(pinX * 2, pinY * 2, pinZ * 2);

    // 1. Glowing pulsing base ring
    const ringGeo = new THREE.RingGeometry(0.04, 0.09, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    beaconGroup.add(ringMesh);

    // 2. Vertical Light Beacon (Energy Beam shooting into space)
    const beamGeo = new THREE.CylinderGeometry(0.01, 0.025, 0.5, 16);
    beamGeo.translate(0, 0.25, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beaconGroup.add(beamMesh);

    // 3. User's Logo Floating Badge at top of Kenya Beacon!
    // Render the user's uploaded green pin logo onto a 3D sprite
    const createLogoTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear
        ctx.clearRect(0, 0, 256, 256);

        // Soft green glow halo
        const radial = ctx.createRadialGradient(128, 128, 40, 128, 128, 120);
        radial.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
        radial.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, 256, 256);

        // Draw outer pin
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(128, 90, 60, Math.PI, 0, false);
        ctx.lineTo(135, 175);
        ctx.lineTo(128, 190);
        ctx.lineTo(121, 175);
        ctx.closePath();
        ctx.fill();

        // Inner circular aperture (cutout)
        ctx.fillStyle = '#051b11';
        ctx.beginPath();
        ctx.arc(128, 90, 36, 0, Math.PI * 2, true);
        ctx.fill();

        // Curved road
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(150, 75);
        ctx.quadraticCurveTo(105, 80, 115, 115);
        ctx.quadraticCurveTo(125, 150, 145, 180);
        ctx.lineTo(132, 180);
        ctx.quadraticCurveTo(112, 145, 102, 110);
        ctx.quadraticCurveTo(95, 75, 150, 70);
        ctx.closePath();
        ctx.fill();

        // Dashed lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(130, 78);
        ctx.quadraticCurveTo(112, 115, 138, 175);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const logoTexture = createLogoTexture();
    const logoSpriteMat = new THREE.SpriteMaterial({
      map: logoTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const logoSprite = new THREE.Sprite(logoSpriteMat);
    logoSprite.position.set(0, 0, 0.55);
    logoSprite.scale.set(0.65, 0.65, 1);
    beaconGroup.add(logoSprite);

    globeGroup.add(beaconGroup);

    // 3. THREE CELESTIAL ORBITAL RINGS (Gold, Emerald, Cyan)
    const createOrbitRing = (
      innerRadius: number,
      outerRadius: number,
      color: number,
      tiltX: number,
      tiltZ: number
    ) => {
      const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.z = tiltZ;
      return ring;
    };

    // Orbit 1: Inner Gold Ring
    const goldOrbit = createOrbitRing(2.3, 2.33, 0xfbbf24, Math.PI / 3, 0.2);
    galaxyGroup.add(goldOrbit);

    // Orbit 2: Middle Emerald Ring
    const emeraldOrbit = createOrbitRing(2.7, 2.73, 0x10b981, Math.PI / 2.5, -0.4);
    galaxyGroup.add(emeraldOrbit);

    // Orbit 3: Outer Cyan Ring
    const cyanOrbit = createOrbitRing(3.15, 3.18, 0x22d3ee, Math.PI / 4, 0.6);
    galaxyGroup.add(cyanOrbit);

    // Satellites travelling along orbits
    const satGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
    });
    const satMesh = new THREE.Mesh(satGeo, satMat);
    galaxyGroup.add(satMesh);

    // SHOOTING STAR SYSTEM
    const meteorGeo = new THREE.BufferGeometry();
    const meteorPositions = new Float32Array([0, 0, 0, -0.6, -0.6, -0.3]);
    meteorGeo.setAttribute('position', new THREE.BufferAttribute(meteorPositions, 3));
    const meteorMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const meteor = new THREE.Line(meteorGeo, meteorMat);
    galaxyGroup.add(meteor);

    let meteorActive = false;
    let meteorProgress = 0;
    let meteorOrigin = new THREE.Vector3();
    let meteorDir = new THREE.Vector3(-1, -0.8, -0.5).normalize();

    // INTERACTIVE MOUSE / TOUCH DRAG ROTATION
    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive || !isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.006;
      targetRotationRef.current.x += deltaY * 0.006;

      // Cap vertical rotation to avoid flipping
      targetRotationRef.current.x = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, targetRotationRef.current.x)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch handlers for mobile devices
    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      isDraggingRef.current = true;
      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || !isDraggingRef.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.007;
      targetRotationRef.current.x += deltaY * 0.007;

      targetRotationRef.current.x = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, targetRotationRef.current.x)
      );

      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // ANIMATION TICK LOOP
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();
      const effectiveSpeed = speedRef.current;

      // 1. Slow Auto-Rotation of the Globe
      if (isRotatingRef.current && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0025 * effectiveSpeed;
      }

      // Smooth interpolation for silky rotation
      globeGroup.rotation.y +=
        (targetRotationRef.current.y - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x +=
        (targetRotationRef.current.x - globeGroup.rotation.x) * 0.08;

      // 2. Cosmic Galaxy Stars rotation (counter-rotation adds deep celestial parallax)
      galaxyGroup.rotation.y -= 0.0008 * effectiveSpeed;
      galaxyGroup.rotation.z += 0.0003 * effectiveSpeed;

      // 3. Beacon pulse effect at Ol Kalou, Kenya
      const pulseScale = 1 + Math.sin(elapsedTime * 4) * 0.25;
      ringMesh.scale.set(pulseScale, pulseScale, 1);
      ringMat.opacity = 0.6 + Math.sin(elapsedTime * 4) * 0.35;
      beamMesh.scale.set(1, 1 + Math.sin(elapsedTime * 3) * 0.2, 1);

      // 4. Satellite orbit
      const satAngle = elapsedTime * 0.8 * effectiveSpeed;
      satMesh.position.set(
        Math.cos(satAngle) * 2.7,
        Math.sin(satAngle * 0.7) * 0.8,
        Math.sin(satAngle) * 2.7
      );

      // 5. Random shooting stars / cosmic meteors
      if (!meteorActive && Math.random() < 0.015) {
        meteorActive = true;
        meteorProgress = 0;
        meteorOrigin.set(
          (Math.random() - 0.5) * 12,
          4 + Math.random() * 4,
          (Math.random() - 0.5) * 8
        );
        meteor.position.copy(meteorOrigin);
      }

      if (meteorActive) {
        meteorProgress += delta * 2.2;
        meteor.position.addScaledVector(meteorDir, delta * 8);
        meteorMat.opacity = Math.sin(meteorProgress * Math.PI) * 0.8;
        if (meteorProgress >= 1) {
          meteorActive = false;
          meteorMat.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width || 600;
        const newHeight = typeof height === 'number' ? height : entry.contentRect.height || 360;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();

      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      innerSphereGeo.dispose();
      innerSphereMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      landDotsGeo.dispose();
      landDotsMat.dispose();
    };
  }, [height, starCount, interactive, isFullScreen]);

  // Function to smoothly rotate globe directly to Kenya / Ol Kalou
  const handleFocusKenya = () => {
    // Lat: -0.27°, Lon: 36.38°
    // Calculate rotation angles to face camera (0,0)
    targetRotationRef.current = {
      x: 0.05,
      y: -((36.38 + 90) * (Math.PI / 180)),
    };
    setViewMode('kenya');
  };

  const handleResetGalaxy = () => {
    targetRotationRef.current = { x: 0.2, y: 0 };
    setViewMode('galaxy');
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-radial from-zinc-950 via-black to-black border border-emerald-500/40 shadow-2xl select-none ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      />

      {/* Top Floating Badge: OlexPress Cosmic Brand & Kenya Pinpoint */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none flex items-center space-x-2.5 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-emerald-500/30">
        <OlexLogo size={28} showGlow />
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-black tracking-wider text-amber-400 font-mono">
              OLEXPRESS 3D GALAXY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Beacon: <strong className="text-emerald-400">Ol Kalou, Kenya</strong> • Deep Cosmos
          </p>
        </div>
      </div>

      {/* Floating Interactive Controls overlay */}
      {showControls && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center space-x-1.5">
          {/* Focus on Kenya Button */}
          <button
            onClick={handleFocusKenya}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-md border ${
              viewMode === 'kenya'
                ? 'bg-amber-400 text-black border-amber-300'
                : 'bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800 border-zinc-700'
            }`}
            title="Focus camera on Ol Kalou, Nyandarua County, Kenya"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Focus Ol Kalou</span>
          </button>

          {/* Toggle Auto Rotation */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl text-xs transition-colors border ${
              isRotating
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title={isRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Speed Selector (1x / 2x / 0.5x) */}
          <button
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
            className="px-2 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 text-xs font-mono font-bold border border-zinc-700"
            title="Galaxy rotation speed"
          >
            {speed}x
          </button>

          {/* Full Screen / Minimize toggle */}
          {onCloseFullScreen && (
            <button
              onClick={onCloseFullScreen}
              className="p-2 rounded-xl bg-zinc-900/90 text-zinc-200 hover:text-white border border-zinc-700"
              title="Close Fullscreen"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      )}

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <span className="text-[11px] text-zinc-400/90 font-medium px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-zinc-800/80 flex items-center space-x-1.5">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>Drag to orbit 3D globe & galaxy • Real-time stars & Ol Kalou pinpoint</span>
        </span>
      </div>
    </div>
  );
}
