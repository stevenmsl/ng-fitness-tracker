import { Subject, Subscription } from 'rxjs';
import { Exercise } from './exercise.model';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class TrainingService {
  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();
  private availableExercises: Exercise[] = [];
  private runningExercise: Exercise;
  private fbSubs: Subscription[] = [];

  constructor(private db: AngularFirestore) {}

  fetchAvailableExercises() {
    this.fbSubs.push(
      this.db
        .collection('availableExercises')
        .snapshotChanges()
        .pipe(
          map((docArray) => {
            return docArray.map((doc) => {
              // recover from unknown to object
              // as you want to use spread operator later
              const data = doc.payload.doc.data() as object;
              // construct the exercise
              return {
                //
                id: doc.payload.doc.id,
                ...data,
              } as Exercise;
            });
          })
        )
        .subscribe((exercises) => {
          this.availableExercises = exercises;
          this.exercisesChanged.next([...this.availableExercises]);
        })
    );

    // return this.availableExercises.slice();
  }

  startExercise(selectedId: string) {
    // this.db
    //   .doc(`availableExercises/${selectedId}`)
    //   .update({ lastSelected: new Date() });
    this.runningExercise = this.availableExercises.find(
      (ex) => ex.id === selectedId
    );
    this.exerciseChanged.next({ ...this.runningExercise });
  }

  completeExercise() {
    this.addDataToDb({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed',
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDb({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled',
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  getRunningExercise(): Exercise {
    return { ...this.runningExercise };
  }

  fetchCompletedOrCancelledExercises() {
    this.fbSubs.push(
      this.db
        .collection('finishedExercises')
        .valueChanges()
        .pipe(
          map((docArray) => {
            // Firestore only has timestamp type
            // need to convert it to date
            return docArray.map((doc: object) => {
              return { ...doc, date: doc['date'].toDate() } as Exercise;
            });
          })
        )
        .subscribe((exercises) => {
          this.finishedExercisesChanged.next(exercises);
        })
    );
    //return this.exercises.slice();
  }

  cancelSubscriptions() {
    this.fbSubs.forEach((sub) => sub.unsubscribe());
  }

  private addDataToDb(exercise: Exercise) {
    this.db.collection('finishedExercises').add(exercise);
  }
}
