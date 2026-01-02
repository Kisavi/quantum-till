import { Component, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-access-denied',
  imports: [ButtonDirective],
  templateUrl: './access-denied.component.html',
})
export class AccessDeniedComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  signOut(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
