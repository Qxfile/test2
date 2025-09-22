import {AfterViewInit, Component} from '@angular/core';
import {gsap} from "gsap";

@Component({
  selector: 'app-banner-revolver-async',
  imports: [],
  standalone: true,
  templateUrl: './banner-revolver-async.html',
  styleUrl: './banner-revolver-async.scss'
})
export class BannerRevolverAsync implements AfterViewInit {
  private tl?: gsap.core.Timeline;

  ngAfterViewInit() {
    // если компонент пересоздаётся (HMR/роутер) — гасим прошлый цикл
    this.tl?.kill();

    setTimeout(() => {
      const cardHeight = 345;   // высота карточки (должна совпадать с CSS)
      const slideDuration = 0.45;  // сколько едет ОДНА колонка
      const columnGap = 0.001;  // пауза между окончанием предыдущей и стартом следующей
      const sceneHold = 5.0;   // сколько держим всю сцену после того, как приехала 3-я
      const initialDelay = 0.0;

      const cols = Array.from(document.querySelectorAll<HTMLElement>('.banner .images'));
      if (!cols.length) return;

      // оборачиваем содержимое каждой колонки в .track (как у тебя)
      const tracks: HTMLElement[] = cols.map(col => {
        const track = document.createElement('div');
        track.className = 'track';
        track.style.display = 'flex';
        track.style.flexDirection = 'column';
        track.style.position = 'relative';
        (track.style as any).willChange = 'transform';

        Array.from(col.children).forEach(child => track.appendChild(child));
        col.appendChild(track);
        gsap.set(track, {y: 0});
        return track;
      });

      // анимация одной колонки: сдвиг на -cardHeight и перекидывание верхнего элемента вниз
      const slideOnce = (track: HTMLElement) => {
        gsap.killTweensOf(track);
        gsap.to(track, {
          y: -cardHeight,
          duration: slideDuration,
          ease: 'power2.inOut',
          onComplete: () => {
            if (track.children.length > 0) {
              track.appendChild(track.children[0]);
            }
            gsap.set(track, {y: 0});
          }
        });
      };

      // мастер-таймлайн: идём ПО ОЧЕРЕДИ по колонкам → затем держим сцену
      const buildCycle = () => {
        const tl = gsap.timeline({repeat: -1, delay: initialDelay});

        tracks.forEach((track, i) => {
          tl.call(slideOnce, [track])                                  // запустить колонку i
            .to({}, {duration: slideDuration + (i < tracks.length - 1 ? columnGap : 0)});
          // ждём, пока колонка доедет, + небольшой зазор перед следующей (кроме последней)
        });

        // когда все три «приехали», держим сцену целиком
        tl.to({}, {duration: sceneHold});

        return tl;
      };

      this.tl = buildCycle();
    }, 1);
  }
}
