import { Component, OnInit } from '@angular/core';

interface Selection {
  value: any;
  displayValue: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.sass']
})
export class ReportsComponent implements OnInit {

  years: Selection[] = []
  months: Selection[] = []
  selectedYear: number = 0;
  selectedMonth: number = 0;
  constructor() {

    let year = new Date().getFullYear();
    this.selectedYear = year;
    for(let i = year; i >= 2005;  i -= 1) {
      this.years.push({value: i, displayValue: String(i)})
    }

    let month = new Date().getMonth() + 1;
    this.selectedMonth = month;
    this.months.push(
      {value: 1, displayValue: "January"},
      {value: 2, displayValue: "February"},
      {value: 3, displayValue: "March"},
      {value: 4, displayValue: "April"},
      {value: 5, displayValue: "May"},
      {value: 6, displayValue: "June"},
      {value: 7, displayValue: "July"},
      {value: 8, displayValue: "August"},
      {value: 9, displayValue: "September"},
      {value: 10, displayValue: "October"},
      {value: 11, displayValue: "November"},
      {value: 12, displayValue: "December"},
    )
  }

  ngOnInit(): void {
  }

}
