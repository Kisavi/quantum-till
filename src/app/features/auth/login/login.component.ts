import { Component, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-login',
  imports: [InputText, ReactiveFormsModule, FloatLabel, ButtonDirective, RouterLink, Message],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  errorMessage?: string | null;

  loginForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  async login() {
    this.errorMessage = null;
    const { email, password } = this.loginForm.value;

    if (!email || !password) {
      this.errorMessage = 'Email and password are required';
      return;
    }

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/invalid-credential') {
        this.errorMessage = 'Invalid email or password!';
        return;
      }

      this.errorMessage = 'An unexpected error occured!';
    }
  }
}
