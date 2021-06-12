import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Visit } from '../customer/customer.component';


/**
 * Data source for the InvoiceTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class InvoiceTableDataSource extends DataSource<Visit> {
  numItems = 0;
  paginator: MatPaginator | undefined;
  pageEvent: PageEvent | undefined;
  pageSizeChunk = 100;

  constructor(private firestore: AngularFirestore, public data: Visit[]) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<Visit[]> {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      const endIndex = startIndex + this.paginator.pageSize;
      if (this.data.length === 0) {
        return this.firestore.collection(
          'visits',
          ref => ref.orderBy('date', 'desc').orderBy('customerId', 'desc').limit(this.pageSizeChunk)
        ).get().pipe(map((item) => {
          this.data = this.data.concat(item.docs.map((dataItem) => {
            const visit = dataItem.data() as Visit;
            visit.id = dataItem.id;
            return visit;
           }));
          return this.data.slice(startIndex, endIndex);
        }));
      }

      if (endIndex < this.data.length) {
        return observableOf(this.data.slice(startIndex, endIndex));
      } else {
        console.log('Fetching...', startIndex, endIndex);
        const last = this.data[this.data.length - 1];
        return this.firestore.collection(
          'visits',
          ref => ref.orderBy('date', 'desc').orderBy('customerId', 'desc').startAfter(last.date, last.customerId).limit(this.pageSizeChunk)
        ).get().pipe(map((item) => {
          this.data = this.data.concat(item.docs.map((dataItem) => {
            const visit = dataItem.data() as Visit;
            visit.id = dataItem.id;
            return visit;
           }));
          return this.data.slice(startIndex, endIndex);
        }));
      }
    } else {
      throw Error('Please set the paginator and sort on the data source before connecting.');
    }
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {}
}
