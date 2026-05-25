import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'name'
})
export class NamePipe implements PipeTransform {

  transform(value: string | null): string {
    return value?.split(' ').map(str => str[0].toUpperCase()).slice(0,2).join('') ?? 'A';
  }

}
