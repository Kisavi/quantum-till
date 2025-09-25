import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ButtonDirective } from "primeng/button";

@Component({
  selector: 'app-dashboard',
  imports: [ButtonDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  auth = inject(Auth);
  router = inject(Router);

  logout() {
    this.auth.signOut().then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
