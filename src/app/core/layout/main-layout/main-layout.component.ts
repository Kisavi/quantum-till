import { Component } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [TopBarComponent, SideMenuComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {}
