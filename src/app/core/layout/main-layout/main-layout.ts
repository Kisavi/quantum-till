import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenu } from '../side-menu/side-menu';
import { TopBar } from '../top-bar/top-bar';

@Component({
  selector: 'app-main-layout',
  imports: [SideMenu, TopBar, RouterOutlet],
  templateUrl: './main-layout.html',
})
export class MainLayout {}
