import { Component, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-register',
  imports: [InputText, ReactiveFormsModule, FloatLabel, ButtonDirective, RouterLink, Message],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  errorMessage?: string | null;

  registerForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    confirmPassword: new FormControl(),
    displayName: new FormControl(),
  });

  async register() {
    this.errorMessage = null;
    const { email, password, displayName } = this.registerForm.value;

    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      // this.auth.updateCurrentUser({ displayName }); // Set user's display name
      this.router.navigate(['/']);
    } catch (e) {
      const error = e as FirebaseError;
      this.errorMessage = error.message;
    }
  }
}
