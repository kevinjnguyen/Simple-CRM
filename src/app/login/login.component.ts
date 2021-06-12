import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import firebase from 'firebase/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  constructor(public auth: AngularFireAuth, private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {}

  login() {
    this.auth.user.subscribe( (user) => {
      this.router.navigate(['customers']);
    });
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
}
