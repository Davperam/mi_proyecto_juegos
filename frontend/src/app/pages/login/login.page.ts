import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonItem, IonLabel, IonInput, 
  IonButton, IonSelect, IonSelectOption 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, 
    IonInput, IonButton, IonSelect, IonSelectOption
  ],
  templateUrl: './login.page.html'
})
export class LoginPage {
  email = '';
  password = '';
  rol = 'maestro';

  constructor(private router: Router) {}

  iniciarSesion() {
    if (this.rol === 'maestro') {
      this.router.navigate(['/maestro']);
    } else {
      this.router.navigate(['/alumno']);
    }
  }
}