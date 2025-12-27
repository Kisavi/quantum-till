import { Component, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register',
  imports: [InputText, ReactiveFormsModule, FloatLabel, ButtonDirective, RouterLink, Message],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  errorMessage?: string | null;
  loading = false;

  registerForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    confirmPassword: new FormControl(),
    displayName: new FormControl(),
  });

  async register() {
    this.loading = true;
    this.errorMessage = null;
    const { email, password, displayName } = this.registerForm.value;

    try {
      await this.userService.createUser(email, password, displayName);
      this.router.navigate(['/user-validation']);
    } catch (e) {
      this.loading = false;
      const error = e as FirebaseError;
      this.errorMessage = error.message;
    }
  }
}
