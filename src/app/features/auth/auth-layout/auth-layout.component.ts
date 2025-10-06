import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Card],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {}
