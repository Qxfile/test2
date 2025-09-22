import {AfterViewInit, Component} from '@angular/core';
import {gsap} from "gsap";

@Component({
  selector: 'app-banner-page',
  imports: [],
  standalone: true,
  templateUrl: './banner-page.html',
  styleUrl: './banner-page.scss'
})
export class BannerPage implements AfterViewInit {
  private tl!: gsap.core.Timeline;


  ngAfterViewInit() {
      this.tl = gsap.timeline({ repeat: -1 });

      // Анимация перелистывания
      this.tl.to('.page1', {
        rotateY: -180,
        duration: 1.2,
        ease: 'power2.inOut',
        delay: 1.5
      })
        .set('.page1', { zIndex: 1 }) // после поворота отправляем страницу вниз
        .to('.page2', {
          rotateY: -180,
          duration: 1.2,
          ease: 'power2.inOut',
          delay: 1.5
        })
        .set('.page2', { zIndex: 0 })
        .to('.page3', {
          rotateY: -180,
          duration: 1.2,
          ease: 'power2.inOut',
          delay: 1.5
        })
        .set('.page3', { zIndex: -1 });
    }

}
