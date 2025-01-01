import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
//import { Question } from './question.model';
import { Router } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { MatIconModule } from '@angular/material/icon';
import { Question } from '../models/question';
import { HttpClient } from '@angular/common/http';

declare var ParsonsWidget: any;

@Component({
  selector: 'app-parsons-problem',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatIconModule, 
    ToolbarComponent
  ],
  templateUrl: './parsons-problem.component.html',
  styleUrls: ['./parsons-problem.component.css']
})
export class ParsonsProblemComponent implements OnInit {
  username: string = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').username || 'Guest';

  questions: Question[] = [];
  currentQuestion: Question | null = null;
  pageSize = 1; // Number of questions per page
  pageIndex = 0; // Current page index

  parsons: any;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
      this.router.navigate(['/']);
      return;
    }
    this.loadQuestions();
  }


  
  loadQuestions(): void {
    this.http.get<Question[]>('assets/questions/questions.json').subscribe(
      (data) => {
        this.questions = data;
        this.updatePaginatedQuestions();
      },
      (error) => {
        console.error('Error loading questions:', error);
      }
    );
  }

  updatePaginatedQuestions(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.currentQuestion = this.questions.slice(start, end)[0] || null;

    if (this.currentQuestion) {
      this.initializeParsons(this.currentQuestion);
    }
  }

  handlePageEvent(event: any): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedQuestions();
  }


//https://codio.github.io/parsons-puzzle-ui/dist/

getFeedback(): void {
  if (!this.parsons || !this.currentQuestion) return;

  const jsParsonsFeedback = this.parsons.getFeedback();
  console.log('JS-Parsons Feedback:', jsParsonsFeedback);

  const jsParsonsErrors = jsParsonsFeedback.log_errors || [];
  console.log('JS-Parsons Errors:', jsParsonsErrors);

  const customFeedback = this.currentQuestion.feedback || {};
  console.log('Custom Feedback:', customFeedback);

  const mergedFeedback = jsParsonsFeedback.map((error: any, index: number) => {
    const feedbackMessage =
      customFeedback[index.toString()] ||
      `Default feedback for line ${index + 1}: ${error.type}`;
    return `<p style="color: red;">${feedbackMessage}</p>`;

  });

  console.log('Merged Feedback:', mergedFeedback);

  const feedbackContainer = document.getElementById('feedback-container');
  if (feedbackContainer) {
    feedbackContainer.innerHTML = mergedFeedback.join('');
  } else {
    alert(
      jsParsonsFeedback.success
        ? 'Correct solution!'
        : mergedFeedback.map((msg:string) => msg.replace(/<\/?p.*?>/g, '')).join('\n')
    );
  }
  
}


  
  
  
  
  
  initializeParsons(question: Question): void {
  if (this.parsons) {
    this.parsons.clear();
  }

  // Convert the code to a single string with distractors
  const codeString = question.code
    .map((line, index) => {
      // Automatically mark lines as distractors if not part of the correctOrder
      if (!question.correctOrder.includes(line) && !line.includes('#distractor')) {
        return `${line} #distractor`;
      }
      return line;
    })
    .join('\n');

  this.parsons = new ParsonsWidget({
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 10,
    grader: ParsonsWidget._graders.LineBasedGrader,
    can_indent: false,
    show_feedback: true,
    feedback_cb: (feedback: string) => console.log('Feedback:', feedback),
  });

  setTimeout(() => {
    this.parsons.init(codeString);
    this.parsons.shuffleLines();
    console.log('ParsonsWidget initialized successfully with distractors:', {
      codeString,
    });
  }, 0);
}
}

  
  
