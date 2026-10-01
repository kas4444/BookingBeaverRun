import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronRight, Heart, Music2, RotateCcw, Trophy } from 'lucide-react';
import beaverSrc from '@/assets/sprites/beaver.png';

type GameMode = 'ready' | 'playing' | 'gameover' | 'victory';
type Screen = 'menu' | 'options' | 'story' | 'tutorial' | 'game';
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Platform = { x: number; y: number; w: number; h: number; key: string; title: string; type: string; points: number; accent: string; status: string; story: string };
type Player = { x: number; y: number; vx: number; vy: number; width: number; height: number; grounded: boolean; coyote: number; anim: number; pose: 'idle' | 'run' | 'jump' | 'fall' | 'land'; landTimer: number; facing: 1 | -1 };

const WORLD_WIDTH = 6600;
const FLOOR_Y = 590;
const START_X = 120;
const START_Y = 440;
const platforms: Platform[] = [
  { x: 0, y: FLOOR_Y, w: 520, h: 26, key: 'BASE', title: 'Sprint board', type: 'EPIC', points: 0, accent: '#4c6fff', status: 'EPIC', story: 'The sprint board is overflowing. It is time to bring order to the chaos.' },
  { x: 650, y: 485, w: 300, h: 28, key: 'APW-101', title: 'Set up project', type: 'TASK', points: 100, accent: '#d97706', status: 'TO DO', story: 'Booking Beaver prepared the project space so the team could move fast.' },
  { x: 1000, y: 385, w: 270, h: 28, key: 'APW-204', title: 'Ship the feature', type: 'STORY', points: 200, accent: '#0052cc', status: 'TO DO', story: 'The core feature is ready. One clean jump moved the sprint forward.' },
  { x: 1330, y: 505, w: 280, h: 28, key: 'APW-318', title: 'Fix flaky test', type: 'BUG', points: 300, accent: '#de350b', status: 'TO DO', story: 'A flaky test was slowing everyone down. The beaver tracked it down and fixed it.' },
  { x: 1660, y: 405, w: 300, h: 28, key: 'APW-420', title: 'Design review', type: 'TASK', points: 400, accent: '#d97706', status: 'TO DO', story: 'The design review is complete. Everyone now knows exactly what to build.' },
  { x: 1980, y: 300, w: 270, h: 28, key: 'APW-512', title: 'Make it delightful', type: 'STORY', points: 500, accent: '#0052cc', status: 'TO DO', story: 'A little polish turned the feature into something the team can be proud of.' },
  { x: 2300, y: 455, w: 310, h: 28, key: 'APW-609', title: 'Remove blockers', type: 'BUG', points: 600, accent: '#de350b', status: 'TO DO', story: 'The blockers are gone. The sprint is moving smoothly again.' },
  { x: 2620, y: 350, w: 290, h: 28, key: 'APW-711', title: 'Celebrate wins', type: 'STORY', points: 700, accent: '#0052cc', status: 'TO DO', story: 'The team paused to celebrate a win before tackling the next ticket.' },
  { x: 2940, y: 470, w: 310, h: 28, key: 'APW-808', title: 'Polish details', type: 'TASK', points: 800, accent: '#d97706', status: 'TO DO', story: 'Booking Beaver checked every last detail. Quality is part of shipping.' },
  { x: 3260, y: 335, w: 290, h: 28, key: 'APW-900', title: 'Release to prod', type: 'EPIC', points: 900, accent: '#6554c0', status: 'TO DO', story: 'Release prep is complete. The finish line is finally in sight.' },
  { x: 3560, y: 470, w: 310, h: 28, key: 'APW-1001', title: 'Sync the team', type: 'TASK', points: 1000, accent: '#d97706', status: 'TO DO', story: 'The team is aligned, the board is clear, and everyone is ready for launch.' },
  { x: 3860, y: 350, w: 290, h: 28, key: 'APW-1110', title: 'Verify analytics', type: 'STORY', points: 1100, accent: '#0052cc', status: 'TO DO', story: 'The numbers are wired up, so the team can learn from every release.' },
  { x: 4160, y: 455, w: 310, h: 28, key: 'APW-1204', title: 'Close feedback', type: 'TASK', points: 1200, accent: '#d97706', status: 'TO DO', story: 'Customer feedback is answered. The last loose ends are tied up.' },
  { x: 4460, y: 305, w: 290, h: 28, key: 'APW-1318', title: 'Harden the build', type: 'BUG', points: 1300, accent: '#de350b', status: 'TO DO', story: 'The build is solid and dependable. No surprise can stop this sprint now.' },
  { x: 4760, y: 445, w: 310, h: 28, key: 'APW-1420', title: 'Share the demo', type: 'STORY', points: 1400, accent: '#0052cc', status: 'TO DO', story: 'The demo is ready to show the world what the team accomplished.' },
  { x: 5060, y: 340, w: 290, h: 28, key: 'APW-1512', title: 'Approve launch', type: 'EPIC', points: 1500, accent: '#6554c0', status: 'TO DO', story: 'Approval is in. The Swiss mountains can hear the team cheering already.' },
  { x: 5360, y: 455, w: 310, h: 28, key: 'APW-1609', title: 'Monitor rollout', type: 'TASK', points: 1600, accent: '#d97706', status: 'TO DO', story: 'The rollout is healthy. Booking Beaver is watching the final green lights.' },
  { x: 5660, y: 325, w: 300, h: 28, key: 'APW-1711', title: 'Finish the sprint', type: 'STORY', points: 1700, accent: '#0052cc', status: 'TO DO', story: 'Every ticket is done. Only the final flag remains.' },
  { x: 6060, y: 455, w: 400, h: 28, key: 'DONE', title: 'Ship the sprint', type: 'GOAL', points: 2000, accent: '#ffab00', status: 'GOAL', story: 'Sprint shipped! The team made the deadline, together.' },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const makePlayer = (): Player => ({ x: START_X, y: START_Y, vx: 0, vy: 0, width: 80, height: 96, grounded: false, coyote: 0, anim: 0, pose: 'idle', landTimer: 0, facing: 1 });

const storyScenes = [
  { title: 'Deadline approaching...', text: 'The sprint board is overflowing. Tickets are piling up. The team is stressed and worried — the deadline is tomorrow!', mood: 'worried' },
  { title: 'Don\'t panic!', text: 'Booking Beaver arrives! With hard hat on and tools ready, he\'s here to accomplish every single task on time.', mood: 'hero' },
  { title: 'Let\'s ship it!', text: 'Jump from ticket to ticket, clear every issue, and get the whole sprint across the finish line. The beaver has got this.', mood: 'confident' },
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const gameRef = useRef({
    mode: 'ready' as GameMode,
    score: 0,
    lives: 3,
    camera: 0,
    particles: [] as Particle[],
    player: makePlayer(),
    collected: new Set<string>(),
    lastTime: 0,
    shake: 0,
    audio: null as AudioContext | null,
    bgOffset: 0,
    links: [] as Array<{ from: string; to: string }>,
    lastTaskKey: 'BASE',
  });
  const [screen, setScreen] = useState<Screen>('menu');
  const [storyScene, setStoryScene] = useState(0);
  const [mode, setMode] = useState<GameMode>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sprintStory, setSprintStory] = useState(platforms[0].story);
  const [sprintTask, setSprintTask] = useState(platforms[0].title);

  const beep = useCallback((frequency: number, duration = 0.08, type: OscillatorType = 'sine', vol = 0.05) => {
    if (muted) return;
    const game = gameRef.current;
    try {
      game.audio ??= new AudioContext();
      const oscillator = game.audio.createOscillator();
      const gain = game.audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(vol, game.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, game.audio.currentTime + duration);
      oscillator.connect(gain).connect(game.audio.destination);
      oscillator.start();
      oscillator.stop(game.audio.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }, [muted]);

  const burst = useCallback((x: number, y: number, color: string, count = 10) => {
    const game = gameRef.current;
    for (let i = 0; i < count; i += 1) {
      game.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4 - 1, life: 1, color, size: Math.random() * 4 + 2 });
    }
  }, []);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.player = makePlayer();
    game.camera = 0;
    game.score = 0;
    game.lives = 3;
    game.collected = new Set<string>();
    game.particles = [];
    game.links = [];
    game.lastTaskKey = 'BASE';
    game.shake = 0;
    game.mode = 'playing';
    setScore(0);
    setLives(3);
    setProgress(0);
    setSprintStory(platforms[0].story);
    setSprintTask(platforms[0].title);
    setMode('playing');
  }, []);

  const launchGame = useCallback(() => {
    resetGame();
    setScreen('game');
    beep(420, 0.12, 'square');
    window.setTimeout(() => beep(660, 0.14, 'square'), 80);
  }, [beep, resetGame]);

  const startStory = useCallback(() => {
    setStoryScene(0);
    setScreen('story');
    beep(320, 0.12, 'sine');
  }, [beep]);

  const advanceStory = useCallback(() => {
    if (storyScene < storyScenes.length - 1) {
      setStoryScene((s) => s + 1);
      beep(440, 0.08, 'triangle');
    } else {
      setScreen('tutorial');
      beep(520, 0.1, 'square');
    }
  }, [beep, storyScene]);

  const jump = useCallback(() => {
    const game = gameRef.current;
    const player = game.player;
    if (game.mode !== 'playing' || (!player.grounded && player.coyote <= 0)) return;
    player.vy = -13.5;
    player.grounded = false;
    player.coyote = 0;
    player.pose = 'jump';
    burst(player.x + player.width / 2, player.y + player.height, '#9fb8ff', 7);
    beep(500, 0.1, 'triangle');
  }, [beep, burst]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' '].includes(key)) event.preventDefault();
      keysRef.current.add(key);
      if ((key === 'w' || key === 'arrowup' || key === ' ') && !event.repeat) jump();
      if (key === 'enter') {
        if (screen === 'menu') startStory();
        else if (screen === 'story') advanceStory();
        else if (screen === 'tutorial') launchGame();
        else if (screen === 'game' && (mode === 'gameover' || mode === 'victory')) launchGame();
      }
    };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [advanceStory, jump, launchGame, mode, screen, startStory]);

  // ─── Canvas game loop ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const mascot = new Image();
    mascot.src = beaverSrc;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const drawRounded = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const drawBackground = (w: number, h: number, camera: number, t: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0d1633');
      grad.addColorStop(0.55, '#152354');
      grad.addColorStop(1, '#0c1428');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Stars
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 80; i += 1) {
        const sx = ((i * 137 - camera * (i % 3 + 1) * 0.06) % (w + 60) + w + 60) % (w + 60);
        const sy = 20 + ((i * 71) % (h * 0.55));
        ctx.globalAlpha = i % 6 === 0 ? 0.85 + Math.sin(t * 0.003 + i) * 0.15 : 0.3;
        ctx.fillRect(sx, sy, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
      }
      ctx.globalAlpha = 1;
      // Distant mountains
      ctx.fillStyle = 'rgba(60, 90, 170, .16)';
      for (let i = -1; i < 10; i += 1) {
        const mx = i * 240 - (camera * 0.12 % 240);
        ctx.beginPath();
        ctx.moveTo(mx, h - 70);
        ctx.lineTo(mx + 130, h - 240);
        ctx.lineTo(mx + 320, h - 70);
        ctx.fill();
      }
      // Swiss lake behind the layered Alpine landscape
      ctx.fillStyle = 'rgba(43, 133, 178, .2)';
      ctx.fillRect(0, h - 190, w, 120);
      ctx.fillStyle = 'rgba(104, 176, 203, .05)';
      for (let r = 0; r < 2; r += 1) ctx.fillRect(0, h - 168 + r * 34, w, 1);
      for (let i = -1; i < 9; i += 1) {
        const mx = i * 360 - (camera * 0.2 % 360);
        const peak = h - 250 - (i % 3) * 35;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(77, 112, 157, .48)' : 'rgba(56, 88, 136, .52)';
        ctx.beginPath();
        ctx.moveTo(mx, h - 70);
        ctx.lineTo(mx + 150, peak);
        ctx.lineTo(mx + 220, peak + 92);
        ctx.lineTo(mx + 315, h - 70);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(237, 246, 255, .8)';
        ctx.beginPath();
        ctx.moveTo(mx + 150, peak);
        ctx.lineTo(mx + 118, peak + 54);
        ctx.lineTo(mx + 150, peak + 39);
        ctx.lineTo(mx + 180, peak + 54);
        ctx.closePath();
        ctx.fill();
      }
      // A clean foreground slope gives every chalet the same solid footing
      ctx.fillStyle = 'rgba(42, 82, 75, .96)';
      ctx.beginPath();
      ctx.moveTo(0, h - 132);
      ctx.lineTo(w, h - 132);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Alpine chalet silhouettes and Swiss flags
      for (let i = -1; i < 8; i += 1) {
        const hx = i * 430 - (camera * 0.3 % 430) + 80;
        const hy = h - 187;
        ctx.fillStyle = 'rgba(32, 49, 76, .78)';
        ctx.fillRect(hx, hy, 82, 55);
        ctx.beginPath();
        ctx.moveTo(hx - 12, hy);
        ctx.lineTo(hx + 41, hy - 39);
        ctx.lineTo(hx + 94, hy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff4d5f';
        ctx.fillRect(hx + 18, hy - 62, 3, 62);
        ctx.fillRect(hx + 21, hy - 62, 22, 15);
        ctx.fillStyle = '#fff';
        ctx.fillRect(hx + 30, hy - 58, 5, 7);
        ctx.fillRect(hx + 27, hy - 55, 11, 3);
      }
      // Ground glow
      ctx.fillStyle = 'rgba(76, 111, 255, .06)';
      ctx.fillRect(0, h - 90, w, 90);
    };

    const drawPlatform = (p: Platform, camera: number) => {
      const x = p.x - camera;
      if (x > canvas.width || x + p.w < 0) return;
      const done = gameRef.current.collected.has(p.key);
      const cardBg = done ? '#dcf5e7' : '#ffffff';
      const topBar = done ? '#22a06b' : p.accent;
      const statusText = done ? 'DONE' : p.status;
      const statusColor = done ? '#22a06b' : '#8993a8';
      const titleColor = done ? '#1d7a4f' : '#172b4d';
      const keyColor = done ? '#27814f' : '#6b778c';

      // Card shadow
      ctx.shadowColor = 'rgba(0,0,0,.25)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      drawRounded(x, p.y, p.w, p.h, 6, cardBg);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Top accent bar
      ctx.fillStyle = topBar;
      ctx.beginPath();
      ctx.roundRect(x, p.y, p.w, 5, [6, 6, 0, 0]);
      ctx.fill();

      if (p.key === 'BASE') {
        ctx.fillStyle = 'rgba(76,111,255,.12)';
        for (let g = x + 4; g < x + p.w; g += 30) ctx.fillRect(g, p.y + 8, 1, p.h - 12);
        ctx.fillStyle = '#4c6fff';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.fillText('SPRINT BOARD', x + 12, p.y + 19);
        return;
      }

      // Status pill (top-right)
      ctx.font = '700 8px Inter, sans-serif';
      const pw = Math.max(ctx.measureText(statusText).width + 14, 32);
      drawRounded(x + p.w - pw - 8, p.y + 6, pw, 14, 7, done ? '#dff7e9' : '#f0f1f5');
      ctx.fillStyle = statusColor;
      ctx.fillText(statusText, x + p.w - pw - 8 + 7, p.y + 16);

      // Type icon dot (left side, vertically centered)
      ctx.fillStyle = done ? '#22a06b' : p.accent;
      ctx.beginPath();
      ctx.arc(x + 12, p.y + 13, 4, 0, Math.PI * 2);
      ctx.fill();
      if (done) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, p.y + 13);
        ctx.lineTo(x + 11.5, p.y + 14.5);
        ctx.lineTo(x + 14, p.y + 11.5);
        ctx.stroke();
      }

      // Key
      ctx.fillStyle = keyColor;
      ctx.font = '700 9px Inter, sans-serif';
      ctx.fillText(p.key, x + 22, p.y + 16);

      // Title
      ctx.fillStyle = titleColor;
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText(p.title, x + 12, p.y + 24);

      // Done checkmark overlay glow
      if (done) {
        ctx.globalAlpha = 0.5 + Math.sin(gameRef.current.lastTime * 0.004) * 0.15;
        ctx.strokeStyle = '#22a06b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 1, p.y + 1, p.w - 2, p.h - 2, 5);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const drawFlowLinks = (camera: number, t: number) => {
      for (const link of gameRef.current.links) {
        const from = platforms.find((platform) => platform.key === link.from);
        const to = platforms.find((platform) => platform.key === link.to);
        if (!from || !to) continue;
        const x1 = from.x + from.w / 2 - camera;
        const y1 = from.y - 4;
        const x2 = to.x + to.w / 2 - camera;
        const y2 = to.y - 4;
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -t * 0.02;
        ctx.strokeStyle = 'rgba(255, 203, 76, .85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + (x2 - x1) * 0.35, y1 - 55, x1 + (x2 - x1) * 0.65, y2 - 55, x2, y2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawGoal = (camera: number, t: number) => {
      const x = 6240 - camera;
      // Pole
      ctx.fillStyle = '#b8a050';
      ctx.fillRect(x - 2, 250, 4, 200);
      // Flag
      const wave = Math.sin(t * 0.005) * 6;
      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.moveTo(x, 255);
      ctx.quadraticCurveTo(x + 56 + wave, 268, x + 112, 280);
      ctx.lineTo(x, 305);
      ctx.closePath();
      ctx.fill();
      // Flag text
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '900 12px Inter, sans-serif';
      ctx.fillText('SHIP IT!', x + 18, 285);
      // Glow
      ctx.globalAlpha = 0.3 + Math.sin(t * 0.005) * 0.1;
      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.arc(x + 5, 248, 28 + Math.sin(t * 0.004) * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawBeaver = (player: Player, camera: number) => {
      const cx = player.x - camera + player.width / 2;
      const cy = player.y + player.height / 2;
      const t = player.anim;
      const pose = player.pose;

      // Animation transforms
      const bounce = pose === 'idle' ? Math.sin(t * 0.07) * 2 : 0;
      const sx = pose === 'land' ? 1.15 : pose === 'run' ? 1 + Math.sin(t * 0.24) * 0.04 : pose === 'jump' ? 0.9 : pose === 'fall' ? 1.06 : 1;
      const sy = pose === 'land' ? 0.84 : pose === 'jump' ? 1.1 : pose === 'fall' ? 0.92 : 1;
      const tilt = pose === 'run' ? Math.sin(t * 0.24) * 0.04 : pose === 'fall' ? -0.08 : pose === 'jump' ? 0.03 : 0;

      // Shadow
      if (player.grounded) {
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath();
        ctx.ellipse(cx, player.y + player.height + 4, 32, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(cx, cy + bounce);
      ctx.scale(player.facing * sx, sy);
      ctx.rotate(tilt);

      // Draw the mascot PNG cropped to the character body (cut off excess tail space)
      if (mascot.complete && mascot.naturalWidth > 0) {
        const nw = mascot.naturalWidth;
        const nh = mascot.naturalHeight;
        const cropX = nw * 0.16;
        const cropW = nw * 0.64;
        const cropY = 0;
        const cropH = nh * 0.95;
        ctx.drawImage(mascot, cropX, cropY, cropW, cropH, -50, -50, 100, 100);
      }
      ctx.restore();

      // Run speed lines
      if (pose === 'run') {
        ctx.fillStyle = 'rgba(255, 207, 74, .5)';
        const off = Math.sin(t * 0.24) * 8;
        ctx.fillRect(cx - 28 - off, player.y + 30, 14, 2);
        ctx.fillRect(cx - 34 + off, player.y + 45, 18, 2);
        ctx.fillRect(cx - 24 - off, player.y + 60, 12, 2);
      }

      // Landing dust ring
      if (pose === 'land') {
        ctx.globalAlpha = Math.max(0, player.landTimer / 14);
        ctx.strokeStyle = '#b8c7ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, player.y + player.height + 6, 42 - player.landTimer, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Jump dust puff
      if (pose === 'jump' && player.vy < -8) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#b8c7ff';
        ctx.beginPath();
        ctx.arc(cx - 12, player.y + player.height, 6, 0, Math.PI * 2);
        ctx.arc(cx + 12, player.y + player.height, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const loop = (time: number) => {
      const game = gameRef.current;
      const delta = Math.min((time - game.lastTime) / 16.67 || 1, 2);
      game.lastTime = time;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const player = game.player;

      // Animate background offset even in menu
      game.bgOffset += delta * 0.3;

      if (game.mode === 'playing') {
        const keys = keysRef.current;
        const left = keys.has('a') || keys.has('arrowleft');
        const right = keys.has('d') || keys.has('arrowright');
        if (left) { player.vx -= 0.52 * delta; player.facing = -1; }
        if (right) { player.vx += 0.52 * delta; player.facing = 1; }
        if (!left && !right) player.vx *= Math.pow(0.78, delta);
        player.vx = clamp(player.vx, -6.2, 6.2);
        player.x += player.vx * delta;
        player.vy += 0.62 * delta;
        const wasGrounded = player.grounded;
        const prevBottom = player.y + player.height;
        player.y += player.vy * delta;
        player.grounded = false;

        for (const p of platforms) {
          const overlap = player.x + player.width - 14 > p.x && player.x + 14 < p.x + p.w;
          if (overlap && player.vy >= 0 && prevBottom <= p.y + 6 && player.y + player.height >= p.y) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;
            if (!wasGrounded) {
              player.pose = 'land';
              player.landTimer = 14;
              burst(player.x + player.width / 2, p.y, '#b9c9ff', 9);
              beep(180, 0.07, 'sine');
            }
            if (p.points && !game.collected.has(p.key)) {
              game.collected.add(p.key);
              game.links.push({ from: game.lastTaskKey, to: p.key });
              game.lastTaskKey = p.key;
              game.score += p.points;
              setScore(game.score);
              setSprintStory(p.story);
              setSprintTask(p.title);
              burst(p.x + p.w / 2, p.y - 4, '#22a06b', 12);
              burst(p.x + p.w / 2, p.y - 4, '#ffca52', 10);
              beep(760, 0.13, 'square');
              window.setTimeout(() => beep(880, 0.1, 'square'), 60);
            }
          }
        }

        if (player.grounded) player.coyote = 7;
        else player.coyote = Math.max(0, player.coyote - delta);
        if (player.landTimer > 0) player.landTimer -= delta;
        else if (Math.abs(player.vx) > 0.4 && player.grounded) player.pose = 'run';
        else if (player.grounded) player.pose = 'idle';
        else player.pose = player.vy < 0 ? 'jump' : 'fall';
        player.anim += delta;
        player.x = clamp(player.x, 0, WORLD_WIDTH - player.width);
        game.camera += ((player.x - w * 0.36) - game.camera) * 0.08;
        game.camera = clamp(game.camera, 0, WORLD_WIDTH - w);

        if (player.y > h + 100) {
          game.lives -= 1;
          setLives(game.lives);
          game.shake = 16;
          beep(110, 0.18, 'sawtooth');
          if (game.lives <= 0) { game.mode = 'gameover'; setMode('gameover'); }
          else { player.x = Math.max(START_X, player.x - 260); player.y = START_Y; player.vx = 0; player.vy = 0; }
        }

        if (player.x > 6100) {
          game.mode = 'victory';
          setMode('victory');
          game.score += 1000;
          setScore(game.score);
          burst(player.x, player.y, '#ffca52', 45);
          burst(player.x, player.y, '#22a06b', 25);
          beep(660, 0.15, 'square');
          window.setTimeout(() => beep(880, 0.2, 'square'), 130);
          window.setTimeout(() => beep(1100, 0.25, 'square'), 260);
        }
        setProgress(clamp(Math.round((player.x / 6240) * 100), 0, 100));
      }

      // Update particles
      for (const p of game.particles) {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 0.16 * delta;
        p.life -= 0.025 * delta;
      }
      game.particles = game.particles.filter((p) => p.life > 0);

      // Screen shake
      const shakeX = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
      const shakeY = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
      game.shake = Math.max(0, game.shake - delta);

      // Render
      ctx.save();
      ctx.translate(shakeX, shakeY);
      drawBackground(w, h, screen === 'game' ? game.camera : game.bgOffset, time);
      if (screen === 'game' || screen === 'tutorial') {
        drawFlowLinks(screen === 'tutorial' ? 0 : game.camera, time);
        for (const p of platforms) drawPlatform(p, screen === 'tutorial' ? 0 : game.camera);
        drawGoal(screen === 'tutorial' ? 0 : game.camera, time);
        for (const p of game.particles) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - (screen === 'tutorial' ? 0 : game.camera), p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        drawBeaver(player, screen === 'tutorial' ? 0 : game.camera);
      }
      ctx.restore();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { observer.disconnect(); if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [beep, burst, screen]);

  const goMenu = useCallback(() => {
    setScreen('menu');
    gameRef.current.mode = 'ready';
    setMode('ready');
    beep(300, 0.08, 'sine');
  }, [beep]);

  // ─── Render ───
  return (
    <div className="game-viewport">
      <canvas ref={canvasRef} className="game-canvas" aria-label="Apwide Beaver Run game" />

      {/* Mute toggle - always visible */}
      <button className={`mute-btn${muted ? ' is-muted' : ''}`} onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
        <Music2 size={17} strokeWidth={2.5} fill={muted ? 'none' : 'currentColor'} aria-hidden="true" />
      </button>

      {/* In-game HUD */}
      {screen === 'game' && mode === 'playing' && (
        <div className="hud">
          <div className="hud-left">
            <div className="hud-score"><span>SCORE</span><b>{score.toLocaleString().padStart(5, '0')}</b></div>
            <div className="hud-progress"><span>SPRINT</span><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
          </div>
          <div className="hud-lives">{[0, 1, 2].map((i) => <Heart key={i} size={18} fill={i < lives ? '#ff5b5b' : 'none'} color={i < lives ? '#ff5b5b' : '#445'} />)}</div>
        </div>
      )}

      {screen === 'game' && mode === 'playing' && (
        <div className="sprint-story-banner">
          <span>NOW DONE · {sprintTask}</span>
          <b>{sprintStory}</b>
        </div>
      )}

      {/* Touch controls */}
      {screen === 'game' && mode === 'playing' && (
        <div className="touch-controls">
          <button onPointerDown={() => keysRef.current.add('arrowleft')} onPointerUp={() => keysRef.current.delete('arrowleft')} onPointerLeave={() => keysRef.current.delete('arrowleft')}><ArrowLeft size={22} /></button>
          <button onPointerDown={() => keysRef.current.add('arrowright')} onPointerUp={() => keysRef.current.delete('arrowright')} onPointerLeave={() => keysRef.current.delete('arrowright')}><ArrowRight size={22} /></button>
          <button className="jump-btn" onPointerDown={jump}><ArrowUp size={22} /></button>
        </div>
      )}

      {/* ─── MENU SCREEN ─── */}
      {screen === 'menu' && (
        <div className="overlay menu-screen">
          <img src="/APWIDE_LOGO_MAIN_WHITE.png" alt="Apwide" className="menu-logo" />
          <h1 className="menu-title">BEAVER<span className="accent"> RUN</span></h1>
          <p className="menu-subtitle">A sprint-shipping platformer</p>
          <div className="menu-buttons">
            <button className="btn-primary" onClick={startStory}>PLAY<ChevronRight size={20} /></button>
            <button className="btn-secondary" onClick={() => { setScreen('options'); beep(350, 0.08, 'sine'); }}>OPTIONS</button>
          </div>
          <div className="menu-beaver"><img src={beaverSrc} alt="Beaver mascot" style={{ marginTop: '220px' }} /></div>
          <p className="menu-credit">Press Enter to start</p>
        </div>
      )}

      {/* ─── OPTIONS SCREEN ─── */}
      {screen === 'options' && (
        <div className="overlay options-screen">
          <h2 className="screen-title">OPTIONS</h2>
          <div className="options-list">
            <div className="option-row">
              <span className="option-question">Do you love beavers?</span>
              <div className="option-choices"><button className="option-choice active" disabled>YES</button></div>
            </div>
            <div className="option-row">
              <span className="option-question">The best Atlassian Marketplace Vendor?</span>
              <div className="option-choices"><button className="option-choice active" disabled>Apwide</button></div>
            </div>
          </div>
          <button className="btn-primary" onClick={goMenu}>BACK<ChevronRight size={20} /></button>
        </div>
      )}

      {/* ─── STORY SCREEN ─── */}
      {screen === 'story' && (
        <div className="overlay story-screen" onClick={advanceStory}>
          <div className="story-panel" key={storyScene}>
            <div className={`story-beaver story-mood-${storyScenes[storyScene].mood}`}>
              <img src={beaverSrc} alt="Beaver" />
            </div>
            <div className="story-text">
              <h3>{storyScenes[storyScene].title}</h3>
              <p>{storyScenes[storyScene].text}</p>
            </div>
          </div>
          <div className="story-dots">{storyScenes.map((_, i) => <span key={i} className={i === storyScene ? 'dot active' : 'dot'} />)}</div>
          <p className="story-hint">Click or press Enter to continue</p>
        </div>
      )}

      {/* ─── TUTORIAL SCREEN ─── */}
      {screen === 'tutorial' && (
        <div className="overlay tutorial-screen">
          <div className="tutorial-card">
            <h2 className="screen-title">HOW TO PLAY</h2>
            <div className="tutorial-controls">
              <div className="control-group">
                <div className="key-cluster"><kbd>A</kbd><kbd>D</kbd></div>
                <span>or</span>
                <div className="key-cluster"><kbd><ArrowLeft size={14} /></kbd><kbd><ArrowRight size={14} /></kbd></div>
                <span>to run</span>
              </div>
              <div className="control-group">
                <div className="key-cluster"><kbd>W</kbd></div>
                <span>or</span>
                <div className="key-cluster"><kbd><ArrowUp size={14} /></kbd></div>
                <span>or</span>
                <div className="key-cluster"><kbd>SPACE</kbd></div>
                <span>to jump</span>
              </div>
            </div>
            <p className="tutorial-objective">
              Land on Jira tickets to mark them <b style={{ color: '#22a06b' }}>DONE</b> and score points.
              Reach the <b style={{ color: '#ffab00' }}>SHIP IT!</b> flag to complete the sprint.
              Don't fall off — you have 3 lives!
            </p>
            <button className="btn-primary" onClick={launchGame}>START<ChevronRight size={20} /></button>
          </div>
        </div>
      )}

      {/* ─── GAME OVER / VICTORY ─── */}
      {screen === 'game' && (mode === 'gameover' || mode === 'victory') && (
        <div className="overlay result-screen">
          <div className={`result-card ${mode === 'victory' ? 'victory' : 'gameover'}`}>
            <div className="result-icon">{mode === 'victory' ? <Trophy size={32} /> : <RotateCcw size={32} />}</div>
            <h2>{mode === 'victory' ? 'SPRINT SHIPPED!' : 'SPRINT FAILED'}</h2>
            <p className="result-score">Score: <b>{score.toLocaleString()}</b></p>
            <p className="result-msg">{mode === 'victory' ? 'Every ticket is DONE. The beaver saved the sprint!' : 'The deadline slipped. But a true beaver never gives up!'}</p>
            <div className="result-buttons">
              <button className="btn-primary" onClick={launchGame}>{mode === 'victory' ? 'PLAY AGAIN' : 'TRY AGAIN'}<ChevronRight size={20} /></button>
              <button className="btn-secondary" onClick={goMenu}>MENU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
