import {AfterViewInit, Component} from '@angular/core';
import {gsap} from "gsap";

@Component({
  selector: 'app-banner',
  imports: [],
  templateUrl: './banner.html',
  standalone: true,
  styleUrl: './banner.scss'
})
export class Banner implements AfterViewInit {
  private tl?: gsap.core.Timeline;

  ngAfterViewInit() {
    // на всякий случай, если компонент переинициализируется (HMR/роутер)
    this.tl?.kill();

    setTimeout(() => {
      const cardHeight = 345;   // высота карточки (должна совпадать с CSS)
      const slideDuration = 0.45; // СКОЛЬКО едет вниз (быстрее)
      const sceneHold = 5.0;  // СКОЛЬКО держим всю сцену после слайда (дольше)
      const initialDelay = 2;  // стартовая задержка
      const columnStagger = 0.0;  // если нужно микро-смещение колонок внутри одной сцены (0 — строго вместе)

      const cols = Array.from(document.querySelectorAll<HTMLElement>('.banner .images'));
      if (!cols.length) return;

      // подготовка: оборачиваем карточки в .track (как у тебя)
      const tracks: HTMLElement[] = cols.map(col => {
        const track = document.createElement('div');
        track.className = 'track';
        track.style.display = 'flex';
        track.style.flexDirection = 'column';
        track.style.position = 'relative';
        (track.style as any).willChange = 'transform';

        Array.from(col.children).forEach(child => track.appendChild(child));
        col.appendChild(track);
        // гарантируем начальное положение
        gsap.set(track, {y: 0});
        return track;
      });

      // функция одного «тика» слотов: все колонки едут ВМЕСТЕ
      const slideOnce = () => {
        // на всякий случай уберём возможные висячие твины по трекам
        gsap.killTweensOf(tracks);

        // едем все треки одновременно (или с лёгким stagger, если захочешь)
        gsap.to(tracks, {
          y: -cardHeight,
          duration: slideDuration,
          ease: 'power2.inOut',
          stagger: columnStagger
        });

        // после слайда — переставляем верхний элемент вниз и сбрасываем y
        gsap.delayedCall(slideDuration + (tracks.length - 1) * columnStagger, () => {
          tracks.forEach(track => {
            if (track.children.length > 0) {
              track.appendChild(track.children[0]);
            }
            gsap.set(track, {y: 0});
          });
        });
      };

      // мастер-таймлайн: НЕ мутируем его внутри — только вызываем шаг и ждём
      this.tl = gsap.timeline({repeat: -1, delay: initialDelay})
        .call(slideOnce)                       // быстрый общий слайд
        .to({}, {duration: slideDuration})   // даём ему доехать
        .to({}, {duration: sceneHold});      // держим сцену дольше (паузим все колонки ВМЕСТЕ)
    }, 1);
  }


}
