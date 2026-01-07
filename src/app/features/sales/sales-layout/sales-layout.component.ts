import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-sales-layout',
  imports: [TabsModule, RouterOutlet, RouterLink],
  templateUrl: './sales-layout.component.html',
})
export class SalesLayoutComponent implements OnInit {
  tripId?: string;
  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    this.tripId = this.route.snapshot.queryParams['tripId'];
    console.log(this.tripId);
  }
}
