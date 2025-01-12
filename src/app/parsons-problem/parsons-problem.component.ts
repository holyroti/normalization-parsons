import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionService } from '../services/question.service';
import { Question } from '../models/question';
import { ParsonsEasyComponent } from '../parsons-easy/parsons-easy.component';
import { ParsonsColumnsComponent } from '../parsons-columns/parsons-columns.component';
import { ParsonsRelationsComponent } from '../parsons-relations/parsons-relations.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  selector: 'app-parsons-problem',
  templateUrl: './parsons-problem.component.html',
  styleUrls: ['./parsons-problem.component.css'],
  standalone: true,
  imports: [ParsonsEasyComponent, ParsonsColumnsComponent, ParsonsRelationsComponent, CommonModule, FormsModule, DragDropModule, ToolbarComponent ], // No need for `providers` here
  
})
export class ParsonsProblemComponent implements OnInit {
  username: string = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').username || 'Guest';
  selectedSection: number = 1; // Default section
  questions: Question[] = [];
  currentQuestion: Question | null = null;

  sections = [
    { id: 1, name: '1NF Easy' },
    { id: 2, name: '1NF Columns' },
    { id: 3, name: 'Relations PK/FK' },
  ];

  constructor(private router: Router, private questionService: QuestionService) {}

  ngOnInit(): void {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
      this.router.navigate(['/']);
      return;
    }
    this.loadQuestionsBySection();
  }

  loadQuestionsBySection(): void {
    this.questionService.getQuestionsBySection(this.selectedSection).subscribe({
      next: (questions: Question[]) => {
        this.questions = questions;
        this.currentQuestion = questions.length ? questions[0] : null; // Set the first question
      },
      error: (err) => console.error('Error loading questions:', err)
    });
  }
}
