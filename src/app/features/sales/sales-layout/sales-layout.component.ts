import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-sales-layout',
  imports: [TabsModule, RouterOutlet, RouterLink],
  templateUrl: './sales-layout.component.html',
})
export class SalesLayoutComponent {}
