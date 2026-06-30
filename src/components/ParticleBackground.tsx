import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 65;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };

    // Use ResizeObserver for accurate sizing
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    resizeCanvas();

    // Mouse interactive tracking
    let mouse = { x: -1000, y: -1000, radius: 150 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const createParticle = (x: number, y: number, isInitial = false): Particle => {
      return {
        x,
        y,
        size: Math.random() * 2.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.1, // Slight upward drift
        alpha: isInitial ? Math.random() * 0.6 + 0.1 : 0.01,
        decay: Math.random() * 0.002 + 0.001
      };
    };

    // Seed initial particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(
        createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          true
        )
      );
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw standard deep dark backdrop gradient
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 10,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      bgGrad.addColorStop(0, '#060608');
      bgGrad.addColorStop(1, '#020203');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render/update particles
      particles.forEach((p, idx) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Fade in initially, then decay slowly
        if (p.alpha < 0.65 && p.decay > 0) {
          p.alpha += 0.01;
        } else {
          p.alpha -= p.decay;
        }

        // Mouse avoidance/attraction physics
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 1.8;
          p.y -= (dy / dist) * force * 1.8;
        }

        // Recycle dead particles
        if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[idx] = createParticle(
            Math.random() * canvas.width,
            canvas.height + Math.random() * 50
          );
          return;
        }

        // Draw particle with gorgeous neon-smoke tint
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 160, 185, ${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Subtle networking mesh lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (100 - dist) / 100 * 0.06 * Math.min(pi.alpha, pj.alpha);
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    // Elegant, zero-CPU ambient glow fallback
    return (
      <div 
        ref={containerRef} 
        id="particle-bg-fallback"
        className="absolute inset-0 bg-[#040406] overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-900 rounded-full blur-[160px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800 rounded-full blur-[160px] opacity-25 pointer-events-none" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#020203] overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
