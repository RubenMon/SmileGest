import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { HistorialItem, HistorialData } from '../../interfaces/historial.interface';

@Component({
  selector: 'app-historial-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
  ],
  templateUrl: './historial-usuario.component.html',
  styleUrls: ['./historial-usuario.component.css'],
})
export class HistorialUsuarioComponent implements OnInit {
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  router = inject(Router);

  /** DNI del usuario cuyo historial se muestra */
  dni: string = '';

  /** Nombre completo del usuario */
  userName: string = '';

  /** Objeto con los datos del usuario */
  usuario: any = null;

  /** Lista de entradas del historial del usuario */
  historial: HistorialItem[] = [];

  /** Formulario reactivo para agregar nueva entrada de historial */
  form: FormGroup;

  /** Estado para mostrar indicador de carga */
  isLoading = false;

  /** URL de imagen en modo pantalla completa */
  fullscreenImageUrl: string | null = null;

  /** Orden para mostrar el historial: ascendente o descendente */
  ordenFecha: 'asc' | 'desc' = 'desc';

  constructor(private fb: FormBuilder) {
    // Inicializa el formulario con validaciones
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      imagenBase64: [null],
    });
  }

  /**
   * Método del ciclo de vida Angular, se ejecuta al iniciar el componente.
   * Obtiene el DNI desde la ruta, carga usuario y su historial.
   */
  async ngOnInit(): Promise<void> {
    this.dni = this.route.snapshot.paramMap.get('dni')!;
    console.log('DNI recibido en HistorialUsuarioComponent:', this.dni);

    // Si se pasó el usuario por navegación, se usa directamente
    this.usuario = history.state?.usuario || null;

    if (this.usuario) {
      this.userName = this.usuario.nombreCompleto || 'Usuario sin nombre';
    } else {
      // Si no, se busca el nombre del usuario en Firestore
      await this.loadNombreUsuario();
    }

    // Carga el historial y lo ordena
    await this.loadHistorial();
    this.ordenarHistorial();
  }

  /**
   * Carga el nombre completo del usuario consultando Firestore usando el DNI.
   */
  async loadNombreUsuario() {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('dni', '==', this.dni));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as any;
        this.userName = data.nombreCompleto || 'Usuario sin nombre';
        this.usuario = data;
      } else {
        this.userName = 'Usuario no encontrado';
      }
    } catch (error) {
      console.error('Error al cargar el nombre del usuario:', error);
      this.userName = 'Error al cargar';
    }
  }

  /**
   * Carga las entradas del historial clínico del usuario desde Firestore.
   */
  async loadHistorial() {
    try {
      const histRef = collection(this.firestore, 'historyClinical');
      const q = query(histRef, where('dni', '==', this.dni));
      const snapshot = await getDocs(q);

      this.historial = snapshot.docs.map((doc) => {
        const data = doc.data() as HistorialData;
        return {
          id: doc.id,
          descripcion: data.descripcion,
          imagenUrl: data.imagenBase64,
          fecha: data.fecha?.toDate?.() ?? null,
        } as HistorialItem;
      });
    } catch (error) {
      console.error('Error al cargar historial:', error);
      alert('Error al cargar historial');
    }
  }

  /**
   * Ordena el arreglo de historial según el campo fecha, en orden ascendente o descendente.
   */
  ordenarHistorial() {
    this.historial.sort((a, b) => {
      const tA = a.fecha?.getTime() || 0;
      const tB = b.fecha?.getTime() || 0;
      return this.ordenFecha === 'asc' ? tA - tB : tB - tA;
    });
  }

  /**
   * Evento disparado al seleccionar un archivo en el input.
   * Convierte la imagen a base64 para guardarla en el formulario.
   * @param event Evento del input file
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.form.patchValue({ imagenBase64: base64String });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Añade una nueva entrada al historial en Firestore usando los datos del formulario.
   * Luego recarga el historial actualizado.
   */
  async addHistorial() {
    if (this.form.invalid) return;

    this.isLoading = true;

    try {
      const descripcion = this.form.value.descripcion;
      const imagenBase64 = this.form.value.imagenBase64 || null;

      const histRef = collection(this.firestore, 'historyClinical');
      await addDoc(histRef, {
        dni: this.dni,
        email: this.usuario.email,
        descripcion,
        fecha: new Date(),
        imagenBase64,
      });

      this.form.reset();
      await this.loadHistorial();
      this.ordenarHistorial();
    } catch (error) {
      console.error('Error al agregar historial:', error);
      alert('Ocurrió un error al agregar el historial. Por favor, intente de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Navega hacia la página del usuario, pasando el estado del usuario.
   */
  goBack() {
    this.router.navigate(['/usuarios', this.dni], {
      state: { usuario: this.usuario }
    });
  }

  /**
   * Muestra la imagen en pantalla completa cuando se hace clic sobre ella.
   * @param imagenUrl URL o base64 de la imagen
   */
  verImagenCompleta(imagenUrl: string | null) {
    if (imagenUrl) {
      this.fullscreenImageUrl = imagenUrl;
    }
  }

  /**
   * Cierra la vista de imagen en pantalla completa.
   */
  cerrarImagenCompleta() {
    this.fullscreenImageUrl = null;
  }
}
