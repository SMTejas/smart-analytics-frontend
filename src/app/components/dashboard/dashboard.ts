import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { UploadService, UploadedFile } from '../../services/upload.service';
import { AIService } from '../../services/ai.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatExpansionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  uploadedFiles: UploadedFile[] = [];
  selectedFileId: string = '';
  insights: string = '';
  isLoadingInsights: boolean = false;
  insightsPanelExpanded: boolean = false;
  insightsGenerated: boolean = false;

  constructor(
    private authService: AuthService,
    private uploadService: UploadService,
    private aiService: AIService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadUserFiles();
  }

  loadUserFiles(): void {
    this.uploadService.getUserFiles().subscribe({
      next: (response) => {
        if (response.success) {
          this.uploadedFiles = response.data;
          if (this.uploadedFiles.length > 0 && !this.selectedFileId) {
            this.selectedFileId = this.uploadedFiles[0]._id;
          }
        }
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.showMessage('Error loading files: ' + error.message, 'error');
      }
    });
  }

  generateInsights(): void {
    if (!this.selectedFileId) {
      this.showMessage('Please select a file first', 'warning');
      return;
    }

    this.isLoadingInsights = true;
    this.insights = '';
    this.insightsPanelExpanded = true;

    this.aiService.generateInsights(this.selectedFileId).subscribe({
      next: (response) => {
        if (response.success) {
          this.insights = response.data.insights;
          this.insightsGenerated = true;
          this.showMessage('Insights generated successfully!', 'success');
        } else {
          this.showMessage(response.message || 'Failed to generate insights', 'error');
        }
        this.isLoadingInsights = false;
      },
      error: (error) => {
        console.error('Error generating insights:', error);
        this.showMessage('Error generating insights: ' + error.message, 'error');
        this.isLoadingInsights = false;
      }
    });
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  formatInsights(text: string): string {
    if (!text) return '';
    
    // Convert markdown-style formatting to HTML
    let formatted = text
      // Convert numbered lists
      .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
      // Convert bullet points
      .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
      // Convert line breaks
      .replace(/\n/g, '<br>');
    
    // Wrap lists in ul tags
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return formatted;
  }

  logout(): void {
    this.authService.logout();
  }
}

