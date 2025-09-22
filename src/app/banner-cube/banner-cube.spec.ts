import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerCube } from './banner-cube';

describe('BannerCube', () => {
  let component: BannerCube;
  let fixture: ComponentFixture<BannerCube>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerCube]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerCube);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
