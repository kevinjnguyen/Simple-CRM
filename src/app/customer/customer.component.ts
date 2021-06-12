import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/app';
import { fromEvent, Observable, Subscription} from 'rxjs';
import { environment } from 'src/environments/environment';
import { MyTel } from '../tel-input/tel-input.component';
import { VisitsDataSource } from './visits-datasource';
@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
})
export class CustomerComponent implements OnInit {
  @ViewChild(MatTable) visitTables!: MatTable<Visit>;
  customerForm = this.fb.group({
    firstName: [null, Validators.required],
    lastName: [null, Validators.required],
    phoneNumber1: [null, Validators.required],
    phoneNumber2: [null],
    notes: [null],
  });

  visitTypes = environment.services;
  employeeTypes = environment.employees;

  newInvoiceForm = this.fb.group({
    date: [new Date(), Validators.required],
    visitType: [this.visitTypes[5], Validators.required],
    cost: [null, Validators.required],
    employeeType: [this.employeeTypes[2], Validators.required],
    tip: [null, Validators.required],
  });

  id = '';

  displayedColumns = ['date', 'price', 'tip'];
  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription;

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private firestore: AngularFirestore) {
    if (window.innerWidth > 600) {
      this.displayedColumns = ['date', 'price', 'visitType', 'tip', 'employee', 'notes'];
    }
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe(evt => {
      const w = evt.target as Window;
      if (w.innerWidth < 600 && this.displayedColumns.length !== 3) {
        this.displayedColumns = ['date', 'price', 'tip'];
      } else if (w.innerWidth >= 600 && this.displayedColumns.length !== 5) {
        this.displayedColumns = ['date', 'price', 'visitType', 'tip', 'employee', 'notes'];
      }
    });
  }

  convertPhoneNumber(phoneNumber: string): MyTel {
    if (phoneNumber) {
      const first = phoneNumber.substr(0, 3);
      const second = phoneNumber.substr(4, 3);
      const third = phoneNumber.substr(8, 4);
      return new MyTel(first, second, third);
    }
    return new MyTel('', '', '');
  }

  ngOnInit(): void {
    this.customerForm.disable();
    this.route.params.subscribe(params => {
      if ('id' in params) {
        this.id = params.id;
        this.firestore.collection('customers').doc(this.id).get().subscribe((doc) => {
          const customer = doc.data() as Customer;
          this.customerForm.controls.firstName.setValue(customer.firstName);
          this.customerForm.controls.lastName.setValue(customer.lastName);
          this.customerForm.controls.phoneNumber1.setValue(this.convertPhoneNumber(customer.phoneNumber1));
          this.customerForm.controls.phoneNumber2.setValue(this.convertPhoneNumber(customer.phoneNumber2));
          this.customerForm.controls.notes.setValue(customer.notes);
          const visits = doc.get('visits') as string[];
          if (visits) {
            const visitsPromise = visits.map((visitId) => {
              return this.firestore.collection('visits').doc(visitId).get().toPromise();
            });
            Promise.all(visitsPromise).then((docs) => {
              const previousVisits = docs.map((d) => {
                const id = d.id;
                const visitData = d.data() as Visit;
                visitData.id = id;
                return visitData;
              }).sort((a, b) => b.date - a.date);
              const dataSource = new VisitsDataSource(previousVisits);
              this.visitTables.dataSource = dataSource;
            }).catch((err) => window.alert(err));
          }
        }).add(() => {
          this.customerForm.enable();
        }).unsubscribe();
      } else {
        this.router.navigate(['customers']);
      }
    });
  }

  onSubmit(): void {
    this.customerForm.disable();
    const data = this.customerForm.value;
    const phoneNumber = data.phoneNumber1 as MyTel;
    const phoneNumber2 = data.phoneNumber2 as MyTel;
    data.phoneNumber1 = phoneNumber.area + '-' + phoneNumber.exchange + '-' + phoneNumber.subscriber;
    if (phoneNumber2.subscriber) {
      data.phoneNumber2 = phoneNumber2.area + '-' + phoneNumber2.exchange + '-' + phoneNumber2.subscriber;
    } else {
      data.phoneNumber2 = '';
    }
    this.firestore.collection('customers').doc(this.id).set(data).then(() => {
      window.alert('Successfully updated.');
    }, err => console.log(err)).finally(() => {
      this.customerForm.enable();
    });
  }

  increment = firebase.firestore.FieldValue.increment(1);

  onNewInvoiceSubmit(): void {
    this.newInvoiceForm.disable();
    const visit = this.newInvoiceForm.value as Visit;
    visit.customerId = this.id;
    const enteredDate = this.newInvoiceForm.value.date as Date;
    visit.date = enteredDate.getTime();
    const newVisitDocRef = this.firestore.collection('visits').doc().ref;
    const newVisitId = newVisitDocRef.id;
    newVisitDocRef.set(visit).catch((err) => {
      window.alert(err);
    }).then(() => {
      this.firestore.collection('customers').doc(this.id).update({
        visits: firebase.firestore.FieldValue.arrayUnion(newVisitId),
      }).catch((err) => window.alert(err))
      .then(() => {
        this.firestore.collection('system').doc('v1').update({
          numberVisits : this.increment,
        }).finally(() => {
          window.alert('Successfully added visit.');
          location.reload();
        })
      });
    });
  }

  editVisit(row: Visit): void {
    this.router.navigate(['invoice', row.id]);
  }

  downloadContact(): void {
    const firstName = this.customerForm.controls.firstName.value;
    const lastName = this.customerForm.controls.lastName.value;
    const phoneNumber = this.customerForm.controls.phoneNumber1.value as MyTel;
    const phoneNumber2 = this.customerForm.controls.phoneNumber2.value as MyTel;
    const strPhoneNumber1 = phoneNumber.area + '-' + phoneNumber.exchange + '-' + phoneNumber.subscriber;
    let strPhoneNumber2 = '';
    if (phoneNumber2.subscriber) {
      strPhoneNumber2 = phoneNumber2.area + '-' + phoneNumber2.exchange + '-' + phoneNumber2.subscriber;
    }
    const notes = this.customerForm.controls.notes.value;

    const blob = new Blob([
`BEGIN:VCARD
VERSION:2.1
FN:${firstName} ${lastName}
N:${lastName};${firstName};;;
TEL;CELL:${strPhoneNumber1}
TEL;WORK:${strPhoneNumber2}
URL:https://beautychoicesalon-630f4.firebaseapp.com/customer/${this.id}
NOTE:${notes}
END:VCARD`], {type : 'text/x-vcard'});
    this.downloadBlob(blob, `${firstName}_${lastName}.vcf`);
  }

  downloadBlob(blob: Blob, filename: string | undefined) {
    // Create an object URL for the blob object
    const url = URL.createObjectURL(blob);
    
    // Create a new anchor element
    const a = document.createElement('a');
    
    // Set the href and download attributes for the anchor element
    // You can optionally set other attributes like `title`, etc
    // Especially, if the anchor element will be attached to the DOM
    a.href = url;
    a.download = filename || 'download';
    
    // Click handler that releases the object URL after the element has been clicked
    // This is required for one-off downloads of the blob content
    const clickHandler = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    
    // Add the click event listener on the anchor element
    // Comment out this line if you don't want a one-off download of the blob content
    a.addEventListener('click', clickHandler, false);
    
    // Programmatically trigger a click on the anchor element
    // Useful if you want the download to happen automatically
    // Without attaching the anchor element to the DOM
    // Comment out this line if you don't want an automatic download of the blob content
    a.click();
    
    // Return the anchor element
    // Useful if you want a reference to the element
    // in order to attach it to the DOM or use it in some other way
    return a;
  }
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber1: string;
  phoneNumber2: string;
  notes: string;
  visits: string[];
}

export interface Visit {
  id: string;
  customerId: string;
  date: number;
  visitType: string;
  cost: number;
  employeeType: string;
  tip: number;
  notes: string;
}
