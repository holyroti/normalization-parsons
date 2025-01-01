// src/app/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../models/question';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
    private apiUrl = 'http://localhost:3000/api/questions';

    constructor(private http: HttpClient) {}

    getQuestions(): Observable<Question[]> {
        return this.http.get<Question[]>(this.apiUrl);
    }

    addQuestion(question: Question): Observable<Question> {
        return this.http.post<Question>(this.apiUrl, question);
    }
}
