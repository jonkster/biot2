import { Injectable } from '@angular/core';

@Injectable()
export class PeriodicService {

    private tasks: {[name: string]: { fn: Function, owner: any }} = {};
    private running: boolean = false;
    private counter: number = 0;

    constructor() {
    }

    registerTask(name: string, owner: any, task: (any) => void) {
        this.tasks[name] = {
            owner: owner,
            fn: task
        }
        if (! this.running) {
            this.taskHandler();
        }
        console.log('adding: ', name);
    }

    taskHandler() {
        this.running = true;
        this.counter++;
        let tasks = Object.keys(this.tasks);
        let task = tasks[this.counter % tasks.length];

        let fn = this.tasks[task].fn;
        let owner = this.tasks[task].owner;
        fn(owner);
        requestAnimationFrame(() => {
                this.taskHandler();
        });
    }

}
