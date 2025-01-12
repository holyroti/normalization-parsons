import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../models/question';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = 'http://localhost:3000/api'; // Update with your backend URL

  constructor(private http: HttpClient) {}

  /**
   * Fetch all questions by section ID
   */
  getQuestionsBySection(sectionID: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions/section/${sectionID}`);
  }

  /**
   * Fetch specific question details by question ID
   */
  getQuestionDetails(questionID: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/questions/${questionID}`);
  }

  getFeedbackAndCorrectOrder(questionID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/feedback/${questionID}`);
  }
  
  getCorrectOrderDetails(questionID: number): Observable<{ codeLineId: number; explanation: string }[]> {
    return this.http.get<{ codeLineId: number; explanation: string }[]>(
      `${this.apiUrl}/questions/correct-order/${questionID}`
    );
  }
  
  getFeedbackDetails(questionID: number): Observable<{ codeLineId: number; feedbackText: string }[]> {
    return this.http.get<{ codeLineId: number; feedbackText: string }[]>(
      `${this.apiUrl}/questions/feedback/${questionID}`
    );
  }
  
  
}
