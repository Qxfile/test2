import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Banner} from './banner/banner';
import {BannerPage} from './banner-page/banner-page';
import {BannerMoz} from './banner-moz/banner-moz';
import {BannerBlur} from './banner-blur/banner-blur';
import {BannerCube} from './banner-cube/banner-cube';
import {BannerFadeSlide} from './banner-fade-slide/banner-fade-slide';
import {BannerRevolverAsync} from './banner-revolver-async/banner-revolver-async';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner, BannerPage, BannerMoz, BannerBlur, BannerCube, BannerFadeSlide, BannerRevolverAsync],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('gsap-agro');
  activeInx = signal(0)

  onSelectAnimation(idx: number) {
    this.activeInx.set(idx)
  }
}
