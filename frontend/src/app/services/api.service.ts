import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Grupo {
  id: string;
  maestro_id: string;
  nombre: string;
  descripcion: string;
  codigo_invitacion: string;
  activo: boolean | number;
  created_at: string;
  total_alumnos?: number;
}

export interface Actividad {
  id?: string;
  grupo_id: string;
  titulo: string;
  instrucciones: string;
}

export interface Palabra {
  palabra: string;
  pista: string;          // <--- Nombre coincidente con tu HTML (p.pista)
  pista_concepto?: string;
  puntos: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getGruposMaestro(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/maestro/grupos`);
  }

  crearGrupo(nombre: string, descripcion: string): Observable<{ message: string, codigo: string }> {
    return this.http.post<{ message: string, codigo: string }>(`${this.apiUrl}/maestro/grupos`, {
      nombre,
      descripcion
    });
  }

  // MÉTODO QUE FALTABA EN EL SERVICIO
  crearActividad(grupo_id: string, titulo: string, instrucciones: string, palabras: Palabra[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/maestro/actividades`, {
      grupo_id,
      titulo,
      instrucciones,
      palabras
    });
  }

  getAnalitica(grupoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/maestro/analitica/${grupoId}`);
  }

  getActividadJuego(actividadId: string): Observable<{ actividad: Actividad, palabras: Palabra[] }> {
    return this.http.get<{ actividad: Actividad, palabras: Palabra[] }>(`${this.apiUrl}/juego/actividad/${actividadId}`);
  }

  guardarResultadoJuego(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/juego/guardar-resultado`, datos);
  }
}