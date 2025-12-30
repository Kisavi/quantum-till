import { Component, signal, computed, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';

import { Distributor, Option } from '../../core/models/distributor';
import { DistributorService } from '../../core/services/distributors.service';
import { compressImageFile } from '../../core/helpers/image-helpers';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';

@Component({
  selector: 'app-distributors',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    CardModule,
    ConfirmDialogModule,
    ToastModule,
    MessageModule,
    Tooltip,
    TimestampMillisPipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './distributors.component.html',
})
export class DistributorsComponent implements OnInit {
  distributors = signal<Distributor[]>([]);

  // 🔄 Loading states
  isLoadingDistributors = true;
  isSavingDistributor = false;
  isDeletingDistributor = signal(false);

  visibleDialog = signal(false);
  isEditing = signal(false);
  selectedDistributor = signal<Distributor | null>(null);

  visibleImageModal = false;
  selectedImageUrl = signal('');

  distributorForm: FormGroup;

  private fileMap = new Map<string, { file: File | null; url: string | null }>();

  roleOptions: Option[] = [
    { label: 'Driver', value: 'driver' },
    { label: 'Sales Person', value: 'sales_person' },
  ];

  carOptions: Option[] = [
    { label: 'Mazda - KCK 9039', value: 'mazda-kck-9039' },
    { label: 'Mazda - KDB 9045', value: 'mazda-kdb-9045' },
    { label: 'Probox - KCB 9043', value: 'probox-kcb-9043' },
  ];

  routeOptions: Option[] = [
    { label: 'Mariakani', value: 'mariakani' },
    { label: 'Mombasa', value: 'mombasa' },
    { label: 'Kilifi', value: 'kilifi' },
    { label: 'Lamu', value: 'lamu' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  constructor(
    private fb: FormBuilder,
    private distributorService: DistributorService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.distributorForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      idNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      carAssigned: ['', Validators.required],
      routesAssigned: [[], [this.minLengthArrayValidator(1)]],
      status: ['active', Validators.required],
      dateJoined: [new Date(), Validators.required],
      dateLeft: [null],
      idFront: ['', Validators.required],
      idBack: ['', Validators.required],
      profilePicture: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDistributors();
  }

  loadDistributors(): void {
    this.distributorService.getDistributors().subscribe({
      next: (data) => {
        this.distributors.set(data);
        this.isLoadingDistributors = false;
      },
      error: () => {
        this.isLoadingDistributors = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load distributors',
        });
      },
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.distributorForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  minLengthArrayValidator(min: number): ValidatorFn {
    return (control: AbstractControl) =>
      Array.isArray(control.value) && control.value.length >= min
        ? null
        : { minlength: true };
  }

  getFullName = computed(
    () =>
      (d: Distributor): string =>
        `${d.firstName} ${d.middleName ? d.middleName + ' ' : ''}${d.lastName}`
  );

  showDialog(distributor?: Distributor): void {
    this.distributorForm.reset();
    this.fileMap.clear();

    if (distributor) {
      this.isEditing.set(true);
      this.selectedDistributor.set(distributor);
      this.distributorForm.patchValue({
        ...distributor,
        dateJoined: this.toDate(distributor.dateJoined),
        dateLeft: this.toDate(distributor.dateLeft),
      });
    } else {
      this.isEditing.set(false);
      this.selectedDistributor.set(null);
    }

    this.visibleDialog.set(true);
  }

  private toDate(value: any): Date | null {
    if (!value) return null;

    if (value.seconds !== undefined) {
      return new Date(value.seconds * 1000);
    }

    if (value instanceof Date) {
      return value;
    }

    return null;
  }


  hideDialog(): void {
    this.visibleDialog.set(false);
    this.isEditing.set(false);
    this.selectedDistributor.set(null);
    this.distributorForm.reset();
    this.fileMap.clear();
  }

  async saveDistributor(): Promise<void> {
    if (this.distributorForm.invalid) {
      this.distributorForm.markAllAsTouched();
      return;
    }

    this.isSavingDistributor = true;

    const formValue = this.distributorForm.value;

    const distributor: Distributor = {
      ...formValue,
      id: this.isEditing()
        ? this.selectedDistributor()!.id
        : Date.now(),
      fullName: this.getFullName()(formValue as any),
    };

    try {
      if (this.isEditing()) {
        await this.distributorService.updateDistributor(distributor);
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Distributor updated successfully',
        });
      } else {
        await this.distributorService.createDistributor(distributor);
        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Distributor added successfully',
        });
      }

      this.hideDialog();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save distributor',
      });
    } finally {
      this.isSavingDistributor = false;
    }
  }

  deleteDistributor(distributor: Distributor): void {
    this.confirmationService.confirm({
      message: `Delete ${distributor.firstName} ${distributor.lastName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        this.isDeletingDistributor.set(true);
        try {
          await this.distributorService.deleteDistributor(distributor.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Distributor removed',
          });
        } finally {
          this.isDeletingDistributor.set(false);
        }
      },
    });
  }

  editDistributor(distributor: Distributor): void {
    this.showDialog(distributor);
  }

  viewImage(url: string): void {
    this.selectedImageUrl.set(url);
    this.visibleImageModal = true;
  }

  async onFileChange(event: Event, controlName: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImageFile(file, 1);

      this.distributorForm.patchValue({
        [controlName]: base64
      });

    } catch (error) {
      console.error('Image compression failed', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Image Error',
        detail: 'Failed to process image. Please try another one.'
      });
    }
  }

  getPreviewUrl(controlName: string): string | null {
    return this.distributorForm.get(controlName)?.value || null;
  }


  onClearImage(controlName: string): void {
    this.distributorForm.patchValue({ [controlName]: '' });

    const input = document.getElementById(controlName) as HTMLInputElement;
    if (input) input.value = '';
  }



}
