import { BreakpointObserver } from '@angular/cdk/layout';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { Router } from '@angular/router';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { InvoiceTableDataSource } from './invoices-table-datasource';
import { CustomersSearchTableDataSource } from './search-invoices-table-datasource';
import { flatten } from '@angular/compiler';
import { Visit } from '../customer/customer.component';
@Component({
  selector: 'app-invoices-table',
  templateUrl: './invoices-table.component.html',
})
export class InvoicesComponent implements AfterViewInit {

  constructor(private firestore: AngularFirestore, private breakpointObserver: BreakpointObserver, private router: Router, private fb: FormBuilder) {
    this.dataSource = new InvoiceTableDataSource(firestore, []);
    this.firestore.collection('system').doc('v1').get().subscribe((doc) => {
      this.numItems = doc.get('numberVisits') as number;
    });
    if (window.innerWidth > 600) {
      this.displayedColumns = ['date', 'cost', 'tip', 'employeeType', 'visitType', 'notes'];
    }
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe(evt => {
      const w = evt.target as Window;
      if (w.innerWidth < 600 && this.displayedColumns.length !== 3) {
        this.displayedColumns = ['date', 'cost', 'tip'];
      } else if (w.innerWidth >= 600 && this.displayedColumns.length !== 5) {
        this.displayedColumns = ['date', 'cost', 'tip', 'employeeType', 'visitType', 'notes'];
      }
    });
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) largeTable!: MatTable<Visit>;

  dataSource: InvoiceTableDataSource;
  numItems = 0;
  isPaginationDisabled = false;
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['date', 'cost', 'tip'];

  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription;


  invoiceForm = this.fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [new Date(), Validators.required],
  });

  getRecord(row: Visit) {
    this.router.navigate(['/invoice', row.id]);
  }

  onPageUpdate($event: PageEvent): void {
    this.dataSource = new InvoiceTableDataSource(this.firestore, this.dataSource.data);
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
    const startDate = this.invoiceForm.controls.startDate.value as Date;
    const endDate = this.invoiceForm.controls.endDate.value as Date;
    if (endDate.getTime() < startDate.getTime()) {
      window.alert('Invalid selection. End date is before start date.');
    } else {

    // User entered the same day.
    if (startDate.getTime() == endDate.getTime()) {
      endDate.setHours(23, 59, 59);
    }
    this.invoiceForm.disable();
    this.isPaginationDisabled = true;
      this.firestore.collection('visits', ref => ref.where('date', '>=', startDate.getTime()).where('date', '<=', endDate.getTime())).get().subscribe((res) => {
        let results = [];
        for (let d of res.docs) {
          let r = d.data() as Visit;
          r.id = d.id;
          results.push(r);
        }
        this.numItems = results.length;
        this.largeTable.dataSource = new CustomersSearchTableDataSource(results);
        this.invoiceForm.enable();
      }, (e) => {
        window.alert('There was an error searching: ' + e);
      });
    }
  }

  finalize(f: boolean, s: boolean, p: boolean, fr: Visit[], sr: Visit[], pr: Visit[]) {
    if (!f && !s && !p) {
      const results = flatten(fr.concat(sr).concat(pr));
      const temp = Object();
      for (let r of results) {
        temp[r.id] = r;
      }
      const filtered = Object.values(temp) as Visit[];
      
      this.numItems = filtered.length;
      this.largeTable.dataSource = new CustomersSearchTableDataSource(filtered);
      this.invoiceForm.enable();
    }
  }

  download() {
    console.log("downloading...");

  }

  clear() {
    location.reload();
  }
}
