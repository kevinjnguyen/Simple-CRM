
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Visit } from '../customer/customer.component';
import firebase from 'firebase/app';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-edit-invoice',
  templateUrl: './edit-invoice.component.html',
})
export class EditInvoiceComponent implements OnInit {

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private firestore: AngularFirestore, private router: Router, private location: Location) { }

  visitTypes = environment.services;
  employeeTypes = environment.employees;

  editInvoiceForm = this.fb.group({
    date: [new Date(), Validators.required],
    visitType: [this.visitTypes[4], Validators.required],
    cost: [null, Validators.required],
    employeeType: [this.employeeTypes[2], Validators.required],
    tip: [null, Validators.required],
    notes: [''],
  });

  id = '';
  customerId = '';

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if ('id' in params) {
        this.id = params.id;
        this.editInvoiceForm.disable();
        this.firestore.collection('visits').doc(this.id).get().subscribe((doc) => {
          const visit = doc.data() as Visit;
          this.customerId = visit.customerId;
          this.editInvoiceForm.controls.cost.setValue(visit.cost);
          this.editInvoiceForm.controls.visitType.setValue(visit.visitType);
          this.editInvoiceForm.controls.date.setValue(new Date(visit.date));
          this.editInvoiceForm.controls.tip.setValue(visit.tip);
          this.editInvoiceForm.controls.employeeType.setValue(visit.employeeType);
          this.editInvoiceForm.controls.notes.setValue(visit.notes);
          this.editInvoiceForm.enable();
        });
      } else {
        this.router.navigate(['customers']);
      }
    });
  }

  onNewInvoiceSubmit() {
    this.editInvoiceForm.disable();
    const visit = this.editInvoiceForm.value as Visit;
    visit.customerId = this.customerId;
    const enteredDate = this.editInvoiceForm.value.date as Date;
    visit.date = enteredDate.getTime();
    this.firestore.collection('visits').doc(this.id).set(visit).catch((err) => {
      window.alert(err);
    }).then(() => {
      window.alert('Successfully updated');
    }).finally(() => {
      this.editInvoiceForm.enable();
    });
  }

  cancel() {
    this.location.back();
  }

  toCustomerDetails() {
    this.router.navigate(['customer', this.customerId]);
  }

  increment = firebase.firestore.FieldValue.increment(-1);

  delete() {
    const shouldDelete = window.confirm('Are you sure you want to delete this invoice?');
    if (shouldDelete) {
      this.editInvoiceForm.disable();
      this.firestore.collection('visits').doc(this.id).delete().catch((err) => window.alert(err)).then(() => {
        this.firestore.collection("customers").doc(this.customerId).update({
          visits: firebase.firestore.FieldValue.arrayRemove(this.id),
        })
        .catch((err) => window.alert(err))
        .then(() => {
            this.firestore.collection('system').doc('v1').update({
              numberVisits : this.increment,
            }).finally(() => {
              window.alert('Successfully deleted visit.')
              this.location.back();
          });
        })
      });
    }
  }
}
