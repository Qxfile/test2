import {AfterViewInit, Component} from '@angular/core';

import {gsap} from "gsap";

@Component({
  selector: 'app-banner-blur',
  imports: [],
  standalone: true,
  templateUrl: './banner-blur.html',
  styleUrl: './banner-blur.scss'
})
export class BannerBlur implements AfterViewInit {
  private tl?: gsap.core.Timeline;

  ngAfterViewInit() {
    // на случай повторной инициализации (HMR и т.п.)
    this.tl?.kill();

    setTimeout(() => {
      const fadeDuration = 0.8; // время fade
      const pause = 5.0;        // пауза между сменами сцен
      const initialDelay = 2; // стартовая задержка

      const banner = document.querySelector<HTMLElement>('.banner');
      if (!banner) return;

      const cols = Array.from(banner.querySelectorAll<HTMLElement>('.images'));
      if (!cols.length) return;

      const colImgs = cols.map(col => Array.from(col.querySelectorAll<HTMLImageElement>('img')));
      const framesCount = Math.min(...colImgs.map(arr => arr.length));
      if (framesCount < 2) return;

      let currentIndex = 0;

      // стартовое состояние
      colImgs.forEach(imgs => {
        imgs.forEach((img, i) => {
          gsap.set(img, {
            opacity: i === currentIndex ? 1 : 0,
            filter: i === currentIndex ? 'blur(0px)' : 'blur(10px)'
          });
        });
      });

      const gatherSets = () => {
        const nextIndex = (currentIndex + 1) % framesCount;
        const currentSet: HTMLElement[] = [];
        const nextSet: HTMLElement[] = [];
        colImgs.forEach(imgs => {
          currentSet.push(imgs[currentIndex]);
          nextSet.push(imgs[nextIndex]);
        });
        return { currentSet, nextSet, nextIndex };
      };

      // один шаг смены сцены (не модифицирует таймлайн)
      const step = () => {
        const { currentSet, nextSet, nextIndex } = gatherSets();

        // на всякий случай — чтобы не наслаивались tweens
        gsap.killTweensOf([...currentSet, ...nextSet]);

        // общий кроссфейд всей сцены
        gsap.to(currentSet, {
          opacity: 0,
          filter: 'blur(10px)',
          duration: fadeDuration,
          ease: 'power2.inOut'
        });
        gsap.to(nextSet, {
          opacity: 1,
          filter: 'blur(0px)',
          duration: fadeDuration,
          ease: 'power2.inOut'
        });

        // обновляем индекс ПОСЛЕ фейда, не трогая таймлайн
        gsap.delayedCall(fadeDuration, () => { currentIndex = nextIndex; });
      };

      // мастер-таймлайн, который не мутирует сам себя во время проигрыша
      this.tl = gsap.timeline({ repeat: -1, delay: initialDelay })
        .call(step)                               // запустить шаг
        .to({}, { duration: fadeDuration })       // подождать, пока идёт фейд
        .to({}, { duration: pause });             // пауза перед следующей сменой
    }, 1);
  }
}
