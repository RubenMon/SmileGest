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

  dni: string = '';
  userName: string = '';
  usuario: any = null;
  historial: HistorialItem[] = [];
  form: FormGroup;
  isLoading = false;
  fullscreenImageUrl: string | null = null;

  ordenFecha: 'asc' | 'desc' = 'desc';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      imagenBase64: [null],
    });
  }

  async ngOnInit(): Promise<void> {
    this.dni = this.route.snapshot.paramMap.get('dni')!;
    this.usuario = history.state?.usuario || null;

    if (this.usuario) {
      this.userName = this.usuario.nombreCompleto || 'Usuario sin nombre';
    } else {
      await this.loadNombreUsuario();
    }

    await this.loadHistorial();
    this.ordenarHistorial();
  }

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

  ordenarHistorial() {
    this.historial.sort((a, b) => {
      const tA = a.fecha?.getTime() || 0;
      const tB = b.fecha?.getTime() || 0;
      return this.ordenFecha === 'asc' ? tA - tB : tB - tA;
    });
  }

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

  async addHistorial() {
    if (this.form.invalid) return;

    this.isLoading = true;

    try {
      const descripcion = this.form.value.descripcion;
      const imagenBase64 = this.form.value.imagenBase64 || null;

      const histRef = collection(this.firestore, 'historyClinical');
      await addDoc(histRef, {
        dni: this.dni,
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

  goBack() {
    this.router.navigate(['/usuarios', this.dni], {
      state: { usuario: this.usuario }
    });
  }

  verImagenCompleta(imagenUrl: string | null) {
    if (imagenUrl) {
      this.fullscreenImageUrl = imagenUrl;
    }
  }

  cerrarImagenCompleta() {
    this.fullscreenImageUrl = null;
  }
}
