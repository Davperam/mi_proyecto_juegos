import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonLabel, IonInput, IonBadge, IonGrid, IonRow, IonCol, IonList
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-alumno',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar,
    IonTitle, IonButtons, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput,
    IonBadge, IonGrid, IonRow, IonCol, IonList
  ],
  templateUrl: './alumno.page.html'
})
export class AlumnoPage implements OnInit {
  codigoInvitacion = '';
  misGrupos: any[] = [];
  actividades: any[] = [];
  grupoSeleccionadoId: string | null = null;

  private apiUrl = 'http://localhost:3000/api/alumno';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.obtenerMisGrupos();
  }

  obtenerMisGrupos() {
    this.http.get<any[]>(`${this.apiUrl}/mis-grupos`).subscribe(data => {
      this.misGrupos = data;
    });
  }

  unirseAGrupo() {
    if (!this.codigoInvitacion) return;

    this.http.post(`${this.apiUrl}/unirse-grupo`, { codigo_invitacion: this.codigoInvitacion }).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.codigoInvitacion = '';
        this.obtenerMisGrupos();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al unirse al grupo');
      }
    });
  }

  cargarActividades(grupoId: string) {
    this.grupoSeleccionadoId = grupoId;
    this.http.get<any[]>(`${this.apiUrl}/actividades/${grupoId}`).subscribe(data => {
      this.actividades = data;
    });
  }

  iniciarJuego(actividadId: string, event?: Event) {
    // 1. Quitar el foco del botón presionado para evitar el warning de aria-hidden
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Navegar a la pantalla del videojuego Word Connect
    this.router.navigate(['/juego'], { queryParams: { id: actividadId } });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}