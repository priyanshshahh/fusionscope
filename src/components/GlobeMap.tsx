import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CountryData, RiskScores } from '@/data/types';

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function GlobeGrid({ radius }: { radius: number }) {
  const lineObjects = useMemo(() => {
    const material = new THREE.LineBasicMaterial({ color: '#1e3a5f', transparent: true, opacity: 0.3 });
    const result: THREE.Line[] = [];

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 5) {
        points.push(latLonToVector3(lat, lon - 180, radius + 0.005));
      }
      result.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }

    for (let lon = -180; lon < 180; lon += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        points.push(latLonToVector3(lat, lon, radius + 0.005));
      }
      result.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }

    return result;
  }, [radius]);

  return (
    <>
      {lineObjects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
    </>
  );
}

// Simplified continent outlines as lat/lon paths
const CONTINENT_PATHS: [number, number][][] = [
  // Africa outline (simplified)
  [[35,  -5], [37, 10], [35, 35], [30, 32], [22, 37], [12, 44], [2, 45], [-5, 40], [-12, 44], [-25, 35], [-35, 20], [-34, 18], [-30, 17], [-22, 14], [-17, 12], [-12, 14], [-5, 10], [0, 2], [3, 10], [5, -5], [5, -10], [7, -12], [10, -15], [15, -17], [20, -16], [27, -13], [32, -10], [35, -5]],
  // Europe outline
  [[36, -6], [38, -9], [43, -9], [48, -5], [48, 2], [51, 4], [54, 8], [57, 10], [60, 5], [60, 10], [64, 14], [70, 20], [70, 28], [65, 30], [56, 38], [50, 40], [46, 36], [45, 30], [42, 28], [40, 26], [38, 24], [36, 22], [36, -6]],
  // Asia outline (simplified)
  [[42, 28], [45, 35], [40, 45], [37, 50], [35, 55], [30, 60], [25, 65], [23, 70], [20, 75], [20, 80], [22, 88], [22, 100], [28, 105], [35, 105], [38, 110], [40, 115], [42, 120], [45, 130], [50, 135], [55, 135], [60, 140], [65, 150], [70, 170], [70, 150], [72, 120], [68, 80], [65, 70], [62, 60], [60, 50], [55, 42], [50, 40], [46, 36], [42, 28]],
  // North America (simplified)
  [[15, -90], [20, -100], [25, -100], [30, -95], [30, -85], [32, -80], [38, -76], [42, -70], [45, -65], [48, -55], [52, -56], [55, -60], [60, -65], [64, -70], [68, -75], [72, -80], [72, -95], [68, -105], [65, -140], [60, -150], [55, -130], [50, -125], [45, -124], [40, -124], [35, -120], [30, -115], [25, -110], [20, -105], [15, -90]],
  // South America
  [[12, -70], [10, -75], [7, -78], [2, -80], [-5, -80], [-15, -75], [-20, -70], [-25, -65], [-30, -60], [-35, -58], [-40, -63], [-45, -65], [-50, -70], [-55, -68], [-53, -70], [-46, -75], [-40, -73], [-35, -72], [-25, -70], [-18, -67], [-15, -69], [-10, -67], [-5, -60], [0, -50], [5, -52], [7, -55], [10, -62], [12, -70]],
  // Australia
  [[-12, 130], [-15, 125], [-20, 118], [-25, 114], [-30, 115], [-35, 117], [-38, 145], [-35, 150], [-30, 153], [-25, 153], [-20, 148], [-15, 145], [-12, 142], [-10, 135], [-12, 130]],
];

function createFilledContinent(path: [number, number][], radius: number): THREE.Mesh {
  // Project lat/lon to 2D for triangulation, then map back to 3D sphere
  const shape = new THREE.Shape();
  const projected = path.map(([lat, lon]) => {
    const x = (lon + 180) / 360;
    const y = (lat + 90) / 180;
    return new THREE.Vector2(x, y);
  });
  shape.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i < projected.length; i++) {
    shape.lineTo(projected[i].x, projected[i].y);
  }
  shape.closePath();

  const shapeGeo = new THREE.ShapeGeometry(shape, 24);
  const pos = shapeGeo.attributes.position;

  // Remap each vertex from 2D shape back onto sphere surface
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    const lon = u * 360 - 180;
    const lat = v * 180 - 90;
    const vec = latLonToVector3(lat, lon, radius + 0.006);
    pos.setXYZ(i, vec.x, vec.y, vec.z);
  }
  shapeGeo.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: '#0c2d48',
    emissive: '#0a4a7a',
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.2,
  });

  return new THREE.Mesh(shapeGeo, material);
}

function ContinentFills({ radius }: { radius: number }) {
  const objects = useMemo(() => {
    const edgeMaterial = new THREE.LineBasicMaterial({ color: '#0ea5e9', transparent: true, opacity: 0.5 });
    const result: THREE.Object3D[] = [];

    CONTINENT_PATHS.forEach(path => {
      // Filled mesh
      result.push(createFilledContinent(path, radius));

      // Edge outline
      const edgePoints = path.map(([lat, lon]) => latLonToVector3(lat, lon, radius + 0.009));
      edgePoints.push(edgePoints[0]); // close loop
      result.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePoints), edgeMaterial));
    });

    return result;
  }, [radius]);

  return (
    <>
      {objects.map((obj, i) => (
        <primitive key={`continent-fill-${i}`} object={obj} />
      ))}
    </>
  );
}

function CountryMarker({
  country,
  radius,
  activeLayers,
  isSelected,
  onClick,
}: {
  country: CountryData;
  radius: number;
  activeLayers: Set<keyof RiskScores>;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLonToVector3(country.lat, country.lon, radius), [country.lat, country.lon, radius]);

  const maxRisk = activeLayers.size > 0
    ? Math.max(...Array.from(activeLayers).map(l => country.risks[l]))
    : country.fusionScore;

  const markerSize = 0.01 + (maxRisk / 100) * 0.03;
  const color = country.severity === 'critical' ? '#ef4444'
    : country.severity === 'high' ? '#f97316'
    : country.severity === 'elevated' ? '#f59e0b'
    : '#22c55e';

  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (ref.current) {
      const scale = isSelected ? 1.5 : hovered ? 1.3 : 1;
      ref.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 8);
    }
  });

  return (
    <group position={pos}>
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[markerSize, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.5 : hovered ? 1 : 0.5}
          transparent
          opacity={isSelected ? 1 : 0.85}
        />
      </mesh>
      {/* Glow ring */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 1.5, markerSize * 2, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && (
        <Html distanceFactor={4} style={{ pointerEvents: 'none' }}>
          <div className="bg-card border border-border px-2 py-1 rounded-sm whitespace-nowrap">
            <span className="text-[10px] font-mono text-foreground">{country.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">{country.fusionScore}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeMesh({ countries, activeLayers, onSelectCountry, selectedCountry }: {
  countries: CountryData[];
  activeLayers: Set<keyof RiskScores>;
  onSelectCountry: (c: CountryData) => void;
  selectedCountry: string | null;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const radius = 1.5;

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Globe sphere with earth texture */}
      <EarthSphere radius={radius} />

      {/* Atmosphere glow */}
      <Sphere args={[radius * 1.02, 64, 64]}>
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere args={[radius * 1.06, 64, 64]}>
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Grid lines */}
      <GlobeGrid radius={radius} />

      {/* Country markers */}
      {countries.map(country => (
        <CountryMarker
          key={country.id}
          country={country}
          radius={radius + 0.015}
          activeLayers={activeLayers}
          isSelected={selectedCountry === country.id}
          onClick={() => onSelectCountry(country)}
        />
      ))}
    </group>
  );
}

function SceneSetup() {
  const { gl } = useThree();
  gl.setClearColor('#000000', 0);
  return null;
}

export default function GlobeMap({ countries, activeLayers, onSelectCountry, selectedCountry }: {
  countries: CountryData[];
  activeLayers: Set<keyof RiskScores>;
  onSelectCountry: (c: CountryData) => void;
  selectedCountry: string | null;
}) {
  return (
    <div className="relative w-full h-full bg-background/50 border border-border rounded-sm overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <SceneSetup />
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 3, 5]} intensity={0.8} color="#0ea5e9" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#3b82f6" />
        <GlobeMesh
          countries={countries}
          activeLayers={activeLayers}
          onSelectCountry={onSelectCountry}
          selectedCountry={selectedCountry}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2.5}
          maxDistance={6}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-card/80 border border-border px-2 py-1 rounded-sm">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-critical" /><span className="text-[9px] font-mono text-muted-foreground">Critical</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-high" /><span className="text-[9px] font-mono text-muted-foreground">High</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-elevated" /><span className="text-[9px] font-mono text-muted-foreground">Elevated</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-low" /><span className="text-[9px] font-mono text-muted-foreground">Low</span></div>
      </div>
    </div>
  );
}
