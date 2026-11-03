import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons
} from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';

interface CartaMemorama {
  id: number;
  texto: string;
  palabraRelacionada: string;
  volteada: boolean;
  emparejada: boolean;
}

@Component({
  selector: 'app-juego-memorama',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader,
    IonToolbar, IonTitle, IonButton, IonButtons
  ],
  templateUrl: './juego-memorama.page.html',
  styleUrls: ['./juego-memorama.page.scss']
})
export class JuegoMemoramaPage implements OnInit {
  actividadId: string = '';
  actividadInfo: any = null;

  cartas: CartaMemorama[] = [];
  cartasSeleccionadas: number[] = [];

  tiempoSegundos: number = 0;
  tiempoFormateado: string = '00:00';
  puntajeTotal: number = 0;
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
        this.actividadInfo = res.actividad;
        this.generarTableroMemorama(res.palabras);
        this.iniciarTemporizador();
      },
      error: (err) => console.error('Error al cargar la actividad de Memorama:', err)
    });
  }

  // En juego-memorama.page.ts

  // En juego-memorama.page.ts

  generarTableroMemorama(palabras: any[]) {
    let idCounter = 1;
    const cartasGeneradas: CartaMemorama[] = [];

    palabras.forEach((p) => {
      // 1. CARTA 1: Muestra la PALABRA CLAVE (Ej: "PLANETA")
      cartasGeneradas.push({
        id: idCounter++,
        texto: p.palabra,
        palabraRelacionada: p.palabra, // Clave común para validar el par
        volteada: false,
        emparejada: false
      });

      // 2. CARTA 2: Muestra la PISTA CONCEPTUAL (Ej: "Cuerpo celeste denso que gira alrededor de una estrella")
      const pistaTexto = p.pista_concepto || p.pista || `Definición de ${p.palabra}`;

      cartasGeneradas.push({
        id: idCounter++,
        texto: pistaTexto,
        palabraRelacionada: p.palabra, // Clave común para validar el par
        volteada: false,
        emparejada: false
      });
    });

    // Barajar el mazo aleatoriamente
    this.cartas = cartasGeneradas.sort(() => Math.random() - 0.5);
  }

  iniciarTemporizador() {
    this.intervaloTiempo = setInterval(() => {
      this.tiempoSegundos++;
      const min = Math.floor(this.tiempoSegundos / 60).toString().padStart(2, '0');
      const sec = (this.tiempoSegundos % 60).toString().padStart(2, '0');
      this.tiempoFormateado = `${min}:${sec}`;
    }, 1000);
  }

  voltearCarta(index: number) {
    const carta = this.cartas[index];

    if (carta.volteada || carta.emparejada || this.cartasSeleccionadas.length === 2 || this.juegoTerminado) {
      return;
    }

    carta.volteada = true;
    this.cartasSeleccionadas.push(index);

    if (this.cartasSeleccionadas.length === 2) {
      this.validarPareja();
    }
  }

  validarPareja() {
    const [i1, i2] = this.cartasSeleccionadas;
    const carta1 = this.cartas[i1];
    const carta2 = this.cartas[i2];

    if (carta1.palabraRelacionada === carta2.palabraRelacionada) {
      // ¡Pareja encontrada!
      carta1.emparejada = true;
      carta2.emparejada = true;
      this.puntajeTotal += 20;
      this.cartasSeleccionadas = [];

      // Verificar si el juego ha terminado
      if (this.cartas.every(c => c.emparejada)) {
        this.finalizarJuego();
      }
    } else {
      // No coinciden: Ocultar de nuevo tras medio segundo
      setTimeout(() => {
        carta1.volteada = false;
        carta2.volteada = false;
        this.cartasSeleccionadas = [];
      }, 700);
    }
  }

  finalizarJuego() {
    this.juegoTerminado = true;
    clearInterval(this.intervaloTiempo);

    const parejasTotales = this.cartas.length / 2;

    this.apiService.guardarResultadoJuego({
      actividad_id: this.actividadId,
      puntaje_total: this.puntajeTotal,
      palabras_encontradas: parejasTotales,
      tiempo_segundos: this.tiempoSegundos,
      completado: true
    }).subscribe({
      next: () => alert(`¡Felicidades! Completaste el Memorama con ${this.puntajeTotal} puntos en ${this.tiempoFormateado}.`),
      error: (err) => console.error('Error al guardar el resultado:', err)
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