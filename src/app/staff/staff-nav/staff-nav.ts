import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-staff-nav',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './staff-nav.html',
  styleUrl: './staff-nav.css',
})
export class StaffNav {}
