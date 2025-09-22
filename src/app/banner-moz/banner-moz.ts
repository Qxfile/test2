import {AfterViewInit, Component} from '@angular/core';
import {gsap} from "gsap";

@Component({
  selector: 'app-banner-moz',
  imports: [],
  standalone: true,
  templateUrl: './banner-moz.html',
  styleUrl: './banner-moz.scss'
})
export class BannerMoz implements AfterViewInit {
  private tl?: gsap.core.Timeline;
  private cache = new Map<string, HTMLImageElement>();
  private removeResize?: () => void;

  private off = {
    current: document.createElement('canvas'),
    next: document.createElement('canvas'),
    mask: document.createElement('canvas'),
    comp: document.createElement('canvas')
  };

  private metrics!: { dpr: number; W: number; H: number; colWidths: number[]; };
  private cols!: HTMLElement[];
  private colImgs!: HTMLImageElement[][];
  private framesCount = 0;
  private currentIndex = 0;
  private compAlpha = 1;

  ngAfterViewInit() {
    this.tl?.kill();
    gsap.killTweensOf('*');
    setTimeout(() => this.init(), 1);
  }

  ngOnDestroy() {
    this.tl?.kill();
    this.tl = undefined;
    this.removeResize?.();
    gsap.killTweensOf('*');
  }

  private async init() {
    const banner = document.querySelector<HTMLElement>('.banner');
    const canvas = document.querySelector<HTMLCanvasElement>('.scratch-canvas');
    if (!banner || !canvas) return;

    this.cols = Array.from(banner.querySelectorAll<HTMLElement>('.images'));
    if (!this.cols.length) return;

    this.metrics = this.placeCanvasOverStage(banner, canvas, this.cols);
    this.resizeOffscreens();

    this.colImgs = this.cols.map(col =>
      Array.from(col.querySelectorAll<HTMLImageElement>('img'))
    );
    this.framesCount = Math.min(...this.colImgs.map(a => a.length));
    if (this.framesCount < 2) return;

    const allSrcs = new Set<string>();
    this.colImgs.forEach(list => list.forEach(img => allSrcs.add(img.getAttribute('src') || '')));
    await Promise.all(Array.from(allSrcs).filter(Boolean).map(src => this.loadImage(src)));

    this.currentIndex = 0;
    await this.drawSceneTo(this.off.current.getContext('2d')!, this.currentIndex);
    await this.drawSceneTo(this.off.next.getContext('2d')!, (this.currentIndex + 1) % this.framesCount);
    this.resetMask(); // прозрачная маска
    this.compAlpha = 1;
    this.renderCompositeToMain(canvas);

    const sceneHold = 4.0;
    const scratchDuration = 2.5;

    // единый мастер: каждый цикл встраиваем НОВЫЙ scratch TL через .add(...)
    this.tl = gsap.timeline({ repeat: -1, delay: 0.1 })
      .add(this.buildScratchTimeline(canvas, scratchDuration)) // ровно scratchDuration
      .to({}, { duration: sceneHold })                         // держим сцену
      .call(() => {
        // перейти к следующей сцене
        this.currentIndex = (this.currentIndex + 1) % this.framesCount;
        // next -> current (swap)
        const tmp = this.off.current; this.off.current = this.off.next; this.off.next = tmp;
        // подготовить новую next
        this.drawSceneTo(this.off.next.getContext('2d')!, (this.currentIndex + 1) % this.framesCount);
        // сброс маски и альфы композита к новому циклу
        this.resetMask();
        this.compAlpha = 1;
        this.renderCompositeToMain(canvas);
      });

    // единый ресайз: перезапускаем с тем же паттерном (.add buildScratchTimeline)
    const onResize = () => {
      this.tl?.kill();
      gsap.killTweensOf('*');

      this.metrics = this.placeCanvasOverStage(banner, canvas, this.cols);
      this.resizeOffscreens();

      this.drawSceneTo(this.off.current.getContext('2d')!, this.currentIndex);
      this.drawSceneTo(this.off.next.getContext('2d')!, (this.currentIndex + 1) % this.framesCount);
      this.resetMask();
      this.compAlpha = 1;
      this.renderCompositeToMain(canvas);

      this.tl = gsap.timeline({ repeat: -1, delay: 0.1 })
        .add(this.buildScratchTimeline(canvas, scratchDuration))
        .to({}, { duration: sceneHold })
        .call(() => {
          this.currentIndex = (this.currentIndex + 1) % this.framesCount;
          const tmp2 = this.off.current; this.off.current = this.off.next; this.off.next = tmp2;
          this.drawSceneTo(this.off.next.getContext('2d')!, (this.currentIndex + 1) % this.framesCount);
          this.resetMask();
          this.compAlpha = 1;
          this.renderCompositeToMain(canvas);
        });
    };
    window.addEventListener('resize', onResize);
    this.removeResize = () => window.removeEventListener('resize', onResize);
  }

  /** один полный проход сверху-вниз, с overscan и плотным шагом; маска пополняется белым */
  private buildScratchTimeline(main: HTMLCanvasElement, duration: number) {
    const { W, H, dpr } = this.metrics;
    const tl = gsap.timeline({ defaults: { ease: 'none' } });

    // параметры «монетки»
    const stroke = Math.max(2, Math.round(90 * dpr));   // диаметр
    const jitter = Math.round(8 * dpr);
    const waveAmp = Math.round(24 * dpr);
    const wavesPerRow = 2.0;

    // ПЛОТНО: < 0.5 шага, чтобы не оставалось зазубрин
    const rowStep = Math.max(2, Math.floor(stroke * 0.45));

    // OVERSCAN по вертикали: начинаем выше и заканчиваем ниже, чтобы кромки не оставались
    const overscan = Math.ceil(stroke); // 1× диаметр
    const startY = -overscan + stroke / 2;
    const endY = H + overscan - stroke / 2;

    // число рядов учитывает overscan, чтобы покрыть и «выше», и «ниже» реальной области
    const rows = Math.max(1, Math.ceil((endY - startY) / rowStep));
    const perRow = duration / rows;

    const mctx = this.off.mask.getContext('2d')!;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
    mctx.lineWidth = stroke;
    mctx.strokeStyle = '#fff';

    for (let r = 0; r < rows; r++) {
      const baseY = Math.min(startY + r * rowStep, endY);
      const leftToRight = r % 2 === 0;
      const prog = { t: 0 };

      tl.to(prog, {
        t: 1,
        duration: perRow,
        onUpdate: () => {
          const prev = Math.max(0, prog.t - 1 / (60 * perRow));
          const steps = 3;
          const dt = (prog.t - prev) / steps;

          mctx.globalCompositeOperation = 'source-over'; // белым ДОБАВЛЯЕМ в маску
          for (let s = 0; s < steps; s++) {
            const a = prev + dt * s;
            const b = prev + dt * (s + 1);
            const p0 = this.pointOnRow(a, leftToRight, baseY, W, waveAmp, wavesPerRow);
            const p1 = this.pointOnRow(b, leftToRight, baseY, W, waveAmp, wavesPerRow);
            mctx.beginPath();
            mctx.moveTo(p0.x + this.j(jitter), p0.y + this.j(jitter));
            mctx.lineTo(p1.x + this.j(jitter), p1.y + this.j(jitter));
            mctx.stroke();
          }

          this.renderCompositeToMain(main);
        }
      });
    }

    // финал: белым залили всю маску (с overscan), затем короткий fade композита
    tl.call(() => {
      mctx.globalCompositeOperation = 'source-over';
      mctx.fillStyle = '#fff';
      // заливаем с overscan, чтобы точно не осталось пикселей по краям
      mctx.fillRect(-overscan, -overscan, W + overscan * 2, H + overscan * 2);
      this.renderCompositeToMain(main);
    });

    tl.call(() => { this.compAlpha = 1; });
    tl.to(this, {
      compAlpha: 0,
      duration: 0.15,
      ease: 'power2.out',
      onUpdate: () => this.renderCompositeToMain(main),
      onComplete: () => { this.compAlpha = 1; }
    });

    return tl;
  }

  // ---------- композитинг ----------
  private async drawSceneTo(ctx: CanvasRenderingContext2D, sceneIndex: number) {
    const { W, H, colWidths } = this.metrics;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);

    let dx = 0;
    for (let c = 0; c < this.cols.length; c++) {
      const imgEl = this.colImgs[c][sceneIndex];
      const src = imgEl.getAttribute('src')!;
      const image = await this.loadImage(src);
      const w = colWidths[c];
      ctx.drawImage(image, dx, 0, w, H);
      dx += w;
    }
  }

  /** маска в начале — полностью ПРОЗРАЧНАЯ */
  private resetMask() {
    const { W, H } = this.metrics;
    const mctx = this.off.mask.getContext('2d')!;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'source-over';
    mctx.clearRect(-W, -H, W * 3, H * 3);
  }

  /** main = next + (current ⨂ (1 - mask)), comp рендерится с альфой для мягкого финиша */
  private renderCompositeToMain(main: HTMLCanvasElement) {
    const { W, H } = this.metrics;
    const comp = this.off.comp.getContext('2d')!;
    const mctx = this.off.mask.getContext('2d')!;
    const mainCtx = main.getContext('2d')!;

    comp.setTransform(1, 0, 0, 1, 0, 0);
    comp.globalCompositeOperation = 'source-over';
    comp.clearRect(0, 0, W, H);
    comp.drawImage(this.off.current, 0, 0);
    comp.globalCompositeOperation = 'destination-out';
    comp.drawImage(mctx.canvas, 0, 0);

    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.clearRect(0, 0, W, H);
    mainCtx.drawImage(this.off.next, 0, 0);

    mainCtx.save();
    mainCtx.globalAlpha = this.compAlpha;
    mainCtx.drawImage(this.off.comp, 0, 0);
    mainCtx.restore();
  }

  // ---------- геометрия / ресайз ----------
  private placeCanvasOverStage(
    banner: HTMLElement, canvas: HTMLCanvasElement, cols: HTMLElement[]
  ) {
    const hostRect = banner.getBoundingClientRect();
    const rects = cols.map(c => c.getBoundingClientRect());
    const left = Math.min(...rects.map(r => r.left)) - hostRect.left;
    const right = Math.max(...rects.map(r => r.right)) - hostRect.left;
    const top = Math.min(...rects.map(r => r.top)) - hostRect.top;
    const bottom = Math.max(...rects.map(r => r.bottom)) - hostRect.top;

    Object.assign(canvas.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '10'
    });

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const W = Math.max(1, Math.round((right - left) * dpr));
    const H = Math.max(1, Math.round((bottom - top) * dpr));
    canvas.width = W;
    canvas.height = H;

    const colWidthsCss = cols.map(c => c.offsetWidth);
    const colWidths = colWidthsCss.map(w => Math.max(1, Math.round(w * dpr)));
    return { dpr, W, H, colWidths };
  }

  private resizeOffscreens() {
    const { W, H } = this.metrics;
    this.off.current.width = W; this.off.current.height = H;
    this.off.next.width = W;    this.off.next.height = H;
    this.off.mask.width = W;    this.off.mask.height = H;
    this.off.comp.width = W;    this.off.comp.height = H;
  }

  // ---------- утилиты ----------
  private pointOnRow(
    t: number, ltr: boolean, baseY: number, W: number, amp: number, waves: number
  ) {
    t = Math.max(0, Math.min(1, t));
    const x = ltr ? t * W : (1 - t) * W;
    const y = baseY + Math.sin(t * Math.PI * 2 * waves + (ltr ? 0 : Math.PI / 3)) * amp;
    return { x, y };
  }
  private j(k: number) { return (Math.random() * 2 - 1) * k; }

  private loadImage(src: string) {
    const cached = this.cache.get(src);
    if (cached && cached.complete) return Promise.resolve(cached);
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => { this.cache.set(src, im); resolve(im); };
      im.onerror = reject;
      im.src = src;
    });
  }
}
