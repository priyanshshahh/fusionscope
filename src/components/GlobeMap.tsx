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

function EarthSphere({ radius }: { radius: number }) {
  const texture = useLoader(THREE.TextureLoader, '/earth-texture.jpg');
  
  return (
    <Sphere args={[radius, 128, 128]}>
      <meshStandardMaterial
        map={texture}
        roughness={0.75}
        metalness={0.05}
      />
    </Sphere>
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
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-5, -3, -5]} intensity={0.4} color="#3b82f6" />
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
