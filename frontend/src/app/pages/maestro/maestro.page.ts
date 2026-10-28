import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonLabel, IonInput, IonTextarea, IonBadge, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-maestro',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonButton, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, 
    IonTextarea, IonBadge, IonGrid, IonRow, IonCol,
    IonSegment, IonSegmentButton
  ],
  templateUrl: './maestro.page.html'
})
export class MaestroPage implements OnInit {
  pestana = 'grupos';
  grupos: any[] = [];
  reporte: any[] = [];

  nuevoGrupo = { nombre: '', descripcion: '' };
  nuevaActividad = {
    grupo_id: '',
    titulo: '',
    instrucciones: '',
    palabras: [{ palabra: '', pista: '' }]
  };

  private apiUrl = 'http://localhost:3000/api/maestro';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.obtenerGrupos();
  }

  obtenerGrupos() {
    this.http.get<any[]>(`${this.apiUrl}/grupos`).subscribe(data => {
      this.grupos = data;
    });
  }

  crearGrupo() {
    if (!this.nuevoGrupo.nombre) return;
    this.http.post(`${this.apiUrl}/grupos`, this.nuevoGrupo).subscribe(() => {
      this.nuevoGrupo = { nombre: '', descripcion: '' };
      this.obtenerGrupos();
    });
  }

  agregarCampoPalabra() {
    this.nuevaActividad.palabras.push({ palabra: '', pista: '' });
  }

  guardarActividad() {
    if (!this.nuevaActividad.grupo_id || !this.nuevaActividad.titulo) return;
    this.http.post(`${this.apiUrl}/actividades`, this.nuevaActividad).subscribe(() => {
      alert('¡Nivel del juego creado exitosamente!');
      this.nuevaActividad = {
        grupo_id: '',
        titulo: '',
        instrucciones: '',
        palabras: [{ palabra: '', pista: '' }]
      };
    });
  }

  cargarAnalitica(event: any) {
    const grupoId = event.target.value;
    if (!grupoId) return;
    this.http.get<any[]>(`${this.apiUrl}/analitica/${grupoId}`).subscribe(data => {
      this.reporte = data;
    });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}