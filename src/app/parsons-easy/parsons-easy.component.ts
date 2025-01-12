import { Component, Input } from '@angular/core';
import { Question, LineItem } from '../models/question';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-parsons-easy',
  templateUrl: './parsons-easy.component.html',
  styleUrls: ['./parsons-easy.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
})
export class ParsonsEasyComponent {
  @Input() questions: Question[] = [];
  @Input() currentQuestion: Question | null = null;

  currentItems: LineItem[] = [];
  originalCode: LineItem[] = [];
  feedbackMessages: { [id: number]: string } = {};
  highlightedStatus: { [id: number]: 'correct' | 'incorrect' | 'neutral' } = {};
  remainingItems: number = 0;
  progressText: string = '';
  feedbackGiven: boolean = false;
  showNextButton: boolean = false;
  showTable: boolean = false;
  sections = [
    { id: 1, name: '1NF Easy' },
    { id: 2, name: '2NF Medium' },
    { id: 3, name: '3NF Hard' },
  ];
  selectedSection: number = 1;
  selectedQuestionID: number | null = null;

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.loadQuestions(); // Fetch questions and load details for the first question
  }

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  loadQuestionsBySection(): void {
    this.questionService.getQuestionsBySection(this.selectedSection).subscribe({
      next: (questions) => {
        this.questions = questions.map((q, index) => ({
          QUESTION_ID: q.QUESTION_ID,
          SECTION: '1NF Easy',
          QUESTION: q.QUESTION,
          HINTS: q.HINTS || '',
          HTML_CONTENT: q.HTML_CONTENT || '',
          CODE: [],
          correctOrder: [],
          feedback: [],
        }));

        if (this.questions.length > 0) {
          this.selectedQuestionID = this.questions[0].QUESTION_ID;
          this.loadQuestionDetails(this.selectedQuestionID);
        } else {
          console.warn('No questions available for this section.');
        }
      },
      error: (err) => console.error('Error loading questions:', err),
    });
  }

  loadQuestions(): void {
    this.questionService.getQuestionsBySection(1).subscribe({
      next: (questions) => {
        this.questions = questions.map((q, index) => ({
          QUESTION_ID: q.QUESTION_ID,
          SECTION: `1NF Easy`,
          QUESTION: q.QUESTION,
          HINTS: q.HINTS || '',
          HTML_CONTENT: q.HTML_CONTENT || '',
          CODE: [],
          correctOrder: [],
          feedback: [],
        }));

        if (this.questions.length > 0) {
          this.loadQuestionDetails(this.questions[0].QUESTION_ID); // Load the first question's details
        } else {
          console.warn('No questions available for this section.');
        }
      },
      error: (err) => console.error('Error loading questions:', err),
    });
  }

  loadQuestionDetails(questionID: number | null): void {
    if (!questionID) {
      console.error('Invalid question ID:', questionID);
      return;
    }

    this.questionService.getQuestionDetails(questionID).subscribe({
      next: (details) => {
        const questionData = details[0];
        const codeLines = details.map((item) => ({
          codeLineId: item.CODE_LINE_ID,
          text: item.CODE_LINE_TEXT,
        }));

        this.currentQuestion = {
          QUESTION_ID: questionData.QUESTION_ID,
          SECTION: '1NF Easy',
          QUESTION: questionData.QUESTION,
          HINTS: questionData.HINTS || '',
          HTML_CONTENT: questionData.HTML_CONTENT || '',
          CODE: codeLines,
          correctOrder: [],
          feedback: [],
        };

        this.originalCode = [...codeLines];

        // Fetch correctOrder and update progress immediately
        this.questionService.getCorrectOrderDetails(questionID).subscribe({
          next: (correctOrderDetails) => {
            this.currentQuestion!.correctOrder = correctOrderDetails.map(
              (detail) => detail.codeLineId
            );
            this.resetPuzzle();
            this.updateProgress(); // Display progress on load
          },
          error: (err) =>
            console.error('Error loading correct order details:', err),
        });

        this.questionService.getFeedbackDetails(questionID).subscribe({
          next: (feedbackDetails) => {
            this.currentQuestion!.feedback = feedbackDetails.map((feedback) => ({
              codeLineId: feedback.codeLineId,
              text: feedback.feedbackText,
            }));
          },
          error: (err) => console.error('Error loading feedback:', err),
        });
      },
      error: (err) => console.error('Error loading question details:', err),
    });
  }

  updateProgress(): void {
    if (!this.currentQuestion || !this.currentQuestion.correctOrder) {
      this.progressText = 'Correct: 0/0';
      return;
    }
    const totalCorrectOrder = this.currentQuestion.correctOrder.length;
    this.progressText = `Correct: 0/${totalCorrectOrder}`;
  }

  drop(event: CdkDragDrop<LineItem[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    //this.updateRemainingItems();
    this.clearFeedback();
  }

  getFeedback(): void {
    if (!this.currentQuestion || !this.currentQuestion.correctOrder) {
      return;
    }

    const correctOrderSet = new Set(this.currentQuestion.correctOrder);
    let correctCount = 0;

    this.currentItems.forEach((item) => {
      if (correctOrderSet.has(item.codeLineId)) {
        this.highlightedStatus[item.codeLineId] = 'correct';
        this.feedbackMessages[item.codeLineId] = 'Correct placement!';
        correctCount++;
      } else {
        this.highlightedStatus[item.codeLineId] = 'incorrect';
        this.feedbackMessages[item.codeLineId] = 'Incorrect placement!';
      }
    });

    this.progressText = `Correct: ${correctCount}/${this.currentQuestion.correctOrder.length}`;
    this.feedbackGiven = true;
    this.showNextButton =
      correctCount === this.currentQuestion.correctOrder.length;
  }

  resetPuzzle(): void {
    if (!this.currentQuestion) {
      return;
    }

    this.currentItems = [];
    this.currentQuestion.CODE = this.shuffleArray([...this.originalCode]);
    this.updateRemainingItems();
    this.clearFeedback();
  }

  updateRemainingItems(): void {
    const totalItems = this.currentQuestion?.correctOrder.length || 0;
    this.remainingItems = totalItems - this.currentItems.length;
  }

  shuffleArray(array: LineItem[]): LineItem[] {
    return array.sort(() => Math.random() - 0.5);
  }

  clearFeedback(): void {
    this.feedbackGiven = false;
    this.feedbackMessages = {};
    this.highlightedStatus = {};
    this.updateProgress();
  }

  navigateToNextQuestion(): void {
    const currentIndex = this.questions.findIndex(
      (q) => q.QUESTION_ID === this.currentQuestion?.QUESTION_ID
    );
    if (currentIndex < this.questions.length - 1) {
      this.loadQuestionDetails(this.questions[currentIndex + 1].QUESTION_ID);
      this.showNextButton = false;
    }
  }
}
