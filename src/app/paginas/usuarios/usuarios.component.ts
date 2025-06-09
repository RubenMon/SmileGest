import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, map, combineLatest, startWith, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

interface Usuario {
  id: string;
  dni: string;
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatCardModule, FormsModule, MatIconModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  firestore = inject(Firestore);
  router = inject(Router);

  usuarios$!: Observable<Usuario[]>;
  usuariosFiltrados$!: Observable<Usuario[]>;

  filtro = '';
  private filtroSubject = new BehaviorSubject<string>('');

  ngOnInit(): void {
    const usersRef = collection(this.firestore, 'users');
    this.usuarios$ = collectionData(usersRef, { idField: 'id' }).pipe(
      map((usuarios: any[]) =>
        usuarios.filter(u => u.email !== 'administracionclinica@gmail.com')
      )
    ) as Observable<Usuario[]>;

    this.usuariosFiltrados$ = combineLatest([
      this.usuarios$,
      this.filtroSubject.asObservable().pipe(startWith(''))
    ]).pipe(
      map(([usuarios, filtro]) =>
        usuarios.filter(user =>
          this.coincideConFiltro(user.nombreCompleto, filtro)
        )
      )
    );
  }

  verPerfil(id: string) {
    if (id != null) {
      console.log(`Navegando al perfil del usuario con ID: ${id}`);
      this.router.navigate(['/usuarios', id]);
    } else {
      alert('Aún no se ha cargado el ID del usuario. Intenta nuevamente.');
    }
  }

  filtrarUsuarios() {
    this.filtroSubject.next(this.filtro);
  }

  private coincideConFiltro(nombre: string, filtro: string): boolean {
    const palabras = this.normalizar(nombre).split(' ');
    const primerNombre = palabras[0];
    const filtroNormalizado = this.normalizar(filtro);
    return primerNombre.startsWith(filtroNormalizado);
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
