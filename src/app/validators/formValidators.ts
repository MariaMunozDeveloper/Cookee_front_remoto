import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class FormValidators {

  static notOnlyWhiteSpace(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value != null && value.trim().length === 0) {
      return { notOnlyWhiteSpace: true };
    }

    return null;
  }

  static forbiddenWord(word: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const forbidden = new RegExp(word, 'i').test(value);
      return forbidden ? { forbiddenWord: true } : null;
    };
  }

  static allowedExtension(regex: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const allowed = regex.test(value);
      return allowed ? null : { allowedExtension: true };
    };
  }

  static forbiddenNameArray(text: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      let result: ValidationErrors | null = null;

      text.forEach(word => {
        const regExp = new RegExp(word, 'i');
        const forbidden = regExp.test(value);

        if (forbidden) {
          result = { forbiddenName: { value: control.value } };
        }
      });

      return result;
    };
  }

  static forbiddenName(text: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const regExp = new RegExp(text, 'i');
      const forbidden = regExp.test(value);

      return forbidden
        ? { forbiddenName: { value: control.value } }
        : null;
    };
  }

  static soloEnteros(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (!Number.isInteger(Number(value))) {
      return { entero: true };
    }

    return null;
  }

  static primeraMayuscula(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    return /^[A-ZÁÉÍÓÚÜÑ]/.test(value)
      ? null
      : { primeraMayuscula: true };
  }

  static palabrasPermitidas(lista: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toLowerCase();

      if (!value) {
        return null;
      }

      const allowed = lista.map(item => item.toLowerCase()).includes(value);

      return allowed ? null : { tipoNoPermitido: true };
    };
  }

  static minValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      return Number(value) < min ? { minValue: true } : null;
    };
  }

  static forbiddenWords(list: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toLowerCase();
      if (!value) return null;

      const found = list.find(word =>
        new RegExp(`\\b${word.toLowerCase()}\\b`, 'i').test(value)
      );

      return found ? { forbiddenWords: { word: found } } : null;
    };
  }
}
