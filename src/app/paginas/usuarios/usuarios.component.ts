import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, map, combineLatest, startWith, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

// Interfaz que define la estructura de un Usuario
interface Usuario {
  id: string;
  dni: string;
  nombreCompleto: string;
  email: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, MatCardModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  // Inyección de Firestore y Router
  firestore = inject(Firestore);
  router = inject(Router);

  // Observable con todos los usuarios desde Firestore
  usuarios$!: Observable<Usuario[]>;
  // Observable con los usuarios filtrados según filtro
  usuariosFiltrados$!: Observable<Usuario[]>;

  // Variable que contiene el texto de filtro ingresado
  filtro = '';
  // Subject para emitir cambios del filtro
  private filtroSubject = new BehaviorSubject<string>('');

  ngOnInit(): void {
    // Referencia a la colección 'users' en Firestore
    const usersRef = collection(this.firestore, 'users');

    // Obtener datos de usuarios en tiempo real desde Firestore, agregando el campo 'id'
    this.usuarios$ = collectionData(usersRef, { idField: 'id' }).pipe(
      // Filtrar para excluir al usuario administrador por email
      map((usuarios: any[]) =>
        usuarios.filter(u => u.email !== 'administracionclinica@gmail.com')
      )
    ) as Observable<Usuario[]>;

    // Combina el listado de usuarios con el filtro para obtener la lista filtrada
    this.usuariosFiltrados$ = combineLatest([
      this.usuarios$,
      this.filtroSubject.asObservable().pipe(startWith(''))
    ]).pipe(
      // Filtrar usuarios cuyo primer nombre coincida con el filtro
      map(([usuarios, filtro]) =>
        usuarios.filter(user =>
          this.coincideConFiltro(user.nombreCompleto, filtro)
        )
      )
    );
  }

  /**
   * Navega al perfil del usuario cuyo ID se recibe.
   * Si el ID es nulo, muestra alerta de error.
   */
  verPerfil(id: string) {
    if (id != null) {
      console.log(`Navegando al perfil del usuario con ID: ${id}`);
      this.router.navigate(['/usuarios', id]);
    } else {
      alert('Aún no se ha cargado el ID del usuario. Intenta nuevamente.');
    }
  }

  /**
   * Actualiza el filtro con el texto que hay en la variable filtro.
   * Esto emite un nuevo valor al filtroSubject que actualiza la lista filtrada.
   */
  filtrarUsuarios() {
    this.filtroSubject.next(this.filtro);
  }

  /**
   * Compara el primer nombre de un usuario con el filtro.
   * @param nombre Nombre completo del usuario
   * @param filtro Texto ingresado para filtrar
   * @returns true si el primer nombre comienza con el filtro, ignorando mayúsculas y acentos
   */
  private coincideConFiltro(nombre: string, filtro: string): boolean {
    const palabras = this.normalizar(nombre).split(' ');
    const primerNombre = palabras[0];
    const filtroNormalizado = this.normalizar(filtro);
    return primerNombre.startsWith(filtroNormalizado);
  }

  /**
   * Normaliza un texto:
   * - Remueve acentos
   * - Convierte a minúsculas
   * Esto facilita comparación sin importar mayúsculas o acentos.
   */
  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Navega a la vista principal del calendario.
   */
  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
