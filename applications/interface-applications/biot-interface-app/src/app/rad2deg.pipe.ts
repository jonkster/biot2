import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rad2deg'
})
export class Rad2degPipe implements PipeTransform {

  transform(value: number, inRadians: boolean): number {
      if (inRadians) {
          return value * 180 / Math.PI;
      } else {
          return  Math.PI * value / 180;
      }
  }

}
