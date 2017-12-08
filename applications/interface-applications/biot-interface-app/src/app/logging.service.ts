import { Injectable } from '@angular/core';

@Injectable()
export class LoggingService {

  private lastError: string = '';
  constructor() { }

  getError(): string {
      let error = this.lastError;
      this.lastError = '';
      return error;
  }

  setError(msg: string) {
    this.lastError = msg;
  }

}
