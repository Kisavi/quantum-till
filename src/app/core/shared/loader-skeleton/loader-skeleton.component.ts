

import { Component, Input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-loader-skeleton',
  imports: [SkeletonModule],
  templateUrl: './loader-skeleton.component.html'
   
  
})
export class LoaderSkeletonComponent {
  @Input() rowHeight: string = '2.5rem';
}

