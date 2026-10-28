import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string;
  codigo_invitacion: string;
  total_alumnos?: number;
}

export interface Palabra {
  palabra: string;
  pista_concepto: string;
  puntos: number;
}

export interface Actividad {
  id: string;
  grupo_id: string;
  titulo: string;
  instrucciones: string;
  palabras: Palabra[];
}

export interface Resultado {
  alumno_nombre: string;
  actividad: string;
  puntaje_total: number;
  palabras_encontradas: number;
  tiempo_segundos: number;
  completado: boolean;
  fecha_jugado: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  // DATOS ESTÁTICOS DE PRUEBA
  private grupos: Grupo[] = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      nombre: 'Biología - 3º A',
      descripcion: 'Grupo de reforzamiento en biología celular y ecosistemas',
      codigo_invitacion: 'BIO-3A99',
      total_alumnos: 3
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      nombre: 'Español - 1º B',
      descripcion: 'Ortografía y categorías gramaticales',
      codigo_invitacion: 'ESP-1B42',
      total_alumnos: 2
    }
  ];

  private actividades: Actividad[] = [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      grupo_id: 'c1111111-1111-1111-1111-111111111111',
      titulo: 'El Sistema Solar y la Tierra',
      instrucciones: 'Conecta las letras para descubrir los cuerpos celestes',
      palabras: [
        { palabra: 'PLANETA', pista_concepto: 'Cuerpo celeste denso que gira alrededor de una estrella', puntos: 10 },
        { palabra: 'SOL', pista_concepto: 'Estrella central de nuestro sistema planetario', puntos: 10 },
        { palabra: 'ORBITA', pista_concepto: 'Trayectoria curva que describe un planeta', puntos: 10 }
      ]
    }
  ];

  private resultados: Resultado[] = [
    {
      alumno_nombre: 'Sofía López',
      actividad: 'El Sistema Solar y la Tierra',
      puntaje_total: 30,
      palabras_encontradas: 3,
      tiempo_segundos: 85,
      completado: true,
      fecha_jugado: '2026-10-18'
    }
  ];

  constructor() {}

  // MÉTODOS SIMULADOS (MOCK API)

  getGruposMaestro(): Observable<Grupo[]> {
    return of(this.grupos);
  }

  crearGrupo(nombre: string, descripcion: string): Observable<{ message: string, codigo: string }> {
    const codigo = 'BIO-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const nuevoGrupo: Grupo = {
      id: 'g-' + Date.now(),
      nombre,
      descripcion,
      codigo_invitacion: codigo,
      total_alumnos: 0
    };
    this.grupos.push(nuevoGrupo);
    return of({ message: 'Grupo creado exitosamente', codigo });
  }

  unirseAGrupo(codigo: string): Observable<{ message: string, grupo?: Grupo }> {
    const grupo = this.grupos.find(g => g.codigo_invitacion === codigo.trim().toUpperCase());
    if (grupo) {
      return of({ message: `¡Te has unido con éxito al grupo ${grupo.nombre}!`, grupo });
    }
    throw new Error('Código de invitación no válido');
  }

  getActividadesPorGrupo(grupoId: string): Observable<Actividad[]> {
    const filtradas = this.actividades.filter(a => a.grupo_id === grupoId);
    return of(filtradas);
  }

  getActividadPorId(actividadId: string): Observable<Actividad> {
    const act = this.actividades.find(a => a.id === actividadId) || this.actividades[0];
    return of(act);
  }

  guardarResultado(resultado: Resultado): Observable<{ message: string }> {
    this.resultados.push(resultado);
    return of({ message: 'Resultado guardado en memoria local' });
  }

  getAnalitica(grupoId: string): Observable<Resultado[]> {
    return of(this.resultados);
  }
}