import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonButtons 
} from '@ionic/angular/standalone';

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
  tiempoFormateado: string = '00:00';
  puntajeTotal: number = 0;

  // PROPIEDADES QUE FALTABAN PARA EL AHORCADO
  palabraActual: { palabra: string; pista_concepto: string } | null = {
    palabra: 'PLANETA',
    pista_concepto: 'Cuerpo celeste denso que gira alrededor de una estrella'
  };
  palabraOculta: string[] = ['_', '_', '_', '_', '_', '_', '_'];
  maxIntentos: number = 6;
  intentosFallidos: number = 0;
  abecedario: string[] = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  letrasUsadas: Set<string> = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.actividadId = this.route.snapshot.queryParamMap.get('id') || '';
  }

  presionarLetra(letra: string) {
    this.letrasUsadas.add(letra);
    // Lógica para comprobar si la letra existe en la palabra
    if (this.palabraActual && this.palabraActual.palabra.includes(letra)) {
      this.palabraActual.palabra.split('').forEach((l, index) => {
        if (l === letra) this.palabraOculta[index] = letra;
      });
    } else {
      this.intentosFallidos++;
    }
  }

  regresar(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    this.router.navigate(['/alumno']);
  }
}