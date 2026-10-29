import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonButtons 
} from '@ionic/angular/standalone';

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
  tiempoFormateado: string = '00:00';
  puntajeTotal: number = 0;

  // PROPIEDADES QUE FALTABAN PARA EL MEMORAMA
  actividadInfo: any = { titulo: 'Conceptos de Biología' };
  cartas: CartaMemorama[] = [
    { id: 1, texto: 'PLANETA', palabraRelacionada: 'PLANETA', volteada: false, emparejada: false },
    { id: 2, texto: 'Cuerpo celeste que gira alrededor del Sol', palabraRelacionada: 'PLANETA', volteada: false, emparejada: false }
  ];

  cartasSeleccionadas: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.actividadId = this.route.snapshot.queryParamMap.get('id') || '';
  }

  voltearCarta(index: number) {
    if (this.cartas[index].volteada || this.cartas[index].emparejada) return;
    this.cartas[index].volteada = true;
  }

  regresar(event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur();
    }
    this.router.navigate(['/alumno']);
  }
}