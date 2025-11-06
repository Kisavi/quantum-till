import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';

import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ButtonDirective } from "primeng/button";
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  imports: [TableModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  constructor() {}

   ngOnInit() {
     
        this.data = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            datasets: [
                {
                    label: 'My First dataset',
                    backgroundColor: '#42A5F5',
                    borderColor: '#1E88E5',
                    data: [65, 59, 80, 81, 56, 55, 40]
                },
                {
                    label: 'My Second dataset',
                    backgroundColor: '#9CCC65',
                    borderColor: '#7CB342',
                    data: [28, 48, 40, 19, 86, 27, 90]
                }
            ]
        }
        this.initializePieChart();
    this.initializeBarChart();
    }
  
  products = [
    { image: "https://media.istockphoto.com/id/1472849554/photo/birthday-cake-with-a-blue-ganache-drip-and-colorful-sprinkles-isolated-on-a-white-background.jpg?s=2048x2048&w=is&k=20&c=T9EBjkM_SaZ4LaS2lOimfgW4lpNOZAkGfJu_nWkUPjw=", code: 'P001', name: 'Product 1', category: 'Category 1', quantity: 10 },
    { image: "https://cdn.pixabay.com/photo/2016/02/29/00/19/cake-1227842_1280.jpg", code: 'P002', name: 'Product 2', category: 'Category 2', quantity: 5 },
    { image: "https://cdn.pixabay.com/photo/2021/05/29/06/20/cake-6292565_640.jpg", code: 'P003', name: 'Product 3', category: 'Category 1', quantity: 8 },
  ];
    pieData: any;
  pieOptions: any;
  responsiveOptions: any;

  // Bar Chart Data (Monthly Sales)
  barData: any;
  barOptions: any;
  data: any;

  initializePieChart() {
    this.pieData = {
      labels: ['Electronics', 'Clothing', 'Books', 'Home & Garden'],
      datasets: [
        {
          data: [300, 50, 100, 150],  // Sample quantities or sales per category
          backgroundColor: [
            '#FF6384',  // Red
            '#36A2EB',  // Blue
            '#FFCE56',  // Yellow
            '#4BC0C0'   // Teal
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0'
          ]
        }
      ]
    };

    this.pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: '#6B7280'  // Matches your gray theme
          }
        }
      }
    };

    this.responsiveOptions = [
      {
        breakpoint: '1024px',
        options: {
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      }
    ];
  }

  initializeBarChart() {
    this.barData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Sales (Ksh)',
          backgroundColor: '#3B82F6',  // Blue to match your theme
          borderColor: '#1D4ED8',
          data: [650000, 590000, 800000, 810000, 560000, 550000, 400000, 700000, 600000, 750000, 900000, 950000]
        }
      ]
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6B7280'  // Gray labels
          },
          grid: {
            color: '#E5E7EB'  // Light gray grid
          }
        },
        x: {
          ticks: {
            color: '#6B7280'
          },
          grid: {
            color: '#E5E7EB'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#6B7280'
          }
        }
      }
    };

    this.responsiveOptions = [
      {
        breakpoint: '1024px',
        options: {
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      }
    ];
  }
}
