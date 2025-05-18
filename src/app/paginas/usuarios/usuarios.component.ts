import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, map, combineLatest, startWith, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

interface Usuario {
  dni: string;
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatCardModule, FormsModule],
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
    this.usuarios$ = collectionData(usersRef, { idField: 'dni' }) as Observable<Usuario[]>;

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

  verUsuario(dni: string) {
    this.router.navigate(['/usuarios', dni]);
  }

  filtrarUsuarios() {
    this.filtroSubject.next(this.filtro);
  }

  private coincideConFiltro(nombre: string, filtro: string): boolean {
    const palabras = this.normalizar(nombre).split(' ');
    const primerNombre = palabras[0]; // Solo el primer nombre
    const filtroNormalizado = this.normalizar(filtro);

    return primerNombre.startsWith(filtroNormalizado);
  }


  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')                   // separa tildes
      .replace(/[\u0300-\u036f]/g, '')   // elimina tildes
      .toLowerCase();                    // ignora mayúsculas
  }
}
