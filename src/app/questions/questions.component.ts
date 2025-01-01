// src/app/components/questions/questions.component.ts
import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { Question } from '../parsons-problem/question.model';
@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css'],
  standalone: true
})

export class QuestionsComponent implements OnInit {
    questions!: Question[];
    selectedOption!: string;

    constructor(private questionService: QuestionService) {}

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.questionService.getQuestions().subscribe(questions => {
            this.questions = questions;
        });
    }

    onSelect(option: string, question: Question): void {
        this.selectedOption = option;
        if (option !== question.correctOption) {
            alert(question.feedbackWrong); // Simple alert, can be replaced with a nicer UI element
        }
    }
}
