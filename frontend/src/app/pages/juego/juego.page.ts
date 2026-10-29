import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { ApiService, Actividad, Palabra } from '../../services/api.service';

interface NodoLetra {
  letra: string;
  x: number;
  y: number;
  radio: number;
  indice: number;
}

@Component({
  selector: 'app-juego',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar,
    IonTitle, IonButtons, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent
  ],
  templateUrl: './juego.page.html'
})
export class JuegoPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasJuego') canvasRef!: ElementRef<HTMLCanvasElement>;

  actividadId = '';
  actividadInfo: Actividad | null = null;
  listaPalabras: (Palabra & { adivinada: boolean })[] = [];

  pistaActual = 'Conecta las letras para formar la palabra secreta';
  palabraSeleccionada = '';
  puntajeActual = 0;
  tiempoSegundos = 0;
  tiempoFormateado = '00:00';
  timerInterval: any;
  juegoCompletado = false;

  private ctx!: CanvasRenderingContext2D;
  private nodos: NodoLetra[] = [];
  private caminoSeleccionado: NodoLetra[] = [];
  private isArrastrando = false;
  private posMouse = { x: 0, y: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.actividadId = params['id'] || 'd1111111-1111-1111-1111-111111111111';
      this.cargarActividad();
    });
  }

  ngAfterViewInit() {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.registrarEventosCanvas(canvas);
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  cargarActividad() {
    this.apiService.getActividadJuego(this.actividadId).subscribe({
      next: (res) => {
        if (res && res.palabras && res.palabras.length > 0) {
          this.actividadInfo = res.actividad;
          this.listaPalabras = res.palabras.map(p => ({
            ...p,
            adivinada: false
          }));

          this.pistaActual = this.listaPalabras[0].pista_concepto || 'Conecta las letras para formar la palabra secreta';

          // Generar la rueda y redibujar el canvas
          this.generarRuedaDeLetras();
          this.iniciarCronometro();
        } else {
          console.warn('La actividad no tiene palabras registradas en la base de datos');
        }
      },
      error: (err) => {
        console.error('Error cargando la actividad desde MariaDB:', err);
      }
    });
  }

  iniciarCronometro() {
    this.timerInterval = setInterval(() => {
      if (!this.juegoCompletado) {
        this.tiempoSegundos++;
        const mins = Math.floor(this.tiempoSegundos / 60).toString().padStart(2, '0');
        const secs = (this.tiempoSegundos % 60).toString().padStart(2, '0');
        this.tiempoFormateado = `${mins}:${secs}`;
      }
    }, 1000);
  }

  generarRuedaDeLetras() {
    if (!this.listaPalabras || this.listaPalabras.length === 0) return;

    const maxFrecuencias: { [letra: string]: number } = {};

    for (const item of this.listaPalabras) {
      const palabra = item.palabra.toUpperCase().replace(/\s+/g, '');
      const conteoLocal: { [letra: string]: number } = {};

      for (const letra of palabra) {
        conteoLocal[letra] = (conteoLocal[letra] || 0) + 1;
      }

      for (const letra in conteoLocal) {
        if (!maxFrecuencias[letra] || conteoLocal[letra] > maxFrecuencias[letra]) {
          maxFrecuencias[letra] = conteoLocal[letra];
        }
      }
    }

    const bolsaDeLetras: string[] = [];
    for (const letra in maxFrecuencias) {
      const cantidad = maxFrecuencias[letra];
      for (let i = 0; i < cantidad; i++) {
        bolsaDeLetras.push(letra);
      }
    }

    const totalNodos = bolsaDeLetras.length;
    const centroX = 160;
    const centroY = 160;

    let radioRueda = 100;
    let radioNodo = 22;
    let tamanoFuente = 18;

    if (totalNodos >= 9) {
      radioRueda = 108;
      radioNodo = 15;
      tamanoFuente = 13;
    } else if (totalNodos >= 7) {
      radioRueda = 100;
      radioNodo = 19;
      tamanoFuente = 16;
    } else if (totalNodos <= 5) {
      radioRueda = 90;
      radioNodo = 26;
      tamanoFuente = 20;
    }

    this.nodos = bolsaDeLetras.map((letra, index) => {
      const angulo = (index * 2 * Math.PI) / totalNodos - Math.PI / 2;
      return {
        letra,
        x: centroX + radioRueda * Math.cos(angulo),
        y: centroY + radioRueda * Math.sin(angulo),
        radio: radioNodo,
        indice: index
      };
    });

    (this as any).tamanoFuenteRueda = tamanoFuente;

    setTimeout(() => this.dibujarCanvas(), 100);
  }

  dibujarCanvas() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, 320, 320);

    this.ctx.beginPath();
    this.ctx.arc(160, 160, 125, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2b2b40';
    this.ctx.fill();

    if (this.caminoSeleccionado.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.caminoSeleccionado[0].x, this.caminoSeleccionado[0].y);

      for (let i = 1; i < this.caminoSeleccionado.length; i++) {
        this.ctx.lineTo(this.caminoSeleccionado[i].x, this.caminoSeleccionado[i].y);
      }

      if (this.isArrastrando) {
        this.ctx.lineTo(this.posMouse.x, this.posMouse.y);
      }

      this.ctx.strokeStyle = '#00e676';
      this.ctx.lineWidth = 8;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    for (const nodo of this.nodos) {
      const estaSeleccionado = this.caminoSeleccionado.includes(nodo);

      this.ctx.beginPath();
      this.ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
      this.ctx.fillStyle = estaSeleccionado ? '#00e676' : '#3f3f5a';
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      const fontPx = (this as any).tamanoFuenteRueda || 18;
      this.ctx.fillStyle = estaSeleccionado ? '#000' : '#fff';
      this.ctx.font = `bold ${fontPx}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(nodo.letra, nodo.x, nodo.y);
    }
  }

  registrarEventosCanvas(canvas: HTMLCanvasElement) {
    const obtenerPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const presionar = (e: MouseEvent | TouchEvent) => {
      const pos = obtenerPos(e);
      const nodo = this.obtenerNodoEnPos(pos.x, pos.y);
      if (nodo) {
        this.isArrastrando = true;
        this.caminoSeleccionado = [nodo];
        this.palabraSeleccionada = nodo.letra;
        this.posMouse = pos;
        this.dibujarCanvas();
      }
    };

    const mover = (e: MouseEvent | TouchEvent) => {
      if (!this.isArrastrando) return;
      this.posMouse = obtenerPos(e);

      const nodo = this.obtenerNodoEnPos(this.posMouse.x, this.posMouse.y);
      if (nodo && !this.caminoSeleccionado.includes(nodo)) {
        this.caminoSeleccionado.push(nodo);
        this.palabraSeleccionada = this.caminoSeleccionado.map(n => n.letra).join('');
      }
      this.dibujarCanvas();
    };

    const soltar = () => {
      if (!this.isArrastrando) return;
      this.isArrastrando = false;
      this.verificarPalabra();
      this.caminoSeleccionado = [];
      this.palabraSeleccionada = '';
      this.dibujarCanvas();
    };

    canvas.addEventListener('mousedown', presionar);
    canvas.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);

    canvas.addEventListener('touchstart', presionar);
    canvas.addEventListener('touchmove', mover);
    window.addEventListener('touchend', soltar);
  }

  obtenerNodoEnPos(x: number, y: number): NodoLetra | null {
    for (const nodo of this.nodos) {
      const dist = Math.hypot(nodo.x - x, nodo.y - y);
      if (dist <= nodo.radio) return nodo;
    }
    return null;
  }

  verificarPalabra() {
    const palabraIntentada = this.palabraSeleccionada.toUpperCase();
    const objetoPalabra = this.listaPalabras.find(
      p => p.palabra.toUpperCase() === palabraIntentada && !p.adivinada
    );

    if (objetoPalabra) {
      objetoPalabra.adivinada = true;
      this.puntajeActual += objetoPalabra.puntos || 10;

      const siguientePendiente = this.listaPalabras.find(p => !p.adivinada);
      if (siguientePendiente) {
        this.pistaActual = siguientePendiente.pista_concepto;
      }

      if (this.listaPalabras.every(p => p.adivinada)) {
        this.completarJuego();
      }
    }
  }

  completarJuego() {
    this.juegoCompletado = true;
    clearInterval(this.timerInterval);

    this.apiService.guardarResultadoJuego({
      actividad_id: this.actividadId,
      puntaje_total: this.puntajeActual,
      palabras_encontradas: this.listaPalabras.length,
      tiempo_segundos: this.tiempoSegundos,
      completado: true
    }).subscribe();
  }

  OcultarPalabra(palabra: string): string {
    return '_ '.repeat(palabra.length);
  }

  regresar() {
    this.router.navigate(['/alumno']);
  }
}