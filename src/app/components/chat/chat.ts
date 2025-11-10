import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { UploadService, UploadedFile } from '../../services/upload.service';
import { AIService } from '../../services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements OnInit, AfterViewInit {
  @ViewChild('chatContainer', { static: false }) chatContainer?: ElementRef;

  uploadedFiles: UploadedFile[] = [];
  selectedFileId: string = '';
  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private uploadService: UploadService,
    private aiService: AIService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserFiles();
    // Add welcome message
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I\'m your AI data analyst assistant. Select a file and ask me questions about your data. For example: "What was the revenue in 2025?" or "Show me trends in sales."',
      timestamp: new Date()
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
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

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    if (!this.selectedFileId) {
      this.showMessage('Please select a file first', 'warning');
      return;
    }

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Add user message to chat
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    this.scrollToBottom();
    this.isLoading = true;

    // Call AI service to get answer
    this.aiService.chat(this.selectedFileId, userMessage).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages.push({
            role: 'assistant',
            content: response.data.answer,
            timestamp: new Date()
          });
        } else {
          this.messages.push({
            role: 'assistant',
            content: 'Sorry, I encountered an error: ' + (response.message || 'Unknown error'),
            timestamp: new Date()
          });
        }
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error getting AI response:', error);
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error: ' + error.message,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  clearChat(): void {
    this.messages = [{
      role: 'assistant',
      content: 'Chat cleared. How can I help you analyze your data?',
      timestamp: new Date()
    }];
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

