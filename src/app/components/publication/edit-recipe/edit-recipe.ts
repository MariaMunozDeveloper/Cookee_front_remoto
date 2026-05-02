import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {PublicationService} from '../../../services/publicationService';
import {FormValidators} from '../../../validators/formValidators';
import {Observable} from 'rxjs';
import {FORBIDDEN_WORDS} from '../../../validators/forbidden-words';

type EditTab = 'info' | 'ingredients' | 'steps' | 'photos';


@Component({
  selector: 'app-edit-recipe',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinner],
  templateUrl: './edit-recipe.html',
  styleUrl: './edit-recipe.css'
})
export class EditRecipeComponent implements OnInit {
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  publicationId: string = '';
  activeTab: WritableSignal<EditTab> = signal<EditTab>('info');
  sending: boolean = false;
  loading: WritableSignal<boolean> = signal<boolean>(true);
  errorMessage: string = '';
  successMessage: string = '';

  stepImages: (File | null)[] = [];
  stepImagePreviews: (string | null)[] = [];
  resultImages: File[] = [];
  resultImagePreviews: string[] = [];
  existingResultImages: string[] = [];
  hashtags: string[] = [];
  hashtagInput: string = '';
  coverImage: File | null = null;
  coverPreview: string | null = null;
  existingCover: string | null = null;

  recipeForm: FormGroup = this.formBuilder.group({
    title: ['', [Validators.required, Validators.minLength(3),
      FormValidators.notOnlyWhiteSpace, FormValidators.primeraMayuscula,
      FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
    description: ['', [FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
    text: ['', [FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
    recommendations: ['', [FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
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

  readonly tabs: { id: EditTab; label: string }[] = [
    {id: 'info', label: 'Información'},
    {id: 'ingredients', label: 'Ingredientes'},
    {id: 'steps', label: 'Pasos'},
    {id: 'photos', label: 'Fotos'}
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.publicationId = params['id'];
      this.loadPublication();
    });
  }

  setTab(tab: EditTab): void {
    this.activeTab.set(tab);
    this.errorMessage = '';
    this.successMessage = '';
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  private loadPublication(): void {
    this.publicationService.getPublicationById(this.publicationId).subscribe({
      next: (publication: any) => {
        this.recipeForm.patchValue({
          title: publication.title,
          description: publication.description,
          text: publication.text,
          recommendations: publication.recommendations,
          raciones: publication.raciones,
          tiempoHorno: publication.tiempoHorno,
          temperaturaHorno: publication.temperaturaHorno
        });

        this.hashtags = publication.hashtags || [];

        if (publication.images?.length > 0) {
          this.existingCover = publication.images[0];
        }

        if (publication.images?.length > 1) {
          this.existingResultImages = publication.images.slice(1);
        }

        publication.ingredients?.forEach((ing: any) => {
          this.ingredients.push(this.formBuilder.group({
            name: [ing.name, [Validators.required, FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
            quantity: [ing.quantity, [FormValidators.minValue(0)]],
            unit: [ing.unit || 'unidad']
          }));
        });

        publication.steps?.forEach((step: any) => {
          this.steps.push(this.formBuilder.group({
            text: [step.text, [Validators.required, FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
            image: [step.image || null]
          }));
          this.stepImages.push(null);
          this.stepImagePreviews.push(step.image || null);
        });

        this.loading.set(false);
      },
      error: () => {
        this.router.navigate(['/feed']);
      }
    });
  }

  newIngredient(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, FormValidators.notOnlyWhiteSpace,
        FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
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

  removeExistingResultImage(index: number): void {
    this.existingResultImages.splice(index, 1);
  }

  newStep(): FormGroup {
    return this.formBuilder.group({
      text: ['', [Validators.required, FormValidators.notOnlyWhiteSpace,
        FormValidators.forbiddenWords(FORBIDDEN_WORDS)]],
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
    this.steps.at(index).patchValue({image: null});
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

  isTabValid(tab: EditTab): boolean {
    if (tab === 'info') return this.recipeForm.get('title')!.valid;
    if (tab === 'ingredients') return this.ingredients.length > 0 && this.ingredients.valid;
    if (tab === 'steps') return this.steps.length > 0 && this.steps.valid;
    return true;
  }

  onSubmit(): void {
    if (this.recipeForm.get('title')!.invalid) {
      this.recipeForm.get('title')!.markAsTouched();
      this.errorMessage = 'El título es obligatorio.';
      this.activeTab.set('info');
      return;
    }

    if (this.ingredients.invalid) {
      this.errorMessage = 'Revisa los ingredientes.';
      this.activeTab.set('ingredients');
      return;
    }

    if (this.steps.invalid) {
      this.errorMessage = 'Revisa los pasos.';
      this.activeTab.set('steps');
      return;
    }

    this.sending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      title: this.recipeForm.value.title,
      description: this.recipeForm.value.description,
      text: this.recipeForm.value.text,
      recommendations: this.recipeForm.value.recommendations,
      raciones: this.recipeForm.value.raciones,
      tiempoHorno: this.recipeForm.value.tiempoHorno,
      temperaturaHorno: this.recipeForm.value.temperaturaHorno,
      hashtags: this.hashtags,
      ingredients: this.recipeForm.value.ingredients,
      steps: this.recipeForm.value.steps,
      images: this.existingCover
        ? [this.existingCover, ...this.existingResultImages]
        : [...this.existingResultImages]
    };

    this.publicationService.updatePublication(this.publicationId, data).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.uploadNewImages(this.publicationId);
        }
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar la receta.';
        this.sending = false;
      }
    });
  }

  private uploadNewImages(publicationId: string): void {
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
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate(['/publication', publicationId]);
      });
      return;
    }

    this.uploadNext(publicationId, uploads, 0);
  }

  private uploadNext(publicationId: string, uploads: Observable<any>[], index: number): void {
    if (index >= uploads.length) {
      this.sending = false;
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate(['/publication', publicationId]);
      });
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
