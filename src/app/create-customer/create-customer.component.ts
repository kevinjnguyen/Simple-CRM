import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { MyTel } from '../tel-input/tel-input.component';
import firebase from 'firebase/app';

@Component({
  selector: 'app-create-customer',
  templateUrl: './create-customer.component.html',
  styleUrls: ['./create-customer.component.css']
})
export class CreateCustomerComponent {

  isPending = false;

  customerForm = this.fb.group({
    firstName: [null, Validators.required],
    lastName: [null, Validators.required],
    phoneNumber1: [null, Validators.required],
    notes: [null],
  });

  constructor(private fb: FormBuilder, private router: Router, private firestore: AngularFirestore) {}
  increment = firebase.firestore.FieldValue.increment(1);

  onSubmit(): void {
    this.customerForm.disable();
    const data = this.customerForm.value;
    const phoneNumber = data.phoneNumber1 as MyTel;
    data.phoneNumber1 = phoneNumber.area + '-' + phoneNumber.exchange + '-' + phoneNumber.subscriber;
    this.firestore.collection('customers').add(data).then(res => {
      this.firestore.collection('system').doc('v1').get().subscribe(doc => {
        if (doc.exists) {
          this.firestore.collection('system').doc('v1').update({
            numberCustomers : this.increment,
          }).finally(() => {
            this.router.navigate(['customer', res.id]);
          });
        } else {
          this.firestore.collection('system').doc('v1').set({
            numberCustomers : 1,
          }).finally(() => {
            this.router.navigate(['customer', res.id]);
          });
        }
      });
    }, err => console.log(err)).finally(() => {
      this.customerForm.reset();
    });
  }

  cancel(): void {
    this.router.navigate(['..']);
  }
}
