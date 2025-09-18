import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-sign-in',
  imports: [FloatLabel, ReactiveFormsModule, InputText, ButtonDirective],
  templateUrl: './sign-in.html',
})
export class SignIn {
  signInForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  login() {
    //
    console.log('Logging in');
  }
}
