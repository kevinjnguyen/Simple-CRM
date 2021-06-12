import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthGuard, redirectLoggedInTo, redirectUnauthorizedTo, hasCustomClaim } from '@angular/fire/auth-guard';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { environment } from 'src/environments/environment';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CreateCustomerComponent } from './create-customer/create-customer.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomersTableComponent } from './customers-table/customers-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CustomerComponent } from './customer/customer.component';
import { EditInvoiceComponent } from './edit-invoice/edit-invoice.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MyTelInput } from './tel-input/tel-input.component';
import { InvoicesComponent } from './invoices/invoices-table.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['']);
const redirectDidLogin = () => redirectLoggedInTo(['customers']);

const routes: Routes = [
  {
    path: 'customers',
    component: CustomersTableComponent,
    canActivate: [AngularFireAuthGuard],
    data:
    {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },
  {
    path: 'customer/:id',
    component: CustomerComponent,
    canActivate: [AngularFireAuthGuard],
    data:
    {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },
  {
    path: 'invoices',
    component: InvoicesComponent,
    canActivate: [AngularFireAuthGuard], data:
    {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },
  {
    path: 'invoice/:id',
    component: EditInvoiceComponent, 
    canActivate: [AngularFireAuthGuard], data:
    {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },
  {
    path: 'create-customer',
    component: CreateCustomerComponent,
    canActivate: [AngularFireAuthGuard],
    data:
    {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },
  {
    path: '',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data:
    {
      authGuardPipe: redirectDidLogin,
     },
    },
  {
    path: '**',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data:
    {
      authGuardPipe: redirectDidLogin,
    },
  },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CreateCustomerComponent,
    CustomersTableComponent,
    CustomerComponent,
    EditInvoiceComponent,
    MyTelInput,
    InvoicesComponent,
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    BrowserAnimationsModule,
    FlexLayoutModule,
    LayoutModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'}),
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
