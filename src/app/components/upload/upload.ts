import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { UploadService, UploadedFile } from '../../services/upload.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatListModule,
    MatChipsModule
  ],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class UploadComponent implements OnInit {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadedFiles: UploadedFile[] = [];

  constructor(
    private uploadService: UploadService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserFiles();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type) && 
          !file.name.toLowerCase().endsWith('.csv') &&
          !file.name.toLowerCase().endsWith('.xlsx') &&
          !file.name.toLowerCase().endsWith('.xls')) {
        this.snackBar.open('Please select a CSV or Excel file', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('File size must be less than 10MB', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }

      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file first', 'Close', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.uploadService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedFile = null;
          
          this.snackBar.open('File uploaded successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          
          this.loadUserFiles();
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        
        this.snackBar.open(error.message || 'Upload failed', 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadUserFiles(): void {
    console.log('Loading user files...');
    this.uploadService.getUserFiles().subscribe({
      next: (response) => {
        console.log('Files loaded:', response);
        this.uploadedFiles = response.data;
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.snackBar.open('Error loading files: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  deleteFile(fileId: string): void {
    if (confirm('Are you sure you want to delete this file?')) {
      this.uploadService.deleteFile(fileId).subscribe({
        next: (response) => {
          this.snackBar.open('File deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadUserFiles();
        },
        error: (error) => {
          this.snackBar.open(error.message || 'Delete failed', 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'csv':
        return 'table_chart';
      case 'xlsx':
      case 'xls':
        return 'spreadsheet';
      default:
        return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
