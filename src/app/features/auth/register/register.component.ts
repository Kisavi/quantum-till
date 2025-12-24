import { Component, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { updateDoc } from '@angular/fire/firestore';
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
  private auth = inject(Auth);
  private userService = inject(UserService);
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

      if (this.auth.currentUser) {
        // Update user's display name
        await updateProfile(this.auth.currentUser, { displayName });

        const invitation = await this.userService.getInvitation(this.auth.currentUser.email);

        if (invitation) {
          await updateDoc(invitation.ref, { accepted: true }); // Set invitation to accepted

          const invitationData = invitation.data();

          const user = {
            uid: this.auth.currentUser.uid,
            displayName: this.auth.currentUser.displayName,
            email: this.auth.currentUser.email,
            emailVerified: this.auth.currentUser.emailVerified,
            phoneNumber: this.auth.currentUser.phoneNumber,
            photoURL: this.auth.currentUser.photoURL,
            active: true,
            valid: true,
            rating: 0,
            role: invitationData.role,
          };

          await this.userService.createUser(this.auth.currentUser.uid, user); // Create user doc for the new user
        }
      }

      this.router.navigate(['/user-validation']);
    } catch (e) {
      const error = e as FirebaseError;
      this.errorMessage = error.message;
    }
  }
}
