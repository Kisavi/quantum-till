import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { User } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';

/**
 * Validates a user's eligibility to use the system. Used instead of a Guard to save on document reads.
 * TODO: Consider replacing this with a guard
 */
@Component({
  selector: 'app-user-validation',
  imports: [],
  templateUrl: './user-validation.component.html',
})
export class UserValidationComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.userService
      .getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if ((user as User)?.valid) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/access-denied']);
        }
      });
  }
}
