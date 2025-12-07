import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuLinkItem } from './menu-link-item';

describe('MenuLinkItem', () => {
  let component: MenuLinkItem;
  let fixture: ComponentFixture<MenuLinkItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLinkItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuLinkItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
