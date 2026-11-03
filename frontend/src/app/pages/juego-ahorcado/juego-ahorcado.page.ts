import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons
} from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-juego-ahorcado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader,
    IonToolbar, IonTitle, IonButton, IonButtons
  ],
  templateUrl: './juego-ahorcado.page.html',
  styleUrls: ['./juego-ahorcado.page.scss']
})
export class JuegoAhorcadoPage implements OnInit {
  actividadId: string = '';
  listaPalabras: any[] = [];
  indicePalabraActual: number = 0;

  palabraActual: any = null;
  palabraOculta: string[] = [];

  maxIntentos: number = 6;
  intentosFallidos: number = 0;
  abecedario: string[] = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  letrasUsadas: Set<string> = new Set<string>();

  tiempoSegundos: number = 0;
  tiempoFormateado: string = '00:00';
  puntajeTotal: number = 0;
  palabrasAdivinadas: number = 0;
  intervaloTiempo: any;
  juegoTerminado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.actividadId = this.route.snapshot.queryParamMap.get('id') || '';
    if (this.actividadId) {
      this.cargarActividad();
    }
  }

  cargarActividad() {
    this.apiService.getActividadJuego(this.actividadId).subscribe({
      next: (res: any) => {
        this.listaPalabras = res.palabras;
        if (this.listaPalabras.length > 0) {
          this.prepararPalabra(0);
          this.iniciarTemporizador();
        }
      },
      error: (err) => console.error('Error cargando actividad de Ahorcado:', err)
    });
  }

  prepararPalabra(index: number) {
    this.indicePalabraActual = index;
    this.palabraActual = this.listaPalabras[index];
    this.letrasUsadas.clear();
    this.intentosFallidos = 0;

    // Generar guiones bajos para cada letra
    this.palabraOculta = this.palabraActual.palabra.split('').map(() => '_');
  }

  iniciarTemporizador() {
    this.intervaloTiempo = setInterval(() => {
      this.tiempoSegundos++;
      const min = Math.floor(this.tiempoSegundos / 60).toString().padStart(2, '0');
      const sec = (this.tiempoSegundos % 60).toString().padStart(2, '0');
      this.tiempoFormateado = `${min}:${sec}`;
    }, 1000);
  }

  presionarLetra(letra: string) {
    if (this.letrasUsadas.has(letra) || this.juegoTerminado) return;

    this.letrasUsadas.add(letra);
    const palabraObjetivo = this.palabraActual.palabra.toUpperCase();

    if (palabraObjetivo.includes(letra)) {
      // Revelar letra en las casillas
      palabraObjetivo.split('').forEach((char: string, idx: number) => {
        if (char === letra) {
          this.palabraOculta[idx] = letra;
        }
      });

      // Verificar si completó la palabra actual
      if (!this.palabraOculta.includes('_')) {
        this.puntajeTotal += this.palabraActual.puntos || 15;
        this.palabrasAdivinadas++;
        this.siguientePalabra();
      }
    } else {
      // Incrementar intentos fallidos
      this.intentosFallidos++;
      if (this.intentosFallidos >= this.maxIntentos) {
        alert(`¡Agotaste tus intentos para la palabra "${palabraObjetivo}"!`);
        this.siguientePalabra();
      }
    }
  }

  siguientePalabra() {
    if (this.indicePalabraActual + 1 < this.listaPalabras.length) {
      this.prepararPalabra(this.indicePalabraActual + 1);
    } else {
      this.finalizarJuego();
    }
  }

  finalizarJuego() {
    this.juegoTerminado = true;
    clearInterval(this.intervaloTiempo);

    this.apiService.guardarResultadoJuego({
      actividad_id: this.actividadId,
      puntaje_total: this.puntajeTotal,
      palabras_encontradas: this.palabrasAdivinadas,
      tiempo_segundos: this.tiempoSegundos,
      completado: true
    }).subscribe({
      next: () => alert(`¡Juego completado! Obtuviste ${this.puntajeTotal} pts y adivinaste ${this.palabrasAdivinadas} palabras.`),
      error: (err) => console.error('Error guardando resultados:', err)
    });
  }

  regresar(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    clearInterval(this.intervaloTiempo);
    this.router.navigate(['/alumno']);
  }
}