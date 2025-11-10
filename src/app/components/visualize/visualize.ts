import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UploadService, FileData, UploadedFile } from '../../services/upload.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-visualize',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './visualize.html',
  styleUrl: './visualize.scss'
})
export class VisualizeComponent implements OnInit, AfterViewInit {
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas', { static: false }) lineChartCanvas!: ElementRef<HTMLCanvasElement>;

  fileId: string = '';
  fileData: FileData | null = null;
  uploadedFiles: UploadedFile[] = [];
  isLoading = true;
  chartData: any = null;
  selectedTab = 0;

  // Chart instances
  barChart: Chart | null = null;
  pieChart: Chart | null = null;
  lineChart: Chart | null = null;

  // Chart configurations
  barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Bar Chart'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pie Chart'
      }
    }
  };

  lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Line Chart'
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uploadService: UploadService,
    private snackBar: MatSnackBar
  ) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.fileId = params['id'];
      this.loadUserFiles();
    });
  }

  loadUserFiles(): void {
    console.log('Loading user files for visualization...');
    this.uploadService.getUserFiles().subscribe({
      next: (response) => {
        console.log('Files loaded:', response);
        this.uploadedFiles = response.data;
        
        if (this.uploadedFiles.length > 0) {
          // If fileId is provided in route, use it; otherwise use first file
          if (this.fileId) {
            const selectedFile = this.uploadedFiles.find(f => f._id === this.fileId);
            if (selectedFile) {
              this.loadFileData(this.fileId);
            } else {
              // If fileId not found, use first file
              this.fileId = this.uploadedFiles[0]._id;
              this.loadFileData(this.fileId);
            }
          } else {
            // No fileId in route, use first file
            this.fileId = this.uploadedFiles[0]._id;
            this.loadFileData(this.fileId);
          }
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading files: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadFileData(fileId: string): void {
    this.isLoading = true;
    this.uploadService.getFileData(fileId).subscribe({
      next: (response) => {
        this.fileData = response.data;
        this.processChartData();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(error.message || 'Failed to load file data', 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  onFileSelectionChange(fileId: string): void {
    if (fileId && fileId !== this.fileId) {
      this.fileId = fileId;
      this.loadFileData(fileId);
      // Update URL without reloading
      this.router.navigate(['/visualize', fileId], { replaceUrl: true });
    }
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  processChartData(): void {
    if (!this.fileData) return;

    this.chartData = this.uploadService.processDataForCharts(
      this.fileData.data,
      this.fileData.columns
    );

    // Create charts after data is processed
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  createCharts(): void {
    if (!this.chartData || !this.fileData) return;

    this.createBarChart();
    this.createPieChart();
    this.createLineChart();
  }

  createBarChart(): void {
    if (!this.barChartCanvas || !this.chartData?.bar) return;

    // Destroy existing chart
    if (this.barChart) {
      this.barChart.destroy();
    }

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.bar.map((item: any) => item.name),
        datasets: [{
          label: 'Value',
          data: this.chartData.bar.map((item: any) => item.value),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Revenue Analysis by Month',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  createPieChart(): void {
    if (!this.pieChartCanvas || !this.chartData?.pie) return;

    // Destroy existing chart
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.chartData.pie.map((item: any) => item.name),
        datasets: [{
          data: this.chartData.pie.map((item: any) => item.value),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Spending Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  createLineChart(): void {
    if (!this.lineChartCanvas || !this.chartData?.line) return;

    // Destroy existing chart
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.chartData.line.map((item: any) => item.name),
        datasets: [{
          label: 'Net Profit Trend',
          data: this.chartData.line.map((item: any) => item.value),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Profit Trend Over Time',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Net Profit ($)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  downloadData(): void {
    if (!this.fileData) return;

    const csvContent = this.convertToCSV(this.fileData.data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.fileData.originalName}_processed.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  getChartType(): string {
    if (!this.chartData) return 'bar';

    if (this.chartData.bar && this.chartData.bar.length > 0) return 'bar';
    if (this.chartData.pie && this.chartData.pie.length > 0) return 'pie';
    if (this.chartData.line && this.chartData.line.length > 0) return 'line';
    return 'bar';
  }

  hasDataForChart(type: string): boolean {
    if (!this.chartData) return false;
    return this.chartData[type] && this.chartData[type].length > 0;
  }
}
