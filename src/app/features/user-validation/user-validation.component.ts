import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { DocumentData } from '@angular/fire/compat/firestore';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../../core/models/user';
import { Button } from 'primeng/button';
import { UserService } from '../../core/services/user.service';

/**
 * Validates a user's eligibility to use the system. Used instead of a Guard to save on document reads.
 * TODO: Consider replacing this with a guard
 */
@Component({
  selector: 'app-user-validation',
  imports: [AsyncPipe, Button],
  templateUrl: './user-validation.component.html',
})
export class UserValidationComponent implements OnInit {
  private auth = inject(Auth);
  firestore = inject(Firestore);
  router = inject(Router);
  private userService = inject(UserService);

  currentUser$?: Observable<User | DocumentData | undefined>;

  ngOnInit(): void {
    this.currentUser$ = this.userService.getCurrentUser().pipe(
      tap((user) => {
        if ((user as User)?.valid) {
          this.router.navigate(['/dashboard']);
        }
      }),
    );
  }

  signOut(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
