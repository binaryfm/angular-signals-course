import {
   Component,
   computed,
   effect,
   inject,
   Injector,
   signal,
   viewChild
} from '@angular/core';
import { CoursesService } from "../services/courses.service";
import {
   Course,
   sortCoursesBySeqNo
} from "../models/course.model";
import {
   MatTab,
   MatTabGroup
} from "@angular/material/tabs";
import { CoursesCardListComponent } from "../courses-card-list/courses-card-list.component";
import { MatDialog } from "@angular/material/dialog";
import { MessagesService } from "../messages/messages.service";
import {
   catchError,
   from
} from "rxjs";
import {
   toObservable,
   toSignal
} from "@angular/core/rxjs-interop";
import { openEditCourseDialog } from "../edit-course-dialog/edit-course-dialog.component";

@Component({
   selector: 'home',
   imports: [
      MatTabGroup,
      MatTab,
      CoursesCardListComponent
   ],
   templateUrl: './home.component.html',
   styleUrl: './home.component.scss'
})
export class HomeComponent {
   
   coursesService = inject(CoursesService);
   dialog = inject(MatDialog);
   messageService = inject(MessagesService);
   beginnersList = viewChild<CoursesCardListComponent>("beginnersList");
   injector = inject(Injector);
   #courses = signal<Course[]>([]);
   beginnerCourses = computed(() => {
      const courses = this.#courses();
      return courses.filter(course =>
         course.category === "BEGINNER")
   });
   advancedCourses = computed(() => {
      const courses = this.#courses();
      return courses.filter(course =>
         course.category === "ADVANCED")
   });
   
   constructor() {
      
      effect(() => {
         console.log(`beginnersList: `, this.beginnersList())
      })
      
      effect(() => {
         console.log(`Beginner courses: `, this.beginnerCourses())
         console.log(`Advanced courses: `, this.advancedCourses())
      });
      
      this.loadCourses()
         .then(() => console.log(`All courses loaded:`, this.#courses()));
   }
   
   async loadCourses() {
      try {
         const courses = await this.coursesService.loadAllCourses();
         this.#courses.set(courses.sort(sortCoursesBySeqNo));
      } catch (err) {
         this.messageService.showMessage(
            `Error loading courses!`,
            "error"
         );
         console.error(err);
      }
   }
   
   onCourseUpdated(updatedCourse: Course) {
      const courses = this.#courses();
      const newCourses = courses.map(course => (
         course.id === updatedCourse.id ? updatedCourse : course
      ));
      this.#courses.set(newCourses);
   }
   
   async onCourseDeleted(courseId: string) {
      try {
         await this.coursesService.deleteCourse(courseId);
         const courses = this.#courses();
         const newCourses = courses.filter(
            course => course.id !== courseId)
         this.#courses.set(newCourses);
      } catch (err) {
         console.error(err)
         alert(`Error deleting course.`)
      }
   }
   
   async onAddCourse() {
      const newCourse = await openEditCourseDialog(
         this.dialog,
         {
            mode: "create",
            title: "Create New Course"
         }
      )
      if ( !newCourse ) {
         return;
      }
      const newCourses = [
         ...this.#courses(),
         newCourse
      ];
      this.#courses.set(newCourses);
   }
   
   onToObservableExample() {
      const numbers = signal(0);
      numbers.set(1);
      numbers.set(2);
      numbers.set(3);
      const numbers$ = toObservable(numbers, {
         injector: this.injector
      });
      numbers.set(4);
      numbers$.subscribe(val => {
         console.log(`numbers$: `, val)
      })
      numbers.set(5);
   }
   
   onToSignalExample() {
      try {
         const courses$ = from(this.coursesService.loadAllCourses())
            .pipe(
               catchError(err => {
                  console.log(`Error caught in catchError`, err)
                  throw err;
               })
            );
         const courses = toSignal(courses$, {
            injector: this.injector,
            rejectErrors: true
         })
         effect(() => {
            console.log(`Courses: `, courses())
         }, {
            injector: this.injector
         })
         
         setInterval(() => {
            console.log(`Reading courses signal: `, courses())
         }, 1000)
         
      } catch (err) {
         console.log(`Error in catch block: `, err)
      }
      
   }
   
}













