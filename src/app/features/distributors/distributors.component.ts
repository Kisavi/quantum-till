import { Component, signal, computed } from '@angular/core';
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
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './distributors.component.html',
})
export class DistributorsComponent {
  distributors = signal<Distributor[]>([
    {
      id: 1,
      fullName: 'John A Doe',
      firstName: 'John',
      middleName: 'A',
      lastName: 'Doe',
      idNumber: '12345678',
      phone: '0700123456',
      email: 'john.doe@bakingpos.com',
      role: 'driver',
      carAssigned: 'mazda-kck-9039',
      routesAssigned: ['mariakani', 'mombasa'],
      idFront: 'idFrontSample.jpeg',
      idBack: 'idBackSample.png',
      profilePicture: 'jomo.jpeg',
      status: 'active',
      dateJoined: new Date('2025-01-15'),
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      idNumber: '87654321',
      phone: '0711789012',
      email: 'jane.smith@bakingpos.com',
      role: 'sales_person',
      carAssigned: 'mazda-kdb-9045',
      routesAssigned: ['kilifi'],
      idFront: 'idFrontSample.jpeg',
      idBack: 'idBackSample.png',
      profilePicture: 'jomo.jpeg',
      status: 'inactive',
      dateJoined: new Date('2025-02-20'),
      dateLeft: new Date('2025-10-01'),
    },
  ]);

  visibleDialog = signal(false);
  isEditing = signal(false);
  selectedDistributor = signal<Distributor | null>(null);

  visibleImageModal = false;
  selectedImageUrl = signal('');

  distributorForm: FormGroup;

  // Map to hold file + preview URL (used for both new uploads and existing images)
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

      // These hold filenames only (for validation + fallback)
      idFront: ['', Validators.required],
      idBack: ['', Validators.required],
      profilePicture: ['', Validators.required],
    });
  }

  // Helper: check if control is invalid and touched/dirty
  isInvalid(controlName: string): boolean {
    const control = this.distributorForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // Custom validator for multi-select (at least 1 item)
  minLengthArrayValidator(min: number): ValidatorFn {
    return (control: AbstractControl) => {
      return Array.isArray(control.value) && control.value.length >= min
        ? null
        : { minlength: true };
    };
  }

  // Full name computed for table
  getFullName = computed(
    () =>
      (d: Distributor): string =>
        `${d.firstName} ${d.middleName ? d.middleName + ' ' : ''}${d.lastName}`
  );

  // Open dialog — Add or Edit
  showDialog(distributor?: Distributor): void {
    this.distributorForm.reset();
    this.fileMap.clear(); // Always start fresh

    if (distributor) {
      this.isEditing.set(true);
      this.selectedDistributor.set(distributor);

      this.distributorForm.patchValue({
        firstName: distributor.firstName,
        middleName: distributor.middleName || '',
        lastName: distributor.lastName,
        idNumber: distributor.idNumber,
        phone: distributor.phone,
        email: distributor.email,
        role: distributor.role,
        carAssigned: distributor.carAssigned,
        routesAssigned: distributor.routesAssigned || [],
        status: distributor.status,
        dateJoined: distributor.dateJoined,
        dateLeft: distributor.dateLeft || null,
        idFront: distributor.idFront,
        idBack: distributor.idBack,
        profilePicture: distributor.profilePicture,
      });

      // Pre-load existing images into preview map
      this.fileMap.set('idFront', { file: null, url: `/assets/img/${distributor.idFront}` });
      this.fileMap.set('idBack', { file: null, url: `/assets/img/${distributor.idBack}` });
      this.fileMap.set('profilePicture', {
        file: null,
        url: `/assets/img/${distributor.profilePicture}`,
      });
    } else {
      this.isEditing.set(false);
      this.selectedDistributor.set(null);
      this.distributorForm.reset({
        firstName: '',
        middleName: '',
        lastName: '',
        idNumber: '',
        phone: '',
        email: '',
        role: '',
        carAssigned: '',
        routesAssigned: [],
        status: 'active',
        dateJoined: new Date(),
        dateLeft: null,
        idFront: '',
        idBack: '',
        profilePicture: '',
      });
    }

    this.visibleDialog.set(true);
  }

  hideDialog(): void {
    this.visibleDialog.set(false);
    this.distributorForm.reset();
    this.fileMap.clear();
    this.isEditing.set(false);
    this.selectedDistributor.set(null);
  }

  // File selected → store file + create object URL
  onFileChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const url = URL.createObjectURL(file);
      this.fileMap.set(controlName, { file, url });
      this.distributorForm.get(controlName)?.setValue(file.name);
    }
  }

  // Clear uploaded image
  onClearImage(controlName: string): void {
    this.fileMap.set(controlName, { file: null, url: null });
    this.distributorForm.get(controlName)?.setValue('');
    const input = document.getElementById(controlName) as HTMLInputElement;
    if (input) input.value = '';
  }

  // Return preview URL (new upload OR existing image)
  getPreviewUrl(controlName: string): string | null {
    // 1. New upload → object URL
    const uploaded = this.fileMap.get(controlName);
    if (uploaded?.url) return uploaded.url;

    // 2. Existing saved image → static asset path
    const fileName = this.distributorForm.get(controlName)?.value;
    return fileName ? `/assets/img/${fileName}` : null;
  }

  // Image viewer modal
  viewImage(url: string): void {
    this.selectedImageUrl.set(url);
    this.visibleImageModal = true; 
  }

  // Save (Add or Update)
  saveDistributor(): void {
    if (this.distributorForm.invalid) {
      this.distributorForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please correct the errors in the form.',
      });
      return;
    }

    const formValue = this.distributorForm.value;

    const distributor: Distributor = {
      id: this.isEditing() ? this.selectedDistributor()!.id : Date.now(),
      firstName: formValue.firstName,
      middleName: formValue.middleName?.trim() || undefined,
      lastName: formValue.lastName,
      fullName: this.getFullName()(formValue as any), // reuse computed logic
      idNumber: formValue.idNumber,
      phone: formValue.phone,
      email: formValue.email,
      role: formValue.role,
      carAssigned: formValue.carAssigned,
      routesAssigned: formValue.routesAssigned,
      status: formValue.status,
      dateJoined: new Date(formValue.dateJoined),
      dateLeft: formValue.dateLeft ? new Date(formValue.dateLeft) : undefined,

      // Use new filename if uploaded file name, otherwise keep old one
      idFront:
        this.fileMap.get('idFront')?.file?.name || formValue.idFront,
      idBack:
        this.fileMap.get('idBack')?.file?.name || formValue.idBack,
      profilePicture:
        this.fileMap.get('profilePicture')?.file?.name ||
        formValue.profilePicture,
    };

    if (this.isEditing()) {
      this.distributors.update((list) =>
        list.map((d) => (d.id === distributor.id ? distributor : d))
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Distributor updated successfully',
      });
    } else {
      this.distributors.update((list) => [...list, distributor]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Distributor added successfully',
      });
    }

    this.hideDialog();
  }

  editDistributor(distributor: Distributor): void {
    this.showDialog(distributor);
  }

  deleteDistributor(distributor: Distributor): void {
    this.confirmationService.confirm({
      message: `Delete ${distributor.firstName} ${distributor.lastName}? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.distributors.update((list) =>
          list.filter((d) => d.id !== distributor.id)
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Distributor removed',
        });
      },
    });
  }
}