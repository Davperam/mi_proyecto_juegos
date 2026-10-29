import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, 
  IonItem, IonLabel, IonInput, IonList, IonButtons, IonBadge,
  IonGrid, IonRow, IonCol // <--- Importaciones agregadas para resolver NG8001
} from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alumno',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, 
    IonToolbar, IonTitle, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, IonItem, 
    IonLabel, IonInput, IonList, IonButtons, IonBadge,
    IonGrid, IonRow, IonCol // <--- Añadidos al arreglo de imports
  ],
  templateUrl: './alumno.page.html'
})
export class AlumnoPage implements OnInit {
  codigoInvitacion: string = '';
  
  // Propiedad 'grupos' utilizada para la lista
  grupos: any[] = [];
  actividades: any[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarMisGrupos();
  }

  cargarMisGrupos() {
    this.apiService.getGruposAlumno().subscribe({
      next: (data) => { this.grupos = data; },
      error: (err) => console.error('Error cargando grupos:', err)
    });
  }

  unirseAGrupo(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }

    if (!this.codigoInvitacion) {
      alert('Ingresa un código de invitación');
      return;
    }

    this.apiService.unirseAGrupo(this.codigoInvitacion).subscribe({
      next: () => {
        alert('¡Te has unido al grupo exitosamente!');
        this.codigoInvitacion = '';
        this.cargarMisGrupos();
      },
      error: (err) => console.error('Error uniéndose al grupo:', err)
    });
  }

  cargarActividades(grupoId: string) {
    this.apiService.getActividadesGrupo(grupoId).subscribe({
      next: (data) => {
        this.actividades = data;
      },
      error: (err) => console.error('Error cargando actividades:', err)
    });
  }

  jugarActividad(actividad: any, event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }

    switch (actividad.tipo_juego) {
      case 'MEMORAMA':
        this.router.navigate(['/juego-memorama'], { queryParams: { id: actividad.id } });
        break;
      case 'AHORCADO':
        this.router.navigate(['/juego-ahorcado'], { queryParams: { id: actividad.id } });
        break;
      case 'WORD_CONNECT':
      default:
        this.router.navigate(['/juego'], { queryParams: { id: actividad.id } });
        break;
    }
  }

  cerrarSesion(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    this.router.navigate(['/login']);
  }
}