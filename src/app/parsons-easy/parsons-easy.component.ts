import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Question, LineItem } from '../models/question';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { AppModalComponent } from "../app-modal/app-modal.component";
import { splitterDialogues } from './splitter-dialogues';
import { ProfessorSpeechComponent } from "../professor-speech/professor-speech.component";
import { GameComponent } from "../game/game.component";

@Component({
  selector: 'app-parsons-easy',
  templateUrl: './parsons-easy.component.html',
  styleUrls: ['./parsons-easy.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AppModalComponent, ProfessorSpeechComponent, GameComponent],
})
export class ParsonsEasyComponent {
  @Input() questions: Question[] = [];
  @Input() currentQuestion: Question | null = null;

  @Input() questionId: number | null = null; // Ensure this input is defined and accessible
  @Output() completed: EventEmitter<void> = new EventEmitter<void>(); // Notify parent of completion

  currentItems: LineItem[] = [];
  originalCode: LineItem[] = [];
  feedbackMessages: { [id: number]: string } = {};
  highlightedStatus: { [id: number]: 'correct' | 'incorrect' | 'neutral' } = {};
  remainingItems: number = 0;
  progressText: string = '';
  feedbackGiven: boolean = false;
  showNextButton: boolean = false;
  showTable: boolean = true;

  showInstructionModal: boolean = false;
  showSummaryModal: boolean = false;  // Flag to show/hide modal

  instructionModalTitle = 'Instructions';
  SummaryModalTitle = 'Summary';

  instructionModalContent = "";
  summaryModalContent = "";

  selectedSection: number = 1;
  selectedQuestionID: number | null = null;

  showProfessorModal: boolean = false;
 
  splitterDialoges = splitterDialogues;


  showModalGame: boolean = false;
  titleGame: string = 'Game Tutorial';

  constructor(private questionService: QuestionService, private toastr: ToastrService) {}

  

  openGameModal(): void {
    this.showModalGame = true;
  }

  closeGameModal(): void {
    this.showModalGame = false;
  }
  
  toggleProfessorModal() {
    this.showProfessorModal = !this.showProfessorModal;
  }




  ngOnInit(): void {
    if (this.questionId) {
      this.loadQuestionDetails(this.questionId);
    }
  }

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  closeInstructionModal() {
    this.showInstructionModal = false;  // Hide the modal when close button is clicked
  }
  
  closeSummaryModal() {
    this.showSummaryModal = false;  // Hide the modal when close button is clicked
  }

  initInstructionModal(){
    this.showInstructionModal = true;
    this.instructionModalContent = this.currentQuestion?.HINTS || "";
  }

  initSummaryModal(){
    this.showSummaryModal = true;
    this.summaryModalContent = this.currentQuestion?.SUMMARY || "";
  }

  toggleInstructionModal() {
    this.showInstructionModal = !this.showInstructionModal;
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
          SUMMARY: q.SUMMARY
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
          SUMMARY: q.SUMMARY
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
          SUMMARY: questionData.SUMMARY
        };

        this.initInstructionModal();

        this.originalCode = [...codeLines];

        this.questionService.getCorrectOrderDetails(questionID).subscribe({
          next: (correctOrderDetails) => {
            this.currentQuestion!.correctOrder = correctOrderDetails.map(
              (detail) => detail.codeLineId
            );
            this.resetPuzzle();
            this.updateProgress();
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
    // Ensure that you cannot add more items to the sortableList than remainingItems
    if (event.previousContainer === event.container) {
      // If the item is being moved within the same container (trashList to trashList)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // If the item is being moved from trashList to sortableList
      const sortableListLength = event.container.data.length;
  
      // Check if we can add more items to the sortableList
      if (sortableListLength < this.remainingItems) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      } else {
        // Prevent moving the item if sortableList would exceed the remainingItems count
        console.log('Cannot add more items, you have reached the remaining items limit.');
      }
    }
  
    // Optionally, update remainingItems or perform other operations here
    this.clearFeedback();
  }
  
  getFeedback(): void {
    if (!this.currentQuestion || !this.currentQuestion.correctOrder) {
      return;
    }
  
    const correctOrderSet = new Set(this.currentQuestion.correctOrder);
    let correctCount = 0;
  
    this.currentItems.forEach((item) => {
      // Find the corresponding feedback for each item from the database
      const feedback = this.currentQuestion!.feedback.find(
        (f) => f.codeLineId === item.codeLineId
      );
  
      // Use the feedback text from the database
      if (correctOrderSet.has(item.codeLineId)) {
        this.highlightedStatus[item.codeLineId] = 'correct';
        this.feedbackMessages[item.codeLineId] = feedback ? feedback.text : 'No feedback available';
        correctCount++;
      } else {
        this.highlightedStatus[item.codeLineId] = 'incorrect';
        this.feedbackMessages[item.codeLineId] = feedback ? feedback.text : 'No feedback available';
      }
    });
  
    this.progressText = `Correct: ${correctCount}/${this.currentQuestion.correctOrder.length}`;
    this.feedbackGiven = true;
    this.showNextButton =
      correctCount === this.currentQuestion.correctOrder.length;

    if(this.showNextButton){
      this.initSummaryModal();
    }
  }
  
  clickResetPuzzle(){
    this.resetPuzzle();
    this.toastr.info('The puzzle has been reset!', 'Reset Successful');
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
    this.completed.emit(); // Emit the completion event


  //   const currentIndex = this.questions.findIndex(
  //     (q) => q.QUESTION_ID === this.currentQuestion?.QUESTION_ID
  //   );
  //   if (currentIndex < this.questions.length - 1) {
  //     this.loadQuestionDetails(this.questions[currentIndex + 1].QUESTION_ID);
  //     this.showNextButton = false;
  //   }
  // }
  }
}
