import {AfterViewInit, Component} from '@angular/core';

import {gsap} from "gsap";

@Component({
  selector: 'app-banner-cube',
  imports: [],
  standalone: true,
  templateUrl: './banner-cube.html',
  styleUrl: './banner-cube.scss'
})
export class BannerCube implements AfterViewInit {

@Component({
  selector: 'app-banner',
  imports: [],
  templateUrl: './banner.html',
  standalone: true,
  styleUrl: './banner.scss'
})
  private timelines: gsap.core.Timeline[] = [];

  ngAfterViewInit() {
    const fadeDuration = 1.0; // длительность перехода
    const pause = 3.0;        // пауза между сменами
    const waveDelay = 0.4;    // задержка между колонками

    const cols = Array.from(document.querySelectorAll<HTMLElement>('.banner .images'));

    cols.forEach((col, colIndex) => {
      const imgs = Array.from(col.querySelectorAll<HTMLImageElement>('img'));
      if (imgs.length === 0) return;

      // 👉 Сначала скрываем всё

      const tl = gsap.timeline({repeat: -1, delay: colIndex * waveDelay});

      imgs.forEach((img, i) => {
        const next = imgs[(i + 1) % imgs.length];

        // ⚡ добавляем паузу (чтобы картинка постояла перед сменой)
        tl.to({}, {duration: pause});

        // 👉 пропускаем первую картинку при запуске
        if (i === 0) return;

        // прячем текущую
        tl.to(img, {
          opacity: 1,
          scale: 1.1,
          duration: fadeDuration,
          ease: "power2.inOut"
        });

        // показываем следующую
        tl.fromTo(next,
          {opacity: 1, scale: 1.1},
          {opacity: 1, scale: 1, duration: fadeDuration, ease: "power2.inOut"},
          "<"
        );
      });

      this.timelines.push(tl);
    });
  }

}
