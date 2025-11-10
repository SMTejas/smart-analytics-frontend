import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UploadedFile {
  _id: string;
  originalName: string;
  fileType: string;
  rowCount: number;
  uploadDate: string;
  isProcessed: boolean;
}

export interface FileData {
  _id: string;
  originalName: string;
  data: any[];
  columns: Array<{
    name: string;
    type: string;
  }>;
  rowCount: number;
  fileType: string;
  uploadDate: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    fileName: string;
    fileType: string;
    rowCount: number;
    columns: Array<{
      name: string;
      type: string;
    }>;
    uploadDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly API_URL = 'http://localhost:5000/api/upload';

  constructor(private http: HttpClient) {}

  // Upload file
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<UploadResponse>(`${this.API_URL}/upload`, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get user's files
  getUserFiles(): Observable<{success: boolean, data: UploadedFile[]}> {
    const token = localStorage.getItem('auth_token');
    console.log('Getting user files with token:', token ? 'Present' : 'Missing');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{success: boolean, data: UploadedFile[]}>(`${this.API_URL}/files`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get specific file data
  getFileData(fileId: string): Observable<{success: boolean, data: FileData}> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{success: boolean, data: FileData}>(`${this.API_URL}/files/${fileId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete file
  deleteFile(fileId: string): Observable<{success: boolean, message: string}> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/files/${fileId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Process data for charts
  processDataForCharts(data: any[], columns: Array<{name: string, type: string}>): any {
    const chartData = {
      bar: this.processBarChartData(data, columns),
      pie: this.processPieChartData(data, columns),
      line: this.processLineChartData(data, columns)
    };
    console.log('Processed chart data:', chartData);
    return chartData;
  }

  private processBarChartData(data: any[], columns: Array<{name: string, type: string}>): any[] {
    const numericColumns = columns.filter(col => col.type === 'number');
    if (numericColumns.length === 0) return [];

    const categoricalColumns = columns.filter(col => col.type === 'string');
    if (categoricalColumns.length === 0) return [];

    // For financial data, prioritize Month as category and Revenue as value
    const monthCol = categoricalColumns.find(col => col.name.toLowerCase().includes('month')) || categoricalColumns[0];
    const revenueCol = numericColumns.find(col => col.name.toLowerCase().includes('revenue')) || numericColumns[0];

    const chartData = data.map(row => ({
      name: row[monthCol.name] || 'Unknown',
      value: parseFloat(row[revenueCol.name]) || 0
    }));

    return chartData;
  }

  private processPieChartData(data: any[], columns: Array<{name: string, type: string}>): any[] {
    // For financial data, show spending distribution by category
    const spendingColumns = columns.filter(col => 
      col.type === 'number' && 
      (col.name.toLowerCase().includes('spend') || col.name.toLowerCase().includes('spending'))
    );

    if (spendingColumns.length === 0) return [];

    // Calculate total spending for each category across all months
    const spendingData = spendingColumns.map(col => {
      const total = data.reduce((sum, row) => sum + (parseFloat(row[col.name]) || 0), 0);
      return {
        name: col.name.replace(' ($)', '').replace('Spend', ''),
        value: total
      };
    });

    return spendingData;
  }

  private processLineChartData(data: any[], columns: Array<{name: string, type: string}>): any[] {
    const numericColumns = columns.filter(col => col.type === 'number');
    const categoricalColumns = columns.filter(col => col.type === 'string');
    
    if (numericColumns.length === 0 || categoricalColumns.length === 0) return [];

    // For financial data, show profit trend over time
    const monthCol = categoricalColumns.find(col => col.name.toLowerCase().includes('month')) || categoricalColumns[0];
    const profitCol = numericColumns.find(col => col.name.toLowerCase().includes('profit')) || numericColumns[0];

    return data.map(row => ({
      name: row[monthCol.name] || 'Unknown',
      value: parseFloat(row[profitCol.name]) || 0
    }));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Upload Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
