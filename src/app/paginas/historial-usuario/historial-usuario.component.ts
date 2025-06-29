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
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
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
  // Inyección de dependencias de Angular y Firebase
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  router = inject(Router);
  auth = inject(Auth);

  // DNI del usuario actual
  dni: string = '';
  // Nombre del usuario
  userName: string = '';
  // Datos del usuario
  usuario: any = null;
  // Lista de historial
  historial: HistorialItem[] = [];
  // Formulario reactivo
  form: FormGroup;
  // Indicador de carga
  isLoading = false;
  // Imagen en pantalla completa
  fullscreenImageUrl: string | null = null;
  // Orden por fecha
  ordenFecha: 'asc' | 'desc' = 'desc';
  // Indica si el usuario actual es administrador
  isAdmin: boolean = false;

  constructor(private fb: FormBuilder) {
    // Inicialización del formulario
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      imagenBase64: [null],
    })
  }

  /**
   * Se ejecuta al iniciar el componente.
   * Obtiene el DNI desde la URL, identifica al usuario autenticado
   * y carga el historial del usuario correspondiente.
   */
  async ngOnInit(): Promise<void> {
    this.dni = this.route.snapshot.paramMap.get('dni')!;
    console.log('DNI recibido en HistorialUsuarioComponent:', this.dni);

    // Detectar usuario actual y comprobar si es administrador
    const currentUser = await firstValueFrom(user(this.auth));
    this.isAdmin = currentUser?.email === 'administracionclinica@gmail.com';

    // Obtener datos del usuario desde el estado de navegación o desde Firestore
    this.usuario = history.state?.usuario || null;

    if (this.usuario) {
      this.userName = this.usuario.nombreCompleto || 'Usuario sin nombre';
    } else {
      await this.loadNombreUsuario();
    }

    await this.loadHistorial();
    this.ordenarHistorial();
  }

  /**
   * Carga el nombre completo del usuario desde Firestore usando el DNI.
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
   * Carga el historial clínico del usuario desde Firestore.
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
   * Ordena el historial por fecha, de forma ascendente o descendente.
   */
  ordenarHistorial() {
    this.historial.sort((a, b) => {
      const tA = a.fecha?.getTime() || 0;
      const tB = b.fecha?.getTime() || 0;
      return this.ordenFecha === 'asc' ? tA - tB : tB - tA;
    });
  }

  /**
   * Convierte la imagen seleccionada a base64 y la guarda en el formulario.
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
   * Agrega una nueva entrada al historial en Firestore.
   * Solo ejecutable por el administrador.
   */
  async addHistorial() {
    // Evita que usuarios no administradores agreguen entradas
    if (!this.isAdmin || this.form.invalid) return;

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

      // Reiniciar formulario y recargar historial
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
   * Regresa a la vista de usuario.
   */
  goBack() {
    this.router.navigate(['/usuarios', this.dni], {
      state: { usuario: this.usuario }
    });
  }

  /**
   * Muestra la imagen seleccionada en modo pantalla completa.
   * @param imagenUrl URL o base64 de la imagen
   */
  verImagenCompleta(imagenUrl: string | null) {
    if (imagenUrl) {
      this.fullscreenImageUrl = imagenUrl;
    }
  }

  /**
   * Cierra la vista en pantalla completa de la imagen.
   */
  cerrarImagenCompleta() {
    this.fullscreenImageUrl = null;
  }
}
