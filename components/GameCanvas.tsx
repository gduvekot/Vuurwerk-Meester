import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, 
  Firework, 
  Particle, 
  FireworkStatus, 
  ScoreStats 
} from '../types';
import { 
  GRAVITY, 
  APEX_THRESHOLD, 
  SCORE_PERFECT, 
  SCORE_GOOD, 
  EXPLOSION_PARTICLES, 
  EXPLOSION_SPEED, 
  PARTICLE_DECAY,
  BEAT_MS,
  FLIGHT_DURATION_BEATS,
  Difficulty // NIEUW
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onScoreUpdate: (points: number, accuracy: 'perfect' | 'good' | 'miss' | 'wet') => void;
  onGameOver: () => void;
  colors: string[];
  paused?: boolean;
  // NIEUWE PROPS
  baseLaunchInterval: number; 
  speedMultiplier: number;    
  selectedDifficulty: Difficulty; // NIEUW
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onScoreUpdate, 
  onGameOver, 
  colors, 
  paused = false,
  baseLaunchInterval, 
  speedMultiplier,    
  selectedDifficulty, // Ontvang de prop
  timeLeft

}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const pausedRef = useRef<boolean>(false);
  
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);


  const TEXT_CHANCE = 0.2; 
 const TEXT_WORDS = ['CHARLIE KIRK']; 

const getTextPoints = (
  text: string,
  cx: number,
  cy: number
) => {
  const points: { x: number; y: number }[] = [];
  const w = 420;
  const h = 140;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const offCtx = off.getContext('2d');
  if (!offCtx) return points;

  offCtx.clearRect(0, 0, w, h);
  offCtx.font = 'bold 56px Arial';
  offCtx.fillStyle = '#fff';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(text, w / 2, h / 2);

  const img = offCtx.getImageData(0, 0, w, h).data;

  for (let i = 0; i < img.length; i += 4) {
    if (img[i] > 200) {
      const px = (i / 4) % w;
      const py = Math.floor(i / 4 / w);

      if ((px + py) % 3 === 0) {
        points.push({
          x: cx - w / 2 + px,
          y: cy - h / 2 + py
        });
      }
    }
  }

  return points;
};


const createTextExplosion = (
  text: string,
  x: number,
  y: number,
  color: string
) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const points = getTextPoints(text, x, y);
  points.forEach(p => {
    particlesRef.current.push({
      id: Math.random(),
      pos: { x, y },
      vel: {
        x: (p.x - x) * 0.06,
        y: (p.y - y) * 0.06
      },
      life: 1,
      maxLife: 1,
      color: getParticleColor(color, true),
      size: 2,
      decay: PARTICLE_DECAY * 0.9
    });
  });
};

const createRingExplosion = (x: number, y: number, color: string) => {
  const count = 60;
  const speed = 3;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    particlesRef.current.push({
      id: Math.random(),
      pos: { x, y },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      life: 1,
      maxLife: 1,
      color: getParticleColor(color, true),
      size: 2,
      decay: PARTICLE_DECAY
    });
  }
};

const createSpiralExplosion = (x: number, y: number, color: string) => {
  const count = 80;

  for (let i = 0; i < count; i++) {
    const angle = i * 0.35;
    const speed = i * 0.04;

    particlesRef.current.push({
      id: Math.random(),
      pos: { x, y },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      life: 1,
      maxLife: 1,
      color: getParticleColor(color, true),
      size: 2,
      decay: PARTICLE_DECAY * 0.8
    });
  }
};


const createDoubleExplosion = (x: number, y: number, color: string) => {
  createExplosion(x, y, color, 'perfect');

  setTimeout(() => {
    createExplosion(
      x + (Math.random() - 0.5) * 30,
      y + (Math.random() - 0.5) * 30,
      color,
      'normal'
    );
  }, 120);
};



  const spawnFirework = (width: number, height: number) => {
    // 1. Bepaal de horizontale spreiding op basis van de moeilijkheidsgraad
    let horizontalSpread = 0.8; // Normaal: van 10% tot 90% van de breedte
    if (selectedDifficulty === Difficulty.HARD) {
      horizontalSpread = 1.0; // Moeilijk: Van 0% tot 100% van de breedte (breder)
    } else if (selectedDifficulty === Difficulty.EASY) {
      horizontalSpread = 0.5; // Makkelijk: Beperkt tot het midden (minder breed)
    }

    // Bereken het lanceerpunt op basis van de spreiding
    const x = width * ((1 - horizontalSpread) / 2) + Math.random() * (width * horizontalSpread);
    const startY = height;
    
    // Bepaal de vluchtparameters
    const durationMs = FLIGHT_DURATION_BEATS * BEAT_MS;
    const estimatedFrames = durationMs / 11.666; 
    const vy = -(GRAVITY * estimatedFrames);
    
    const distance = (vy * estimatedFrames) + (0.5 * GRAVITY * (estimatedFrames * estimatedFrames));
    const targetHeight = startY + distance;

    // 2. Bepaal de zijwaartse snelheid
    let vxRange = 1; // Normaal
    if (selectedDifficulty === Difficulty.HARD) {
      vxRange = 2; // Snellere zijwaartse drift (moeilijker te volgen)
    } else if (selectedDifficulty === Difficulty.EASY) {
      vxRange = 0.5; // Langzamere zijwaartse drift
    }

    const fw: Firework = {
      id: Date.now() + Math.random(),
      pos: { x, y: startY },
      vel: { x: (Math.random() - 0.5) * vxRange, y: vy },
      color: colors[Math.floor(Math.random() * colors.length)],
      status: FireworkStatus.RISING,
      apexY: targetHeight,
      trail: []
    };
    fireworksRef.current.push(fw);
  };

  const getParticleColor = (baseColor: string, perfect: boolean) => {
  if (!perfect) return baseColor;
  return Math.random() > 0.5 ? '#ffffff' : baseColor;
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
        color: getParticleColor(color, type === 'perfect'),
        size: Math.random() * 3 + 1,
        decay: PARTICLE_DECAY * (0.5 + Math.random() * 0.5)
      });
    }
  };

  const update = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentTime = timeLeftRef.current;
    const dynamicSpeedMultiplier = (currentTime <= 20 && currentTime >= 10) ? 2 : 1.0;

    // Bepaal de actuele lanceerinterval met dynamische versnelling
    // Lager interval = snellere lancering
    const currentLaunchInterval = baseLaunchInterval / speedMultiplier;

    if (gameState === GameState.PLAYING && !pausedRef.current) {
      // Gebruik de dynamische interval
      if (time - lastLaunchRef.current > currentLaunchInterval) { 
        const drift = (time - lastLaunchRef.current) - currentLaunchInterval;
        lastLaunchRef.current = time - drift; 
        spawnFirework(canvas.width, canvas.height);
      }
    }

    fireworksRef.current.forEach(fw => {
      if (fw.status === FireworkStatus.RISING || fw.status === FireworkStatus.WET || fw.status === FireworkStatus.DUD) {
        
        fw.pos.x += fw.vel.x * dynamicSpeedMultiplier;
        fw.pos.y += fw.vel.y * dynamicSpeedMultiplier;
        fw.vel.y += GRAVITY * dynamicSpeedMultiplier;

        if (frameCountRef.current % 3 === 0 && fw.status === FireworkStatus.RISING) {
            fw.trail.push({ ...fw.pos });
            if (fw.trail.length > 10) fw.trail.shift();
        }
        if (fw.pos.y > canvas.height + 50) {
            fw.status = FireworkStatus.DEAD;
            if (fw.status === FireworkStatus.RISING) {
              // Wordt 'wet' als hij de bodem bereikt zonder ontploffing
              onScoreUpdate(0, 'wet'); 
            }
        }
        if (fw.status === FireworkStatus.RISING && fw.vel.y > 8) { 
          // Hier wordt hij 'wet' als hij te ver valt zonder geklikt te worden.
          fw.status = FireworkStatus.WET;
          fw.color = '#555'; 
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
    if (gameState === GameState.PLAYING) {
      if (!pausedRef.current) update(time);
      draw();
    } else {
      if (gameState === GameState.GAME_OVER) {
        update(time);
        draw();
      }
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

  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

    const handleTrigger = useCallback(() => {
      if (gameState !== GameState.PLAYING) return;

      const candidates = fireworksRef.current.filter(
        fw => fw.status === FireworkStatus.RISING
      );
      if (candidates.length === 0) return;

      candidates.sort((a, b) => Math.abs(a.vel.y) - Math.abs(b.vel.y));
      const target = candidates[0];
      const vy = target.vel.y;

      if (Math.abs(vy) <= APEX_THRESHOLD) {
        target.status = FireworkStatus.EXPLODING;

        const TEXT_CHANCE = 0.25; 
        const WORDS = ['CHARLIE KIRK']; 

        const r = Math.random();

        if (r < 0.2) {
          const word = WORDS[Math.floor(Math.random() * WORDS.length)];
          createTextExplosion(word, target.pos.x, target.pos.y, target.color);

        } else if (r < 0.4) {
          createRingExplosion(target.pos.x, target.pos.y, target.color);

        } else if (r < 0.6) {
          createSpiralExplosion(target.pos.x, target.pos.y, target.color);

        } else if (r < 0.8) {
          createDoubleExplosion(target.pos.x, target.pos.y, target.color);

        } else {
          createExplosion(
            target.pos.x,
            target.pos.y,
            target.color,
            'perfect'
          );
        }


        onScoreUpdate(SCORE_PERFECT, 'perfect');
        target.status = FireworkStatus.DEAD;
        return;
      }
      if (vy < -APEX_THRESHOLD) {
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
        return;
      }

      if (vy > APEX_THRESHOLD) {
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
      // OPLOSSING VOOR DE SYNTAX FOUT: classname staat op één regel
      className="absolute top-0 left-0 w-full h-full cursor-pointer touch-none"
    />
  );
};

export default GameCanvas;
