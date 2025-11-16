import { Component, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';

interface Distributor {
  id: number;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  role: 'driver' | 'sales_person';
  carAssigned: string;
  routesAssigned: string[];
  idFront: string;
  idBack: string;
  profilePicture: string;
  status: 'active' | 'inactive';
  dateJoined: Date;
  dateLeft?: Date;
}

interface Option {
  label: string;
  value: string;
}

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
    RadioButtonModule,
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
      phone: '0700123 456',
      email: 'john.doe@bakingpos.com',
      role: 'driver',
      carAssigned: 'mazda-kck-9039',
      routesAssigned: ['mariakani', 'mombasa'],
      idFront: 'idFrontSample.jpeg',
      idBack: 'idBackSample.png',
      profilePicture: 'jomo.jpeg',
      status: 'active' as const,
      dateJoined: new Date('2025-01-15'),
      dateLeft: undefined
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      firstName: 'Jane',
      middleName: undefined,
      lastName: 'Smith',
      idNumber: '87654321',
      phone: '0711789 012',
      email: 'jane.smith@bakingpos.com',
      role: 'sales_person',
      carAssigned: 'mazda-kdb-9045',
      routesAssigned: ['kilifi'],
      idFront: 'idFrontSample.jpeg',
      idBack: 'idBackSample.png',
      profilePicture: 'jomo.jpeg',
      status: 'inactive' as const,
      dateJoined: new Date('2025-02-20'),
      dateLeft: new Date('2025-10-01')
    }
  ]);

  selectedDistributor = signal<Distributor | null>(null);
  visibleDialog = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  visibleImageModal: boolean = false;

  distributorForm: FormGroup;
  private fileMap = new Map<string, { file: File | null; url: string | null }>();  

selectedImageUrl = signal<string>('');  

  roleOptions: Option[] = [
    { label: 'Driver', value: 'driver' },
    { label: 'Sales Person', value: 'sales_person' }
  ];

  carOptions: Option[] = [
    { label: 'Mazda - KCK 9039', value: 'mazda-kck-9039' },
    { label: 'Mazda - KDB 9045', value: 'mazda-kdb-9045' },
    { label: 'Probox - KCB 9043', value: 'probox-kcb-9043' }
  ];

  routeOptions: Option[] = [
    { label: 'Mariakani', value: 'mariakani' },
    { label: 'Mombasa', value: 'mombasa' },
    { label: 'Kilifi', value: 'kilifi' },
    { label: 'Lamu', value: 'lamu' }
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  status = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.distributorForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: ['', [Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      idNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      carAssigned: ['', Validators.required],
      routesAssigned: [[], [this.minLengthArrayValidator(1)]],
      idFront: ['', Validators.required],
      idBack: ['', Validators.required],
      profilePicture: ['', Validators.required],
      status: ['', Validators.required],
      dateJoined: [new Date(), Validators.required],
      dateLeft: ['']
    });
  }

  isInvalid(controlName: string): boolean {
  const control = this.distributorForm.get(controlName);
  return !!control && (control.invalid && (control.dirty || control.touched));
}

getErrorMessage(controlName: string): string {
  const control = this.distributorForm.get(controlName);
  if (control?.errors?.['required']) return 'This field is required.';
  if (control?.errors?.['email']) return 'Please enter a valid email.';
  if (control?.errors?.['minlength']) return 'Minimum length is 2 characters.';
  if (control?.errors?.['pattern']) return 'Invalid format.';
  if (controlName === 'routesAssigned' && control?.errors?.['minlength']) return 'At least one route is required.';
  return '';
}

  minLengthArrayValidator(min: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return control.value.length >= min ? null : { minlength: { requiredLength: min, actualLength: control.value.length } };
    };
  }

  showDialog(distributor?: Distributor): void {
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
        routesAssigned: distributor.routesAssigned,
        idFront: distributor.idFront,
        idBack: distributor.idBack,
        profilePicture: distributor.profilePicture,
        status: distributor.status,
        dateJoined: distributor.dateJoined,
        dateLeft: distributor.dateLeft || ''
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
        idFront: '',
        idBack: '',
        profilePicture: '',
        status: 'active',
        dateJoined: new Date(),
        dateLeft: ''
      });
    }
    this.visibleDialog.set(true);
  }

  hideDialog(): void {
    this.visibleDialog.set(false);
    this.distributorForm.reset();
    this.isEditing.set(false);
    this.selectedDistributor.set(null);
  }

onFileChange(event: any, controlName: string): void {
  const file = event.target?.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    this.fileMap.set(controlName, { file, url });
    this.distributorForm.get(controlName)?.setValue(file.name);
  } else {
    this.fileMap.set(controlName, { file: null, url: null });
    this.distributorForm.get(controlName)?.setValue('');
  }
}

getPreviewUrl(controlName: string): string | null {
  const fromMap = this.fileMap.get(controlName)?.url;
  if (fromMap) return fromMap;

  const controlValue = this.distributorForm.get(controlName)?.value;
  if (controlValue) {
    // adjust if you store full URLs instead of just file names
    return '/assets/img/' + controlValue;
  }

  return null;
}


onClearImage(controlName: string): void {
  this.fileMap.set(controlName, { file: null, url: null });
  this.distributorForm.get(controlName)?.setValue('');
  // Reset file input
  const input = document.getElementById(controlName) as HTMLInputElement;
  if (input) input.value = '';
}

viewImage(url: string): void {
  this.selectedImageUrl.set(url);
  this.visibleImageModal = true;
}

closeImageModal(): void {
  this.selectedImageUrl.set('');
}

  saveDistributor(): void {
    if (this.distributorForm.invalid) {
      console.log('Form is invalid');
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields correctly.' });
      this.distributorForm.markAllAsTouched();
      return;
    }

    const formValue = this.distributorForm.value;
    const newDistributor: Distributor = {
      ...formValue,
      id: this.isEditing() ? this.selectedDistributor()!.id : this.distributors().length + 1,
      firstName: formValue.firstName,
      middleName: formValue.middleName || undefined,
      lastName: formValue.lastName,
      idNumber: formValue.idNumber,
      phone: formValue.phone,
      email: formValue.email,
      role: formValue.role as 'driver' | 'sales_person',
      carAssigned: formValue.carAssigned,
      routesAssigned: formValue.routesAssigned,
      idFront: formValue.idFront,
      idBack: formValue.idBack,
      profilePicture: formValue.profilePicture,
      status: formValue.status as 'active' | 'inactive',
      dateJoined: new Date(formValue.dateJoined),
      dateLeft: formValue.dateLeft ? new Date(formValue.dateLeft) : undefined
    };
    // 🔹 Pre-populate preview URLs for existing files
    this.fileMap.set('idFront', {
      file: null,
      url: '/assets/img/' + newDistributor.idFront
    });
    this.fileMap.set('idBack', {
      file: null,
      url: '/assets/img/' + newDistributor.idBack
    });
    this.fileMap.set('profilePicture', {
      file: null,
      url: '/assets/img/' + newDistributor.profilePicture
    });

    if (this.isEditing()) {
      this.distributors.update(distributors => 
        distributors.map(d => d.id === newDistributor.id ? newDistributor : d)
      );
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Distributor updated successfully.' });
    } else {
      this.distributors.update(distributors => [...distributors, newDistributor]);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Distributor added successfully.' });
    }

    this.hideDialog();
  }

  deleteDistributor(distributor: Distributor): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${distributor.firstName} ${distributor.lastName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.distributors.update(distributors => distributors.filter(d => d.id !== distributor.id));
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Distributor deleted successfully.' });
      }
    });
  }

  editDistributor(distributor: Distributor): void {
    this.showDialog(distributor);
  }
}