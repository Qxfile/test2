import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerFadeSlide } from './banner-fade-slide';

describe('BannerFadeSlide', () => {
  let component: BannerFadeSlide;
  let fixture: ComponentFixture<BannerFadeSlide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerFadeSlide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerFadeSlide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
