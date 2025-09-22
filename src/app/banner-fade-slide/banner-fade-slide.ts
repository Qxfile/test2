import {AfterViewInit, Component} from '@angular/core';

import {gsap} from "gsap";

@Component({
  selector: 'app-banner-fade-slide',
  imports: [],
  standalone: true,
  templateUrl: './banner-fade-slide.html',
  styleUrl: './banner-fade-slide.scss'
})
export class BannerFadeSlide implements AfterViewInit {
  private running = true;
  private timeoutId: any = null;
  private activeTween?: gsap.core.Tween;

  ngAfterViewInit() {
    const duration = 3;
    const pause = 2.4;
    const initialDelay = 0.8;

    const banner = document.querySelector<HTMLElement>('.banner')!;
    const current = banner.querySelector<HTMLElement>('.scene.current')!;
    const next = banner.querySelector<HTMLElement>('.scene.next')!;
    const wipe = banner.querySelector<HTMLElement>('.wipe')!;
    const clone = banner.querySelector<HTMLElement>('.wipe .scene.clone')!;

    const frames: string[] = [
      current.innerHTML,
      next.innerHTML
    ];

    gsap.set(current, { opacity: 1, clearProps: 'all' });
    gsap.set(next, { opacity: 1, filter: 'blur(3px)' });
    gsap.set(wipe, { width: '0%' });
    clone.innerHTML = frames[1];

    const runOnce = () => {
      if (!this.running) return;

      gsap.set(wipe, { width: '0%' });
      clone.innerHTML = frames[1];
      gsap.set(clone, { opacity: 0.6, filter: 'blur(3px)' });

      this.activeTween = gsap.to(wipe, {
        width: '100%',
        duration,
        ease: 'power2.inOut',
        onStart: () => {
          gsap.to(clone, { opacity: 1, filter: 'blur(0px)', duration, ease: 'power2.inOut' });
        },
        onComplete: () => {
          if (!this.running) return;

          frames.push(frames.shift()!);
          current.innerHTML = frames[0];
          next.innerHTML = frames[1] || frames[0];

          this.timeoutId = setTimeout(() => {
            runOnce();
          }, pause * 1000);
        }
      });
    };

    this.timeoutId = setTimeout(() => {
      runOnce();
    }, initialDelay * 1000);
  }

}
