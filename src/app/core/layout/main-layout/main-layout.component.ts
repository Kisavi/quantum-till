import { Component } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { RouterOutlet } from '@angular/router';
import { BottomMenuComponent } from '../bottom-menu/bottom-menu.component';

@Component({
  selector: 'app-main-layout',
  imports: [TopBarComponent, SideMenuComponent, RouterOutlet, BottomMenuComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {}
