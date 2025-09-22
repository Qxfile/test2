import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerBlur } from './banner-blur';

describe('BannerBlur', () => {
  let component: BannerBlur;
  let fixture: ComponentFixture<BannerBlur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerBlur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerBlur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
