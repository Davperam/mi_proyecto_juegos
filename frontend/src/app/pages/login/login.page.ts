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

  constructor(private router: Router) { }

  iniciarSesion(event?: Event) {
    // 1. Remover el foco activo del botón para evitar el bloqueo aria-hidden
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Redirigir según el rol seleccionado
    if (this.rolSelected === 'maestro') {
      this.router.navigate(['/maestro']);
    } else {
      this.router.navigate(['/alumno']);
    }
  }
}