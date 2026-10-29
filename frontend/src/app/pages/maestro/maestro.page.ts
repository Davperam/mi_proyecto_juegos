import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, 
  IonItem, IonLabel, IonInput, IonList, IonButtons, IonBadge, 
  IonSelect, IonSelectOption, IonTextarea, IonCol, IonRow,
  IonSegment, IonSegmentButton, IonGrid // <--- Componentes agregados
} from '@ionic/angular/standalone';
import { ApiService, Grupo, Palabra } from '../../services/api.service';

@Component({
  selector: 'app-maestro',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, 
    IonToolbar, IonTitle, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, IonItem, 
    IonLabel, IonInput, IonList, IonButtons, IonBadge, 
    IonSelect, IonSelectOption, IonTextarea, IonCol, IonRow,
    IonSegment, IonSegmentButton, IonGrid // <--- Registrados para el template HTML
  ],
  templateUrl: './maestro.page.html'
})
export class MaestroPage implements OnInit {
  grupos: Grupo[] = [];

  nuevoGrupo = {
    nombre: '',
    descripcion: ''
  };

  pestana: string = 'grupos';
  reporte: any[] = [];

  nuevaActividad = {
    grupo_id: '',
    titulo: '',
    instrucciones: '',
    palabras: [
      { palabra: '', pista: '', puntos: 10 }
    ] as Palabra[]
  };

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarGrupos();
  }

  cargarGrupos() {
    this.apiService.getGruposMaestro().subscribe({
      next: (data) => { this.grupos = data; },
      error: (err) => console.error('Error cargando grupos:', err)
    });
  }

  crearGrupo() {
    if (!this.nuevoGrupo.nombre.trim()) return;

    this.apiService.crearGrupo(this.nuevoGrupo.nombre, this.nuevoGrupo.descripcion).subscribe({
      next: (res) => {
        alert(`¡Grupo creado! Código: ${res.codigo}`);
        this.nuevoGrupo = { nombre: '', descripcion: '' };
        this.cargarGrupos();
      },
      error: (err) => console.error('Error al crear grupo:', err)
    });
  }

  agregarCampoPalabra() {
    this.nuevaActividad.palabras.push({ palabra: '', pista: '', puntos: 10 });
  }

  guardarActividad() {
    if (!this.nuevaActividad.grupo_id || !this.nuevaActividad.titulo) {
      alert('Por favor selecciona un grupo e ingresa un título');
      return;
    }

    this.apiService.crearActividad(
      this.nuevaActividad.grupo_id,
      this.nuevaActividad.titulo,
      this.nuevaActividad.instrucciones,
      this.nuevaActividad.palabras
    ).subscribe({
      next: (res) => {
        alert('¡Nivel de juego guardado exitosamente!');
        this.nuevaActividad = {
          grupo_id: '',
          titulo: '',
          instrucciones: '',
          palabras: [{ palabra: '', pista: '', puntos: 10 }]
        };
      },
      error: (err) => console.error('Error guardando la actividad:', err)
    });
  }

  cargarAnalitica(event: any) {
    const grupoId = event.target.value;
    if (!grupoId) return;

    this.apiService.getAnalitica(grupoId).subscribe({
      next: (data) => {
        this.reporte = data;
      },
      error: (err) => console.error('Error cargando analítica:', err)
    });
  }

  // MÉTODO AGREGADO PARA CERRAR SESIÓN
  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}