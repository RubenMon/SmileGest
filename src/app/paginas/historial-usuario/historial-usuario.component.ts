import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, addDoc, doc, getDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { HistorialItem } from '../../interfaces/historial.interface';
import { HistorialData } from '../../interfaces/historial.interface';

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
    MatCardModule
  ],
  templateUrl: './historial-usuario.component.html',
  styleUrls: ['./historial-usuario.component.css']
})
export class HistorialUsuarioComponent implements OnInit {

  firestore = inject(Firestore);
  storage = inject(Storage);
  route = inject(ActivatedRoute);
  router = inject(Router);

  dni: string = '';
  userName: string = '';
  historial: HistorialItem[] = [];
  form: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      imagen: [null]
    });
  }

  async ngOnInit(): Promise<void> {
    this.dni = this.route.snapshot.paramMap.get('dni')!;
    await this.loadUserName();
    await this.loadHistorial();
  }

  async loadUserName() {
    try {
      const userDocRef = doc(this.firestore, `users/${this.dni}`);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        this.userName = userData?.['nombreCompleto'] || 'Sin nombre';
      } else {
        this.userName = 'Usuario desconocido';
      }
    } catch (error) {
      console.error('Error cargando el nombre:', error);
      this.userName = 'Error al cargar nombre';
    }
  }

  async loadHistorial() {
    try {
      const histRef = collection(this.firestore, `users/${this.dni}/historial`);
      const snapshot = await getDocs(histRef);
      this.historial = snapshot.docs.map(doc => {
        const data = doc.data() as HistorialData;
        return {
          id: doc.id,
          descripcion: data.descripcion,
          imagenUrl: data.imagenUrl,
          fecha: data.fecha?.toDate?.() ?? null
        } as HistorialItem;
      }).sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0));
    } catch (error) {
      console.error('Error al cargar historial:', error);
      alert('Error al cargar historial');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.form.patchValue({ imagen: input.files[0] });
  }

  async addHistorial() {
    if (this.form.invalid) return;

    this.isLoading = true;

    try {
      const descripcion = this.form.value.descripcion;
      const imagenFile = this.form.value.imagen;

      let imagenUrl = null;

      if (imagenFile) {
        const path = `historial/${this.dni}/${Date.now()}_${imagenFile.name}`;
        const storageRef = ref(this.storage, path);
        await uploadBytes(storageRef, imagenFile);
        imagenUrl = await getDownloadURL(storageRef);
      }

      const histRef = collection(this.firestore, `users/${this.dni}/historial`);
      await addDoc(histRef, {
        descripcion,
        fecha: new Date(),
        imagenUrl
      });

      this.form.reset();
      this.form.get('imagen')?.setValue(null);
      await this.loadHistorial();

    } catch (error) {
      console.error('Error al agregar historial:', error);
      alert('Ocurrió un error al agregar el historial. Por favor, intente de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }
    goBack() {
      this.router.navigate(['/usuarios', this.dni]);
    }
}
