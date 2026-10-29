import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, 
  IonItem, IonLabel, IonInput, IonList, IonButtons, IonBadge, 
  IonSelect, IonSelectOption, IonTextarea, IonCol, IonRow,
  IonSegment, IonSegmentButton, IonGrid 
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
    IonSegment, IonSegmentButton, IonGrid
  ],
  templateUrl: './maestro.page.html'
})
export class MaestroPage implements OnInit {
  grupos: Grupo[] = [];
  reporte: any[] = [];
  pestana: string = 'crear_actividad';

  nuevoGrupo = {
    nombre: '',
    descripcion: ''
  };

  // 1. AÑADIDO 'tipo_juego' PARA CORREGIR TS2339 EN LA LÍNEA 124
  nuevaActividad = {
    grupo_id: '',
    titulo: '',
    instrucciones: '',
    tipo_juego: 'WORD_CONNECT', // <--- Propiedad agregada
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

  // 2. PARÁMETRO OPCIONAL event?: Event PARA CORREGIR TS2554 EN LÍNEA 63
  crearGrupo(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    
    if (!this.nuevoGrupo.nombre) {
      alert('Debes ingresar un nombre para el grupo');
      return;
    }

    this.apiService.crearGrupo(this.nuevoGrupo.nombre, this.nuevoGrupo.descripcion).subscribe({
      next: () => {
        alert('¡Grupo creado exitosamente!');
        this.nuevoGrupo = { nombre: '', descripcion: '' };
        this.cargarGrupos();
      },
      error: (err) => console.error('Error al crear grupo:', err)
    });
  }

  // 3. PARÁMETRO OPCIONAL event?: Event EN LÍNEA 180
  agregarCampoPalabra(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    this.nuevaActividad.palabras.push({ palabra: '', pista: '', puntos: 10 });
  }

  // 4. PARÁMETRO OPCIONAL event?: Event EN LÍNEA 184
  guardarActividad(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }

    if (!this.nuevaActividad.grupo_id || !this.nuevaActividad.titulo) {
      alert('Por favor selecciona un grupo e ingresa un título');
      return;
    }

    // 5. ENVIAR LOS 5 PARÁMETROS REQUERIDOS POR EL API SERVICE (INCLUYENDO TIPO_JUEGO)
    this.apiService.crearActividad(
      this.nuevaActividad.grupo_id,
      this.nuevaActividad.titulo,
      this.nuevaActividad.instrucciones,
      this.nuevaActividad.tipo_juego, // <--- 5to argumento enviado
      this.nuevaActividad.palabras
    ).subscribe({
      next: () => {
        alert('¡Nivel de juego guardado exitosamente!');
        this.nuevaActividad = {
          grupo_id: '',
          titulo: '',
          instrucciones: '',
          tipo_juego: 'WORD_CONNECT',
          palabras: [{ palabra: '', pista: '', puntos: 10 }]
        };
      },
      error: (err) => console.error('Error guardando la actividad:', err)
    });
  }

  cargarAnalitica(event: any) {
    const grupoId = event.detail.value;
    if (grupoId) {
      this.apiService.getReporteGrupo(grupoId).subscribe({
        next: (data) => { this.reporte = data; },
        error: (err) => console.error('Error cargando analítica:', err)
      });
    }
  }

  cerrarSesion(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    this.router.navigate(['/login']);
  }
}