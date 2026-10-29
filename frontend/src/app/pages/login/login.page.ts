import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonItem, IonInput, IonSelect, 
  IonSelectOption, IonButton 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonItem, 
    IonInput, 
    IonSelect, 
    IonSelectOption, 
    IonButton
  ],
  templateUrl: './login.page.html'
})
export class LoginPage {
  email = '';
  password = '';
  rolSelected = 'maestro';

  constructor(private router: Router) {}

  iniciarSesion() {
    if (this.rolSelected === 'maestro') {
      this.router.navigate(['/maestro']);
    } else {
      this.router.navigate(['/alumno']);
    }
  }
}