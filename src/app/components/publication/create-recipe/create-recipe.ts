import {inject, Component, signal, WritableSignal} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {PublicationService} from '../../../services/publicationService';
import {FORBIDDEN_WORDS} from '../../../validators/forbidden-words';
import {FormValidators} from '../../../validators/formValidators';
import {Observable} from 'rxjs';

type CreateTab = 'info' | 'ingredients' | 'steps' | 'photos';

@Component({
  selector: 'app-create-recipe',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-recipe.html',
  styleUrl: './create-recipe.css'
})
export class CreateRecipeComponent {
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly router: Router = inject(Router);

  activeTab: WritableSignal<CreateTab> = signal<CreateTab>('info');
  sending: boolean = false;
  errorMessage: string = '';
  submitted: boolean = false;

  stepImages: (File | null)[] = [];
  stepImagePreviews: (string | null)[] = [];
  resultImages: File[] = [];
  resultImagePreviews: string[] = [];
  hashtags: string[] = [];
  hashtagInput: string = '';
  coverImage: File | null = null;
  coverPreview: string | null = null;

  recipeForm: FormGroup = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3),
      FormValidators.notOnlyWhiteSpace, FormValidators.primeraMayuscula,
      FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
    description: ['', [FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
    raciones: [null, [FormValidators.minValue(1), FormValidators.soloEnteros]],
    tiempoHorno: [null, [FormValidators.minValue(0), FormValidators.soloEnteros]],
    temperaturaHorno: [null, [FormValidators.minValue(0), FormValidators.soloEnteros]],
    ingredients: this.formBuilder.array([]),
    steps: this.formBuilder.array([])
  });

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps(): FormArray {
    return this.recipeForm.get('steps') as FormArray;
  }

  get unidades(): string[] {
    return ['g', 'kg', 'ml', 'l', 'cucharadita', 'cucharada', 'taza', 'unidad', 'pizca', 'tbsp', 'cup', 'tsp', 'oz'];
  }

  readonly tabs: { id: CreateTab; label: string }[] = [
    {id: 'info', label: 'Información'},
    {id: 'ingredients', label: 'Ingredientes'},
    {id: 'steps', label: 'Pasos'},
    {id: 'photos', label: 'Fotos'}
  ];

  setTab(tab: CreateTab): void {
    this.activeTab.set(tab);
    this.errorMessage = '';
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  isTabValid(tab: CreateTab): boolean {
    if (tab === 'info') return this.recipeForm.get('title')!.valid;
    if (tab === 'ingredients') return this.ingredients.length > 0 && this.ingredients.valid;
    if (tab === 'steps') return this.steps.length > 0 && this.steps.valid;
    return true;
  }

  newIngredient(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
      quantity: [null, [FormValidators.minValue(0)]],
      unit: ['unidad']
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.newIngredient());
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  newStep(): FormGroup {
    return this.formBuilder.group({
      text: ['', [Validators.required, FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
      image: [null]
    });
  }

  addStep(): void {
    this.steps.push(this.newStep());
    this.stepImages.push(null);
    this.stepImagePreviews.push(null);
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.stepImages.splice(index, 1);
    this.stepImagePreviews.splice(index, 1);
  }

  onStepImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.stepImages[index] = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.stepImagePreviews[index] = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removeStepImage(index: number): void {
    this.stepImages[index] = null;
    this.stepImagePreviews[index] = null;
  }

  onResultImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.resultImages.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          this.resultImagePreviews.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeResultImage(index: number): void {
    this.resultImages.splice(index, 1);
    this.resultImagePreviews.splice(index, 1);
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.coverImage = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.coverPreview = reader.result as string;
      };
      reader.readAsDataURL(this.coverImage);
    }
  }

  removeCover(): void {
    this.coverImage = null;
    this.coverPreview = null;
  }

  onHashtagInput(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim().toLowerCase();
    if ((event.key === ' ' || event.key === 'Enter') && value) {
      const clean = value.replace(/[^a-z0-9áéíóúüñ]/g, '');
      if (clean && !this.hashtags.includes(clean)) {
        this.hashtags.push(clean);
      }
      input.value = '';
      this.hashtagInput = '';
    }
  }

  removeHashtag(tag: string): void {
    this.hashtags = this.hashtags.filter(h => h !== tag);
  }

  onSubmit(): void {
    if (this.recipeForm.get('title')!.invalid) {
      this.submitted = true;
      this.recipeForm.get('title')!.markAsTouched();
      this.errorMessage = 'El título es obligatorio.';
      this.activeTab.set('info');
      return;
    }

    if (this.ingredients.length === 0 || this.ingredients.invalid) {
      this.errorMessage = 'Añade al menos un ingrediente.';
      this.activeTab.set('ingredients');
      return;
    }

    if (this.steps.length === 0 || this.steps.invalid) {
      this.errorMessage = 'Añade al menos un paso.';
      this.activeTab.set('steps');
      return;
    }

    this.sending = true;
    this.errorMessage = '';

    const data = {
      tipo: 'receta',
      title: this.recipeForm.value.title,
      description: this.recipeForm.value.description,
      raciones: this.recipeForm.value.raciones,
      tiempoHorno: this.recipeForm.value.tiempoHorno,
      temperaturaHorno: this.recipeForm.value.temperaturaHorno,
      ingredients: this.recipeForm.value.ingredients,
      steps: this.recipeForm.value.steps,
      hashtags: this.hashtags,
      text: ''
    };

    this.publicationService.savePublication(data).subscribe({
      next: (response: any) => {
        if (response.status) {
          const publicationId = response.publication._id;
          this.uploadAllImages(publicationId);
        }
      },
      error: () => {
        this.errorMessage = 'No se pudo publicar la receta.';
        this.sending = false;
      }
    });
  }

  private uploadAllImages(publicationId: string): void {
    const uploads: Observable<any>[] = [];

    if (this.coverImage) {
      uploads.push(this.publicationService.uploadImage(publicationId, this.coverImage));
    }

    this.stepImages.forEach((file, index) => {
      if (file) {
        uploads.push(this.publicationService.uploadStepImage(publicationId, index, file));
      }
    });

    this.resultImages.forEach(file => {
      uploads.push(this.publicationService.uploadImage(publicationId, file));
    });

    if (uploads.length === 0) {
      this.sending = false;
      this.router.navigate(['/feed']);
      return;
    }

    this.uploadNext(publicationId, uploads, 0);
  }

  private uploadNext(publicationId: string, uploads: Observable<any>[], index: number): void {
    if (index >= uploads.length) {
      this.sending = false;
      this.router.navigate(['/feed']);
      return;
    }

    uploads[index].subscribe({
      next: () => this.uploadNext(publicationId, uploads, index + 1),
      error: () => this.uploadNext(publicationId, uploads, index + 1)
    });
  }

  nextTab(): void {
    const current = this.tabs.findIndex(t => t.id === this.activeTab());
    if (current < this.tabs.length - 1) {
      this.setTab(this.tabs[current + 1].id);
    }
  }

  prevTab(): void {
    const current = this.tabs.findIndex(t => t.id === this.activeTab());
    if (current > 0) {
      this.setTab(this.tabs[current - 1].id);
    }
  }
}
