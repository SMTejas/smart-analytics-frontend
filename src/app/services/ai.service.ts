import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SummaryStats {
  rowCount: number;
  columnCount: number;
  columns: Array<{
    name: string;
    type: string;
  }>;
  numericStats?: any;
  categoricalStats?: any;
  dateStats?: any;
}

export interface InsightsResponse {
  success: boolean;
  data: {
    fileId: string;
    fileName: string;
    insights: string;
    summaryStats: {
      rowCount: number;
      columnCount: number;
      columns: Array<{
        name: string;
        type: string;
      }>;
    };
    generatedAt: string;
  };
  message?: string;
}

export interface SummaryResponse {
  success: boolean;
  data: {
    fileId: string;
    fileName: string;
    summaryStats: SummaryStats;
  };
  message?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    fileId: string;
    fileName: string;
    question: string;
    answer: string;
    timestamp: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly API_URL = 'http://localhost:5000/api/ai';

  constructor(private http: HttpClient) {}

  /**
   * Generate AI insights for a file
   * @param fileId - The ID of the file to analyze
   */
  generateInsights(fileId: string): Observable<InsightsResponse> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<InsightsResponse>(
      `${this.API_URL}/insights`,
      { fileId },
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get summary statistics for a file (without AI analysis)
   * @param fileId - The ID of the file to analyze
   */
  getSummaryStats(fileId: string): Observable<SummaryResponse> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<SummaryResponse>(
      `${this.API_URL}/summary`,
      { fileId },
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Chat with AI about data in a file
   * @param fileId - The ID of the file to analyze
   * @param question - The question to ask about the data
   */
  chat(fileId: string, question: string): Observable<ChatResponse> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<ChatResponse>(
      `${this.API_URL}/chat`,
      { fileId, question },
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('AI Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
