import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  Firework, 
  Particle, 
  FireworkStatus, 
  ScoreStats 
} from '../types';
import { 
  GRAVITY, 
  COLORS, 
  APEX_THRESHOLD, 
  SCORE_PERFECT, 
  SCORE_GOOD, 
  EXPLOSION_PARTICLES, 
  EXPLOSION_SPEED, 
  PARTICLE_DECAY,
  LAUNCH_INTERVAL_MS,
  BEAT_MS,
  FLIGHT_DURATION_BEATS
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onScoreUpdate: (points: number, accuracy: 'perfect' | 'good' | 'miss' | 'wet') => void;
  onGameOver: () => void;
  colors: string[];
  timeLeft: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onScoreUpdate, onGameOver, colors, timeLeft}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const spawnFirework = (width: number, height: number) => {
    const x = width * 0.1 + Math.random() * (width * 0.8);
    const startY = height;
    
    const durationMs = FLIGHT_DURATION_BEATS * BEAT_MS;
    const estimatedFrames = durationMs / 11.666; 
    const vy = -(GRAVITY * estimatedFrames);
    
    const distance = (vy * estimatedFrames) + (0.5 * GRAVITY * (estimatedFrames * estimatedFrames));
    const targetHeight = startY + distance;

    const fw: Firework = {
      id: Date.now() + Math.random(),
      pos: { x, y: startY },
      vel: { x: (Math.random() - 0.5) * 1, y: vy },
      color: colors[Math.floor(Math.random() * colors.length)],
      status: FireworkStatus.RISING,
      fuseTime: 0,
      apexY: targetHeight,
      trail: []
    };
    fireworksRef.current.push(fw);
  };

  const createExplosion = (x: number, y: number, color: string, type: 'normal' | 'perfect') => {
    const count = type === 'perfect' ? EXPLOSION_PARTICLES * 1.5 : EXPLOSION_PARTICLES;
    const speed = type === 'perfect' ? EXPLOSION_SPEED * 1.2 : EXPLOSION_SPEED;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = Math.random() * speed;
      particlesRef.current.push({
        id: Math.random(),
        pos: { x, y },
        vel: { x: Math.cos(angle) * v, y: Math.sin(angle) * v },
        life: 1.0,
        maxLife: 1.0,
        color: type === 'perfect' && Math.random() > 0.5 ? '#fff' : color, 
        size: Math.random() * 3 + 1,
        decay: PARTICLE_DECAY * (0.5 + Math.random() * 0.5)
      });
    }
  };

  const update = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentTime = timeLeftRef.current;

    const speedMultiplier = (currentTime <= 20 && currentTime >= 10) ? 2 : 1.0;

    if (gameState === GameState.PLAYING) {
      if (time - lastLaunchRef.current > LAUNCH_INTERVAL_MS) {
        const drift = (time - lastLaunchRef.current) - LAUNCH_INTERVAL_MS;
        lastLaunchRef.current = time - drift; 
        
        spawnFirework(canvas.width, canvas.height);
      }
    }

    fireworksRef.current.forEach(fw => {
      if (fw.status === FireworkStatus.RISING || fw.status === FireworkStatus.WET || fw.status === FireworkStatus.DUD) {
        fw.pos.x += fw.vel.x * speedMultiplier;
        fw.pos.y += fw.vel.y * speedMultiplier;
        fw.vel.y += GRAVITY * speedMultiplier;

        if (frameCountRef.current % 3 === 0 && fw.status === FireworkStatus.RISING) {
            fw.trail.push({ ...fw.pos });
            if (fw.trail.length > 10) fw.trail.shift();
        }
        if (fw.pos.y > canvas.height + 50) {
            fw.status = FireworkStatus.DEAD;
            if (fw.status === FireworkStatus.RISING) {
                 onScoreUpdate(0, 'wet'); 
            }
        }
        if (fw.status === FireworkStatus.RISING && fw.vel.y > 8) { 
             fw.status = FireworkStatus.WET;
             fw.color = '#555'; 
             onScoreUpdate(0, 'wet');
        }
      }
    });
    fireworksRef.current = fireworksRef.current.filter(fw => fw.status !== FireworkStatus.DEAD);

    particlesRef.current.forEach(p => {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.vel.y += GRAVITY * 0.5; 
      p.vel.x *= 0.96; 
      p.vel.y *= 0.96;
      p.life -= p.decay;
    });

    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    frameCountRef.current++;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    fireworksRef.current.forEach(fw => {
      if (fw.status === FireworkStatus.RISING) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
          ctx.lineWidth = 1;
          if(fw.trail.length > 0) {
              ctx.moveTo(fw.trail[0].x, fw.trail[0].y);
              for(let i=1; i<fw.trail.length; i++) ctx.lineTo(fw.trail[i].x, fw.trail[i].y);
              ctx.stroke();
          }
      }

      if (fw.status !== FireworkStatus.EXPLODING && fw.status !== FireworkStatus.DEAD) {
        ctx.beginPath();
        ctx.arc(fw.pos.x, fw.pos.y, 4, 0, Math.PI * 2); 
        ctx.fillStyle = fw.color;
        ctx.fill();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = fw.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (fw.status === FireworkStatus.WET) {
            ctx.fillStyle = '#64748b';
            ctx.fillText('NAT', fw.pos.x + 10, fw.pos.y);
        }
        if (fw.status === FireworkStatus.DUD) {
            ctx.fillStyle = '#64748b';
            ctx.fillText('MIS', fw.pos.x + 10, fw.pos.y);
        }
      }
    });

    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  const loop = (time: number) => {
    if (gameState !== GameState.PLAYING) {
        if (gameState === GameState.GAME_OVER) {
             update(time);
             draw();
        }
    } else {
      update(time);
      draw();
    }
    
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    if (gameState === GameState.PLAYING) {
        fireworksRef.current = [];
        particlesRef.current = [];
        lastLaunchRef.current = performance.now(); 
    }

    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  const handleTrigger = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const candidates = fireworksRef.current.filter(fw => fw.status === FireworkStatus.RISING);
    if (candidates.length === 0) return;
    candidates.sort((a, b) => Math.abs(a.vel.y) - Math.abs(b.vel.y));
    
    const target = candidates[0]; 
    const vy = target.vel.y;

    if (Math.abs(vy) <= APEX_THRESHOLD) {
        target.status = FireworkStatus.EXPLODING;
        createExplosion(target.pos.x, target.pos.y, target.color, 'perfect');
        onScoreUpdate(SCORE_PERFECT, 'perfect');
        target.status = FireworkStatus.DEAD; 
    } else if (vy < -APEX_THRESHOLD) {
        if (vy < -6) {
             target.status = FireworkStatus.DUD;
             target.color = '#555';
             target.vel.y *= 0.5; 
             onScoreUpdate(0, 'miss');
        } else {
            target.status = FireworkStatus.EXPLODING;
            createExplosion(target.pos.x, target.pos.y, target.color, 'normal');
            onScoreUpdate(SCORE_GOOD, 'good');
            target.status = FireworkStatus.DEAD;
        }
    } else if (vy > APEX_THRESHOLD) {
        target.status = FireworkStatus.WET;
        target.color = '#555';
        onScoreUpdate(0, 'wet');
    }

  }, [gameState, onScoreUpdate]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space') handleTrigger();
      };
      const handleResize = () => {
          if(canvasRef.current) {
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('resize', handleResize);
      };
  }, [handleTrigger]);

  return (
    <canvas 
        ref={canvasRef} 
        onClick={handleTrigger}
        className="absolute top-0 left-0 w-full h-full cursor-pointer touch-none"
    />
  );
};

export default GameCanvas;