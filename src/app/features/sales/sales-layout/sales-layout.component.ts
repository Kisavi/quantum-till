import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-sales-layout',
  imports: [TabsModule, RouterOutlet],
  templateUrl: './sales-layout.component.html',
})
export class SalesLayoutComponent {}
