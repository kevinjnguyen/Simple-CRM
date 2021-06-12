import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title: string = environment.companyName;
  constructor(public auth: AngularFireAuth, private router: Router) {}

  logout(): void {
    this.auth.signOut().finally(() => {
      location.reload();
    });
  }
}
