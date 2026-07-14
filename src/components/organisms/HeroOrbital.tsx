import { useRef, useEffect, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import videoHomeNubes from '../../assets/home_motion/video_home_nubes_comp.mp4';
import spaceBgMobile from '../../assets/home_motion/space-bg-mobile_comp.webp';
import spaceBgDesktop from '../../assets/home_motion/space-bg-desktop_comp.jpg';

interface HeroOrbitalProps {
  onActivateChat: (initialMessage?: string) => void;
  onActivateVoice: () => void;
  martinaState?: 'idle' | 'listening' | 'thinking' | 'speaking';
}

type MartinaState = NonNullable<HeroOrbitalProps['martinaState']>;

type Particle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  blur: number;
  magnetic: number;
  hue: 'rose' | 'gold' | 'white';
};

const conversationStarters = [
  ['💖', 'Decoración romántica', 'Quiero reservar y agregar decoración romántica'],
  ['💡', 'AmarTip de Hoy', 'Dame un AmarTip para vivir una experiencia romántica en Amarte'],
  ['🎂', 'Cumpleaños sorpresa', 'Quiero preparar un cumpleaños sorpresa'],
  ['📍', 'Cómo llegar', 'Quiero saber cómo llegar a Amarte'],
] as const;

const magneticNodes = Array.from({ length: 156 }, (_, index) => {
  const row = Math.floor(index / 13);
  const col = index % 13;
  const rowNorm = (row - 5.5) / 5.5;
  const radius = Math.sqrt(Math.max(0.08, 1 - rowNorm * rowNorm));
  const angle = (col / 13) * Math.PI * 2 + row * 0.34;
  const x = 50 + Math.cos(angle) * radius * 46;
  const y = 50 + rowNorm * 41 + Math.sin(angle) * radius * 6;
  const depth = 0.45 + radius * 0.55;
  return { index, x, y, depth, delay: (index % 17) * 120 };
});

export default function HeroOrbital({ onActivateChat, onActivateVoice, martinaState = 'idle' }: HeroOrbitalProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentState, setCurrentState] = useState<MartinaState>(martinaState);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [portalZoomed, setPortalZoomed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start start', 'end start'],
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.18, 0.34], [1, 1, 0.2]);
  const introY = useTransform(scrollYProgress, [0, 0.34], [0, -34]);
  const introScale = useTransform(scrollYProgress, [0, 0.34], [1, 0.92]);
  const agentOpacity = useTransform(scrollYProgress, [0.02, 0.15, 0.3], [0, 0.56, 1]);
  const agentY = useTransform(scrollYProgress, [0.02, 0.32], [48, 20]);
  const agentScale = useTransform(scrollYProgress, [0.02, 0.32], [0.82, 1.08]);
  const supportOpacity = useTransform(scrollYProgress, [0.16, 0.3, 0.42], [0, 0.7, 1]);

  useEffect(() => setCurrentState(martinaState), [martinaState]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    let ticking = false;
    const onMove = (event: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
        const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
        root.style.setProperty('--mx', x.toFixed(4));
        root.style.setProperty('--my', y.toFixed(4));
        root.style.setProperty('--cursor-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        root.style.setProperty('--cursor-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
        ticking = false;
      });
    };
    const reset = () => {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
      root.style.setProperty('--cursor-x', '50%');
      root.style.setProperty('--cursor-y', '50%');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', reset);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', reset);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: Particle[] = [];
    const pointer = { x: 0.5, y: 0.5, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      const count = window.innerWidth < 768 ? 48 : 88;
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        const hue = Math.random() > 0.78 ? 'gold' : Math.random() > 0.54 ? 'rose' : 'white';
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseX: Math.random() * width,
          baseY: Math.random() * height,
          vx: reducedMotion ? 0 : (Math.random() - 0.5) * (0.08 + depth * 0.2),
          vy: reducedMotion ? 0 : (Math.random() - 0.5) * (0.04 + depth * 0.12),
          size: 0.3 + Math.pow(depth, 1.8) * 3.4,
          alpha: 0.05 + depth * 0.36,
          blur: depth > 0.78 ? 2 + Math.random() * 3.5 : Math.random() * 0.9,
          magnetic: 0.22 + depth * 0.9,
          hue,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        if (!reducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -16) particle.x = width + 16;
          if (particle.x > width + 16) particle.x = -16;
          if (particle.y < -16) particle.y = height + 16;
          if (particle.y > height + 16) particle.y = -16;
        }

        const color = particle.hue === 'gold'
          ? '241, 229, 172'
          : particle.hue === 'rose'
            ? '230, 0, 126'
            : '255, 245, 248';

        let renderX = particle.x;
        let renderY = particle.y;
        let renderAlpha = particle.alpha;
        let renderSize = particle.size;

        if (pointer.active) {
          const targetX = pointer.x * width;
          const targetY = pointer.y * height;
          const dx = particle.x - targetX;
          const dy = particle.y - targetY;
          const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const radius = Math.min(width, height) * 0.24;
          const influence = Math.max(0, 1 - distance / radius);
          const pressure = influence * influence * particle.magnetic;

          renderX += (dx / distance) * pressure * 76;
          renderY += (dy / distance) * pressure * 56;
          renderAlpha *= 1 - pressure * 0.54;
          renderSize *= 1 + pressure * 0.62;
        }

        ctx.save();
        ctx.filter = particle.blur > 1.2 ? `blur(${particle.blur}px)` : 'none';
        ctx.fillStyle = `rgba(${color}, ${renderAlpha})`;
        ctx.beginPath();
        ctx.arc(renderX, renderY, renderSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseleave', onPointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const activateVoice = () => {
    setCurrentState('listening');
    setPortalZoomed(true);
    window.setTimeout(() => setPortalZoomed(false), reducedMotion ? 120 : 480);
    onActivateVoice();
  };

  const rootStyle = { '--mx': '0', '--my': '0', '--cursor-x': '50%', '--cursor-y': '50%' } as CSSProperties;
  const stateClass = `hero-agent--${currentState}`;

  return (
    <section
      ref={rootRef}
      className={`hero-agent-v6 ${stateClass} relative min-h-[112vh] w-full overflow-hidden bg-[#0D0D11] text-[#FFF5F8] md:min-h-[122vh]`}
      style={rootStyle}
    >
      <style>{`
        .hero-agent-v6 {
          isolation: isolate;
          perspective: 1600px;
          transform-style: preserve-3d;
        }

        .hero-agent-v6 * { backface-visibility: hidden; }

        .v6-bg,
        .v6-planet-layer,
        .v6-stage,
        .v6-orb,
        .v6-orb-core,
        .v6-living-ring,
        .v6-orbit,
        .v6-cta {
          will-change: transform, opacity, filter;
        }

        .v6-bg {
          background-image:
            linear-gradient(180deg, rgba(5,5,8,0.04), rgba(5,5,8,0.2) 58%, #050508 100%),
            image-set(url(${spaceBgMobile}) 1x);
          background-position: center;
          background-size: cover;
          transform: translate3d(calc(var(--mx) * -8px), calc(var(--my) * -6px), -220px) scale(1.18);
          transition: transform 700ms cubic-bezier(0.25, 1, 0.5, 1);
        }

        .v6-motion-video {
          height: 100%;
          width: 100%;
          object-fit: cover;
          opacity: 0.42;
          filter: brightness(0.62) contrast(1.1) saturate(0.9) blur(0.2px);
          transform: translate3d(calc(var(--mx) * -7px), calc(var(--my) * -5px), -180px) scale(1.18);
          animation: v6VideoEnter 1200ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .v6-space-grade {
          background:
            radial-gradient(circle at 50% 42%, rgba(230,0,126,0.14), transparent 0 23%),
            radial-gradient(ellipse at 50% 48%, transparent 0 28%, rgba(0,0,0,0.24) 62%, rgba(0,0,0,0.8) 100%),
            linear-gradient(90deg, rgba(5,5,8,0.82), transparent 24%, transparent 76%, rgba(5,5,8,0.82)),
            linear-gradient(180deg, rgba(5,5,8,0.48), rgba(5,5,8,0.04) 38%, rgba(5,5,8,0.76));
        }
        .v6-planet-layer {
          transform: translate3d(calc(-50% + var(--mx) * 3px), calc(-50% + var(--my) * 3px), -180px) scale(1);
          transition: transform 700ms cubic-bezier(0.25, 1, 0.5, 1), opacity 400ms ease;
        }

        .v6-stage {
          transform-style: preserve-3d;
          transform: rotateX(calc(var(--my) * -4deg)) rotateY(calc(var(--mx) * 5deg));
          transition: transform 520ms cubic-bezier(0.25, 1, 0.5, 1);
          animation: v6CameraBreath 12s cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }

        .v6-orb {
          filter: drop-shadow(0 0 50px rgba(230, 0, 126, 0.22));
          transform: translate3d(calc(var(--mx) * -7px), calc(var(--my) * -6px), 120px);
          transition: transform 700ms cubic-bezier(0.25, 1, 0.5, 1), filter 400ms ease;
        }

        .v6-orb-core {
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 245, 248, 0.82) 0 3.5%, rgba(241, 229, 172, 0.66) 5% 10%, rgba(230, 0, 126, 0.44) 16% 28%, rgba(106, 14, 34, 0.34) 46%, rgba(13,13,17,0.2) 68%, transparent 76%),
            radial-gradient(circle at 50% 50%, rgba(230, 0, 126, 0.16), transparent 68%);
          box-shadow:
            inset 0 0 56px rgba(255, 245, 248, 0.06),
            0 0 92px rgba(230, 0, 126, 0.24),
            0 0 160px rgba(241, 229, 172, 0.08);
          animation: v6CoreBreath 5.8s ease-in-out infinite;
        }

        .v6-orb-core::before,
        .v6-orb-core::after {
          content: '';
          position: absolute;
          inset: -6%;
          border-radius: 9999px;
          pointer-events: none;
        }

        .v6-orb-core::before {
          background:
            conic-gradient(from 90deg, transparent, rgba(255,245,248,0.16), transparent 22%, rgba(230,0,126,0.28), transparent 52%, rgba(241,229,172,0.2), transparent 78%);
          filter: blur(7px);
          mix-blend-mode: screen;
          animation: v6PlasmaSpin 11s linear infinite;
        }

        .v6-orb-core::after {
          inset: 18%;
          background: radial-gradient(circle, rgba(241,229,172,0.9), rgba(230,0,126,0.28) 34%, transparent 70%);
          filter: blur(14px);
          animation: v6InnerPulse 3.2s ease-in-out infinite;
        }

        .v6-magnetic-shell {
          transform-style: preserve-3d;
          transform: translate3d(calc(var(--mx) * -5px), calc(var(--my) * -4px), 180px);
          animation: v6MagneticFloat 7.2s ease-in-out infinite;
        }

        .v6-node {
          left: calc(var(--node-x) * 1%);
          top: calc(var(--node-y) * 1%);
          width: calc(4px + var(--node-depth) * 6px);
          height: calc(4px + var(--node-depth) * 6px);
          opacity: calc(0.42 + var(--node-depth) * 0.58);
          background: radial-gradient(circle, rgba(255,245,248,0.98), rgba(203,123,167,0.72) 38%, rgba(230,0,126,0.34) 64%, transparent 72%);
          box-shadow: 0 0 calc(8px + var(--node-depth) * 22px) rgba(203, 123, 167, 0.58);
          transform: translate3d(-50%, -50%, 0) scale(var(--node-depth));
          animation: v6NodePulse 3.4s ease-in-out infinite;
          animation-delay: calc(var(--node-delay) * 1ms);
        }

        .v6-field-line {
          border: 1px solid rgba(203, 123, 167, 0.32);
          box-shadow: inset 0 0 24px rgba(230,0,126,0.08), 0 0 24px rgba(166,104,255,0.08);
          animation: v6FieldBreath 5.8s ease-in-out infinite;
        }

        .v6-pearl-glint {
          left: 50%;
          top: 50%;
          width: min(24vw, 260px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.52;
          mix-blend-mode: screen;
          background:
            radial-gradient(circle at 50% 50%, rgba(255,250,232,0.42) 0 1.6%, rgba(241,229,172,0.18) 3.2%, rgba(230,0,126,0.08) 11%, transparent 34%),
            conic-gradient(from 110deg, transparent 0 15%, rgba(255,245,248,0.16) 18%, transparent 22% 47%, rgba(241,229,172,0.12) 51%, transparent 56% 100%);
          filter: blur(0.4px);
          animation: v6PearlGlint 6.8s ease-in-out infinite;
        }

        .v6-pearl-wave {
          left: 50%;
          top: 50%;
          width: min(30vw, 330px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          pointer-events: none;
          opacity: 0.28;
          mix-blend-mode: screen;
          border: 1px solid rgba(255,245,248,0.16);
          box-shadow: 0 0 42px rgba(241,229,172,0.08), inset 0 0 30px rgba(230,0,126,0.08);
          animation: v6PearlWave 5.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .v6-living-ring {
          background:
            radial-gradient(circle at 24% 34%, rgba(255,245,248,0.72), transparent 0 12%, transparent 26%),
            radial-gradient(circle at 78% 42%, rgba(230,0,126,0.74), transparent 0 14%, transparent 30%),
            radial-gradient(circle at 48% 84%, rgba(241,229,172,0.58), transparent 0 12%, transparent 28%),
            conic-gradient(from 18deg, transparent 0 7%, rgba(255,245,248,0.52) 12%, rgba(230,0,126,0.55) 22%, transparent 35%, rgba(241,229,172,0.34) 52%, transparent 70%, rgba(203,123,167,0.48) 82%, transparent 100%);
          border-radius: 47% 53% 51% 49% / 55% 45% 52% 48%;
          mask: radial-gradient(circle, transparent 0 37%, #000 42% 65%, transparent 70%);
          filter: blur(14px) drop-shadow(0 0 28px rgba(230,0,126,0.26));
          mix-blend-mode: screen;
          opacity: 0.28;
          animation: v6LivingRing 7.2s cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }

        .v6-living-ring:nth-child(2) {
          animation-duration: 8.6s;
          animation-delay: 650ms;
          opacity: 0.22;
          transform: scale(0.88) rotate(18deg);
          filter: blur(13px) drop-shadow(0 0 26px rgba(241,229,172,0.2));
        }

        .v6-living-ring:nth-child(3) {
          animation-duration: 10s;
          animation-delay: 1200ms;
          opacity: 0.18;
          transform: scale(1.12) rotate(-12deg);
          filter: blur(18px) drop-shadow(0 0 38px rgba(230,0,126,0.22));
        }

        .v6-plasma-cloud {
          background: radial-gradient(circle, rgba(255,245,248,0.46), rgba(230,0,126,0.2) 34%, transparent 68%);
          border-radius: 9999px;
          filter: blur(22px);
          mix-blend-mode: screen;
          animation: v6CloudBreath 6.5s ease-in-out infinite;
        }

        .v6-plasma-cloud:nth-of-type(2n) {
          background: radial-gradient(circle, rgba(241,229,172,0.34), rgba(230,0,126,0.16) 38%, transparent 70%);
          animation-duration: 8.2s;
          animation-direction: reverse;
        }

        .v6-orbit {
          border: 1px solid rgba(255,245,248,0.08);
          box-shadow: 0 0 32px rgba(230,0,126,0.12), inset 0 0 28px rgba(241,229,172,0.06);
          animation: v6Wave 4.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .v6-magnetic-dimple {
          background:
            radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(13, 13, 17, 0.62) 0 3.5%, rgba(230, 0, 126, 0.18) 7%, rgba(255, 245, 248, 0.08) 10%, transparent 18%);
          mix-blend-mode: soft-light;
          opacity: 0.72;
          transition: opacity 300ms ease;
        }

        .v6-cta {
          transform: translate3d(calc(var(--mx) * -3px), calc(var(--my) * -3px), 260px);
          transition: transform 700ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 250ms ease, background 250ms ease;
        }

        .hero-agent--listening .v6-orb-core,
        .hero-agent--listening .v6-living-ring {
          animation-duration: 3.6s, 7s;
          filter: brightness(1.18) saturate(1.22) drop-shadow(0 0 42px rgba(241,229,172,0.24));
        }

        .hero-agent--listening .v6-orbit { animation-duration: 1.7s; }
        .hero-agent--thinking .v6-orb-core { filter: brightness(1.22) saturate(1.18); }
        .hero-agent--speaking .v6-living-ring { animation-duration: 5.2s, 9s; }
        .hero-agent--speaking .v6-cta { box-shadow: 0 0 48px rgba(241,229,172,0.35), 0 22px 90px rgba(230,0,126,0.36); }

        @keyframes v6VideoEnter {
          from {
            opacity: 0;
            transform: translate3d(0, 22px, -180px) scale(1.28);
            filter: brightness(0.34) contrast(1.08) saturate(0.72) blur(5px);
          }
        }

        @keyframes v6PearlGlint {
          0%, 100% { opacity: 0.34; transform: translate(-50%, -50%) scale(0.94) rotate(-6deg); }
          45% { opacity: 0.62; transform: translate(-50%, -50%) scale(1.03) rotate(4deg); }
          70% { opacity: 0.42; transform: translate(-50%, -50%) scale(0.98) rotate(0deg); }
        }

        @keyframes v6PearlWave {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.72); }
          30% { opacity: 0.24; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.22); }
        }

        @keyframes v6CameraBreath {
          0%, 100% { transform: scale3d(1, 1, 1) rotateX(calc(var(--my) * -4deg)) rotateY(calc(var(--mx) * 5deg)); }
          50% { transform: scale3d(1.035, 1.035, 1) rotateX(calc(var(--my) * -4deg)) rotateY(calc(var(--mx) * 5deg)); }
        }

        @keyframes v6CoreBreath {
          0%, 100% { transform: scale(0.94); filter: brightness(1.04) saturate(1.04); opacity: 0.9; }
          50% { transform: scale(1.07); filter: brightness(1.2) saturate(1.16); opacity: 1; }
        }

        @keyframes v6MagneticFloat {
          0%, 100% { scale: 0.98; filter: blur(0); }
          50% { scale: 1.045; filter: blur(0.2px); }
        }

        @keyframes v6NodePulse {
          0%, 100% { transform: translate3d(-50%, -50%, 0) scale(calc(var(--node-depth) * 0.82)); opacity: calc(0.18 + var(--node-depth) * 0.44); }
          50% { transform: translate3d(-50%, -50%, 0) scale(calc(var(--node-depth) * 1.22)); opacity: calc(0.44 + var(--node-depth) * 0.56); }
        }

        @keyframes v6FieldBreath {
          0%, 100% { transform: scale(0.88); opacity: 0.12; }
          50% { transform: scale(1.08); opacity: 0.34; }
        }

        @keyframes v6PlasmaSpin { to { rotate: 360deg; } }

        @keyframes v6InnerPulse {
          0%, 100% { opacity: 0.48; transform: scale(0.82); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }

        @keyframes v6LivingRing {
          0%, 100% { border-radius: 47% 53% 51% 49% / 55% 45% 52% 48%; scale: 1; }
          25% { border-radius: 56% 44% 45% 55% / 48% 58% 42% 52%; }
          50% { border-radius: 43% 57% 58% 42% / 60% 40% 56% 44%; scale: 1.035; }
          75% { border-radius: 54% 46% 47% 53% / 45% 55% 48% 52%; }
        }

        @keyframes v6CloudBreath {
          0%, 100% { transform: scale(0.72) translate3d(0, 0, 0); opacity: 0.18; }
          50% { transform: scale(1.28) translate3d(2%, -2%, 0); opacity: 0.42; }
        }

        @keyframes v6Wave {
          0% { transform: scale(0.42); opacity: 0; }
          28% { opacity: 0.3; }
          100% { transform: scale(1.18); opacity: 0; }
        }

        @media (min-width: 768px) {
          .v6-bg {
            background-image:
              linear-gradient(180deg, rgba(5,5,8,0.04), rgba(5,5,8,0.2) 58%, #050508 100%),
              image-set(url(${spaceBgDesktop}) 1x);
          }
          .v6-motion-video {
            opacity: 0.46;
            filter: brightness(0.64) contrast(1.1) saturate(0.9) blur(0.2px);
            transform: translate3d(calc(var(--mx) * -10px), calc(var(--my) * -7px), -180px) scale(1.16);
          }
        }

        @media (max-width: 767px) {
          .v6-planet-layer {
          transform: translate3d(calc(-50% + var(--mx) * 3px), calc(-50% + var(--my) * 3px), -180px) scale(1);
          transition: transform 700ms cubic-bezier(0.25, 1, 0.5, 1), opacity 400ms ease;
        }

        .v6-stage { transform: none; }
          .v6-orb { transform: translate3d(0, 0, 120px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-agent-v6 *, .hero-agent-v6 *::before, .hero-agent-v6 *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 1ms !important;
          }
          .v6-bg, .v6-motion-video, .v6-stage, .v6-orb, .v6-cta { transform: none !important; }
          .v6-motion-video { display: none; }
        }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="v6-bg absolute inset-[-10%]" />
        {!reducedMotion && (
          <video
            className="v6-motion-video absolute inset-0"
            src={videoHomeNubes}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        )}
        <div className="v6-space-grade absolute inset-0" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 z-10 h-full w-full opacity-80 pointer-events-none" />
      <div className="v6-magnetic-dimple pointer-events-none absolute inset-0 z-[11]" />

      <div className="sticky top-0 z-20 flex min-h-screen flex-col items-center px-4 pb-8 pt-4 sm:px-6">
        <header className="flex w-full max-w-7xl items-center justify-between border-b border-white/8 pb-4">
          <div className="font-heading text-2xl tracking-[0.28em] text-[#FFF5F8]">
            A<span className="text-[#E6007E]">MAR</span>TE
          </div>
          <div className="hidden items-center gap-8 font-body text-sm text-[#FFF5F8]/72 md:flex">
            <span>Suites</span>
            <span>Experiencias</span>
            <span>Martina</span>
          </div>
          <button
            onClick={() => onActivateChat()}
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 font-heading text-xs uppercase tracking-widest text-white transition hover:border-[#E6007E]/50 hover:bg-white/10"
          >
            Reserva
          </button>
        </header>

        <div className="relative flex w-full flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            style={reducedMotion ? undefined : { opacity: introOpacity, y: introY, scale: introScale }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl"
          >
            <div className="mb-3 font-body text-[10px] uppercase tracking-[0.4em] text-[#FFF5F8]/58 sm:text-xs">Voice Agent · Martina</div>
            <h1 className="font-heading text-[clamp(4rem,19vw,7.2rem)] uppercase leading-[0.78] tracking-[-0.06em] sm:text-[clamp(5rem,14vw,8.5rem)] md:text-[clamp(6rem,10vw,9rem)]">
              Te llevo
              <span className="block bg-gradient-to-r from-[#E6007E] via-[#FFF5F8] to-[#F1E5AC] bg-clip-text text-transparent">a Marte</span>
            </h1>
          </motion.div>

          <motion.div
            style={reducedMotion ? undefined : { opacity: agentOpacity, y: agentY, scale: agentScale }}
            className="v6-stage relative flex aspect-square w-[min(92vw,560px)] items-center justify-center rounded-full md:w-[min(58vw,560px)]"
          >
            <div className="v6-orb absolute inset-0 flex items-center justify-center rounded-full">
              <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(230,0,126,0.12),transparent_60%)] blur-2xl" />
              <div className="v6-magnetic-shell absolute inset-[5%] rounded-full">
                <span className="v6-field-line absolute inset-[9%] rounded-full" />
                <span className="v6-field-line absolute inset-[20%] rounded-full [animation-delay:600ms]" />
                <span className="v6-field-line absolute inset-[31%] rounded-full [animation-delay:1200ms]" />
                {magneticNodes.map((node) => (
                  <span
                    key={node.index}
                    className="v6-node absolute rounded-full"
                    style={{
                      '--node-x': node.x,
                      '--node-y': node.y,
                      '--node-depth': node.depth,
                      '--node-delay': node.delay,
                    } as CSSProperties}
                  />
                ))}
              </div>
              <div className="v6-orb-core absolute inset-[34%] overflow-hidden rounded-full" />
              <div className="v6-plasma-cloud absolute left-[18%] top-[18%] h-[34%] w-[42%]" />
              <div className="v6-plasma-cloud absolute right-[16%] top-[28%] h-[36%] w-[34%]" />
              <div className="v6-plasma-cloud absolute bottom-[13%] left-[32%] h-[30%] w-[44%]" />
              <div className="v6-living-ring absolute inset-[9%]" />
              <div className="v6-living-ring absolute inset-[13%]" />
              <div className="v6-living-ring absolute inset-[7%]" />
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className="v6-orbit absolute h-[46%] w-[46%] rounded-full"
                  style={{ animationDelay: `${index * 520}ms` }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={activateVoice}
              className="v6-cta absolute z-30 inline-flex items-center justify-center gap-2 rounded-full border border-[#FFF5F8]/18 bg-[#E6007E] px-7 py-3.5 font-heading text-sm uppercase leading-none tracking-widest text-white shadow-[0_0_42px_rgba(230,0,126,0.5),0_20px_80px_rgba(0,0,0,0.55)] transition hover:scale-105 hover:bg-[#ff0a90] active:scale-95 sm:px-9 sm:py-4"
            >
              <svg aria-hidden="true" className="h-[15px] w-[15px] shrink-0 translate-y-[0.5px]" viewBox="0 0 24 24" fill="none"><path d="M12 13.75c1.66 0 3-1.34 3-3V6.25c0-1.66-1.34-3-3-3s-3 1.34-3 3v4.5c0 1.66 1.34 3 3 3Z" stroke="currentColor" strokeWidth="1.65"/><path d="M6.5 10.25c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5M12 15.75v3.5M9.25 19.25h5.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/><path d="M10.25 6.5h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7"/></svg> HABLA CON MARTINA
            </button>
          </motion.div>

          <motion.p
            style={reducedMotion ? undefined : { opacity: supportOpacity }}
            className="max-w-xl font-body text-xs leading-relaxed text-[#FFF5F8]/68 sm:text-sm"
          >
            Martina interpreta tu intención y te guía hacia la suite, el plan y el momento perfecto. ¿Qué plan estás buscando?
          </motion.p>

          <motion.div
            style={reducedMotion ? undefined : { opacity: supportOpacity }}
            className="flex flex-wrap justify-center gap-2 pt-1"
          >
            {conversationStarters.map(([icon, label, prompt]) => (
              <button
                key={label}
                onClick={() => {
                  setCurrentState('thinking');
                  onActivateChat(prompt);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#FFF5F8]/78 backdrop-blur-md transition hover:scale-105 hover:border-[#E6007E]/55 hover:bg-white/10 hover:text-white"
              >
                <span className="mr-1.5">{icon}</span>{label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {portalZoomed && (
          <motion.div
            className="fixed inset-0 z-[1200] bg-[#0D0D11]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.72 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.28 }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}






