"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";

export interface MascotOutfit {
  id: string;
  name: string;
  badgeRequired?: string;
  badgeName?: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
  auraClass: string;
}

export const MASCOT_OUTFITS: MascotOutfit[] = [
  {
    id: "CYBER_NEON",
    name: "Cyber Neon Uniform",
    primaryColor: "#3FE0D0", // cyan
    secondaryColor: "#FF2A85", // pink
    glowColor: "rgba(63, 224, 208, 0.4)",
    description: "Standard issue Neo-Tokyo cybernetic scout uniform with dual cyan/pink photon rings.",
    auraClass: "from-cyan/30 via-pink/20 to-transparent",
  },
  {
    id: "TOP_REVIEWER",
    name: "Critic Scholar Cape",
    badgeRequired: "TOP_REVIEWER",
    badgeName: "Top Critic",
    primaryColor: "#F59E0B", // amber
    secondaryColor: "#FCD34D", // gold
    glowColor: "rgba(245, 158, 11, 0.45)",
    description: "Resonates with golden quill wisdom and glowing analytical runes. Unlocked via 3+ reviews.",
    auraClass: "from-amber-400/30 via-yellow-200/20 to-transparent",
  },
  {
    id: "ANIME_VETERAN",
    name: "Veteran Titanium Armor",
    badgeRequired: "ANIME_VETERAN",
    badgeName: "Anime Veteran",
    primaryColor: "#EF4444", // crimson
    secondaryColor: "#F87171", // bright red
    glowColor: "rgba(239, 68, 68, 0.45)",
    description: "Hardened battlefield plating with crimson flame thrusters. Unlocked by 15+ library titles.",
    auraClass: "from-red-500/30 via-rose-300/20 to-transparent",
  },
  {
    id: "BINGE_WATCHER",
    name: "Matrix Streamer Hoodie",
    badgeRequired: "BINGE_WATCHER",
    badgeName: "Binge Master",
    primaryColor: "#10B981", // emerald
    secondaryColor: "#34D399", // bright green
    glowColor: "rgba(16, 185, 129, 0.45)",
    description: "High-comfort urban streetwear infused with flowing green cyber code streams. Unlocked via 5+ completed series.",
    auraClass: "from-emerald-400/30 via-green-200/20 to-transparent",
  },
  {
    id: "GENRE_EXPLORER",
    name: "Cosmic Astral Cloak",
    badgeRequired: "GENRE_EXPLORER",
    badgeName: "Genre Explorer",
    primaryColor: "#8B5CF6", // purple
    secondaryColor: "#C084FC", // violet
    glowColor: "rgba(139, 92, 246, 0.45)",
    description: "Weaved from deep space nebulae with orbiting stardust particles. Unlocked by configuring genre preferences.",
    auraClass: "from-purple-500/30 via-indigo-300/20 to-transparent",
  },
];

interface Mascot3DCanvasProps {
  src: string;
  alt: string;
  unlockedBadges?: string[];
  onClick?: () => void;
  className?: string;
}

export default function Mascot3DCanvas({
  src,
  alt,
  unlockedBadges = ["VERIFIED"],
  onClick,
  className = "",
}: Mascot3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("CYBER_NEON");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse parallax rotation targets
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Load saved outfit
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aniverse_mascot_outfit");
      if (saved && MASCOT_OUTFITS.some((o) => o.id === saved)) {
        setSelectedOutfitId(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const activeOutfit = useMemo(
    () => MASCOT_OUTFITS.find((o) => o.id === selectedOutfitId) || MASCOT_OUTFITS[0],
    [selectedOutfitId]
  );

  function equipOutfit(id: string) {
    setSelectedOutfitId(id);
    try {
      localStorage.setItem("aniverse_mascot_outfit", id);
    } catch {
      // ignore
    }
    setIsSelectorOpen(false);
  }

  // 3D WebGL / HTML5 Canvas Particle Vortex & Orbit Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = 320);
    let height = (canvas.height = 420);

    // Generate 3D particle cloud
    interface Particle3D {
      x: number;
      y: number;
      z: number;
      radius: number;
      speed: number;
      angle: number;
      orbitRadius: number;
      yOffset: number;
    }

    const particleCount = 42;
    const particles: Particle3D[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: 0,
        y: 0,
        z: (Math.random() - 0.5) * 200,
        radius: Math.random() * 2 + 1,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        orbitRadius: 70 + Math.random() * 65,
        yOffset: (Math.random() - 0.5) * 260,
      });
    }

    const focalLength = 300;
    let ringAngle = 0;

    function render() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      const centerX = width / 2 + mouseRef.current.x * 20;
      const centerY = height / 2 + mouseRef.current.y * 15;

      ringAngle += 0.02;

      // 1. Draw 3D Orbital Cyber Rings
      const ringRadius = 85;
      ctx.save();
      ctx.translate(centerX, centerY + 30);

      // Primary tilted ring
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const cos = Math.cos(a + ringAngle);
        const sin = Math.sin(a + ringAngle);
        const px = cos * ringRadius;
        const py = sin * (ringRadius * 0.28) + mouseRef.current.y * 10;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = activeOutfit.primaryColor;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 12;
      ctx.shadowColor = activeOutfit.glowColor;
      ctx.stroke();

      // Secondary counter-rotating ring
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const cos = Math.cos(a - ringAngle * 1.3);
        const sin = Math.sin(a - ringAngle * 1.3);
        const px = cos * (ringRadius * 0.75);
        const py = sin * (ringRadius * 0.22) - 15 - mouseRef.current.y * 8;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = activeOutfit.secondaryColor;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = activeOutfit.secondaryColor;
      ctx.stroke();

      ctx.restore();

      // 2. Project and Draw 3D Particles
      for (const p of particles) {
        p.angle += p.speed;
        p.x = Math.cos(p.angle) * p.orbitRadius;
        p.z = Math.sin(p.angle) * p.orbitRadius;
        p.y = p.yOffset;

        // 3D Perspective Projection
        const zTotal = p.z + focalLength;
        if (zTotal > 0) {
          const scale = focalLength / zTotal;
          const projX = centerX + p.x * scale;
          const projY = centerY + p.y * scale;
          const projRadius = Math.max(0.5, p.radius * scale);
          const alpha = Math.min(1, Math.max(0.15, (p.z + 100) / 200));

          ctx.beginPath();
          ctx.arc(projX, projY, projRadius, 0, Math.PI * 2);
          ctx.fillStyle = p.z > 0 ? activeOutfit.primaryColor : activeOutfit.secondaryColor;
          ctx.globalAlpha = alpha * 0.85;
          ctx.shadowBlur = p.z > 0 ? 8 : 0;
          ctx.shadowColor = activeOutfit.glowColor;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeOutfit]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  }

  function handleMouseLeave() {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    setIsHovered(false);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none ${className}`}
    >
      {/* 3D WebGL Canvas Backdrop */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute -inset-8 z-0 h-[420px] w-[320px]"
      />

      {/* Hologram Mascot Center Container */}
      <div
        onClick={onClick}
        className="group relative z-10 cursor-pointer h-[280px] w-[200px] lg:h-[340px] lg:w-[250px] transition-transform duration-300"
        style={{
          transform: `perspective(600px) rotateY(${mouseRef.current.targetX * 12}deg) rotateX(${
            -mouseRef.current.targetY * 10
          }deg)`,
        }}
      >
        {/* Dynamic Outfit Glowing Aura */}
        <div
          className={`absolute -inset-4 rounded-full bg-gradient-to-t ${activeOutfit.auraClass} blur-2xl opacity-65 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105`}
        />

        {/* Mascot Hologram Image */}
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 220px, 320px"
          priority
          className="object-contain drop-shadow-[0_0_22px_rgba(63,224,208,0.4)] transition-all duration-300 group-hover:scale-105"
        />

        {/* Hologram Scanlines Overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

        {/* Active Skin Badge Indicator */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-panel/95 px-2.5 py-0.5 text-[10px] font-mono font-bold shadow-lg backdrop-blur-md"
          style={{ color: activeOutfit.primaryColor }}
        >
          ✦ {activeOutfit.name.split(" ")[0]}
        </div>
      </div>

      {/* Outfit Selector Trigger Button */}
      <div className="relative z-20 mt-3 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSelectorOpen(!isSelectorOpen);
          }}
          className="flex items-center gap-1.5 rounded-full border border-line bg-void/80 px-3 py-1 text-xs font-mono text-ink-dim shadow-md backdrop-blur-md transition-all hover:border-cyan hover:text-cyan hover:scale-105 active:scale-95"
        >
          <span>👕</span>
          <span>Outfits</span>
          <span className="text-[10px] text-ink-faint">▼</span>
        </button>
      </div>

      {/* Outfit Wardrobe Popover Modal */}
      {isSelectorOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-12 right-0 z-40 w-72 rounded-xl border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Mascot Wardrobe
            </div>
            <button
              onClick={() => setIsSelectorOpen(false)}
              className="text-ink-faint hover:text-ink text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {MASCOT_OUTFITS.map((outfit) => {
              const isUnlocked =
                !outfit.badgeRequired || unlockedBadges.includes(outfit.badgeRequired);
              const isSelected = outfit.id === selectedOutfitId;

              return (
                <div
                  key={outfit.id}
                  onClick={() => {
                    if (isUnlocked) equipOutfit(outfit.id);
                  }}
                  className={`flex flex-col rounded-lg border p-2 text-xs transition-all ${
                    isSelected
                      ? "border-cyan bg-cyan/10"
                      : isUnlocked
                      ? "border-line bg-void/40 hover:border-line-bright cursor-pointer"
                      : "border-line/40 bg-void/20 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: outfit.primaryColor }}
                      />
                      {outfit.name}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-mono text-cyan font-bold">Equipped</span>
                    ) : !isUnlocked ? (
                      <span className="text-[10px] font-mono text-pink">🔒 Locked</span>
                    ) : (
                      <span className="text-[10px] font-mono text-ink-dim">Equip</span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-dim mt-1 leading-tight">
                    {outfit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
