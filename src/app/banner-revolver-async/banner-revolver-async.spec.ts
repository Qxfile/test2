import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerRevolverAsync } from './banner-revolver-async';

describe('BannerRevolverAsync', () => {
  let component: BannerRevolverAsync;
  let fixture: ComponentFixture<BannerRevolverAsync>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerRevolverAsync]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerRevolverAsync);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
