import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

interface Usuario {
  dni: string;
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  firestore = inject(Firestore);
  router = inject(Router);
  usuarios$!: Observable<Usuario[]>;

  ngOnInit(): void {
    const usersRef = collection(this.firestore, 'users');
    this.usuarios$ = collectionData(usersRef, { idField: 'dni' }) as Observable<Usuario[]>;
  }

  verUsuario(dni: string) {
    this.router.navigate(['/usuarios', dni]);
  }
}
