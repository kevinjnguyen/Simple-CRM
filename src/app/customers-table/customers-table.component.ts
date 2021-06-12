import { BreakpointObserver } from '@angular/cdk/layout';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { MyTel } from '../tel-input/tel-input.component';
import { CustomersTableDataSource, CustomersTableItem } from './customers-table-datasource';
import { CustomersSearchTableDataSource } from './search-customers-table-datasource';
import { flatten } from '@angular/compiler';
@Component({
  selector: 'app-customers-table',
  templateUrl: './customers-table.component.html',
  styleUrls: ['./customers-table.component.css']
})
export class CustomersTableComponent implements AfterViewInit {

  constructor(private firestore: AngularFirestore, private breakpointObserver: BreakpointObserver, private router: Router, private fb: FormBuilder) {
    this.dataSource = new CustomersTableDataSource(firestore, []);
    this.firestore.collection('system').doc('v1').get().subscribe((doc) => {
      this.numItems = doc.get('numberCustomers') as number;
    });
    if (window.innerWidth > 600) {
      this.displayedColumns = ['firstName', 'lastName', 'phoneNumber1', 'phoneNumber2', 'notes'];
    }
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe(evt => {
      const w = evt.target as Window;
      if (w.innerWidth < 600 && this.displayedColumns.length !== 3) {
        this.displayedColumns = ['firstName', 'lastName', 'phoneNumber1'];
      } else if (w.innerWidth >= 600 && this.displayedColumns.length !== 5) {
        this.displayedColumns = ['firstName', 'lastName', 'phoneNumber1', 'phoneNumber2', 'notes'];
      }
    });
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) largeTable!: MatTable<CustomersTableItem>;

  dataSource: CustomersTableDataSource;
  numItems = 0;
  isPaginationDisabled = false;
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['firstName', 'lastName', 'phoneNumber1'];

  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription;


  customerForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    phoneNumber: [null],
  });

  getRecord(row: CustomersTableItem) {
    this.router.navigate(['/customer', row.id]);
  }

  onPageUpdate($event: PageEvent): void {
    this.dataSource = new CustomersTableDataSource(this.firestore, this.dataSource.data);
    this.dataSource.paginator = this.paginator;
    this.largeTable.dataSource = this.dataSource;
  }

  sortData(sort: Sort) {
    console.log(sort);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.largeTable.dataSource = this.dataSource;
    this.largeTable.fixedLayout = true;
  }

  onSubmit() {
    this.customerForm.disable();
    this.isPaginationDisabled = true;
    const firstName = this.customerForm.controls.firstName.value as string;
    const lastName = this.customerForm.controls.lastName.value as string;
    const phoneNumber = this.customerForm.controls.phoneNumber.value as MyTel;
    if (firstName.length === 0 && lastName.length === 0 && (phoneNumber === null || phoneNumber.area.length === 0)) {
      window.alert('Invalid');
      this.customerForm.enable();
    } else {
      let firstPending = true;
      let firstResults: CustomersTableItem[] = [];
      let lastPending = true;
      let lastResults: CustomersTableItem[] = [];
      let phonePending = true;
      let phoneResults: CustomersTableItem[] = [];

      if (firstName && firstName.length > 0) {
        this.firestore.collection('customers', ref => ref.where('firstName', '>=', firstName).where('firstName', '<=', firstName + '\uf8ff').limit(3)).get().subscribe((res) => {
          firstResults = res.docs.map((dataItem) => {
            const customer = dataItem.data() as CustomersTableItem;
            customer.id = dataItem.id;
            return customer;
          })
        }).add(() => {
          firstPending = false;
          this.finalize(firstPending, lastPending, phonePending, firstResults, lastResults, phoneResults);
        });
      } else {
        firstPending = false;
      }

      if (lastName && lastName.length > 0) {
        this.firestore.collection('customers', ref => ref.where('lastName', '>=', lastName).where('lastName', '<=', lastName + '\uf8ff').limit(3)).get().subscribe((res) => {
          lastResults = res.docs.map((dataItem) => {
            const customer = dataItem.data() as CustomersTableItem;
            customer.id = dataItem.id;
            return customer;
          })
        }).add(() => {
          lastPending = false;
          this.finalize(firstPending, lastPending, phonePending, firstResults, lastResults, phoneResults);
        });
      } else {
        lastPending = false;
      }

      if (phoneNumber && phoneNumber.area.length > 0 && phoneNumber.exchange.length > 0 && phoneNumber.subscriber.length > 0) {
        let phone = phoneNumber.area + "-" + phoneNumber.exchange + "-" + phoneNumber.subscriber;
        this.firestore.collection('customers', ref => ref.where('phoneNumber1', '==', phone)).get().subscribe((res) => {
          phoneResults = res.docs.map((dataItem) => {
            const customer = dataItem.data() as CustomersTableItem;
            customer.id = dataItem.id;
            return customer;
          })
        }).add(() => {
          phonePending = false;
          this.finalize(firstPending, lastPending, phonePending, firstResults, lastResults, phoneResults);
        });
      } else {
        phonePending = false;
      }
    }
  }

  finalize(f: boolean, s: boolean, p: boolean, fr: CustomersTableItem[], sr: CustomersTableItem[], pr: CustomersTableItem[]) {
    if (!f && !s && !p) {
      const results = flatten(fr.concat(sr).concat(pr));
      const temp = Object();
      for (let r of results) {
        temp[r.id] = r;
      }
      const filtered = Object.values(temp) as CustomersTableItem[];
      
      this.numItems = filtered.length;
      this.largeTable.dataSource = new CustomersSearchTableDataSource(filtered);
      this.customerForm.enable();
    }
  }

  clear() {
    location.reload();
  }
}
