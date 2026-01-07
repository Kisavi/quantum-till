import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Timestamp } from '@angular/fire/firestore';
import { map, Subscription } from 'rxjs';

import { Distributor } from '../../core/models/distributor';
import { DistributorService } from '../../core/services/distributors.service';
import { compressImageFile } from '../../core/helpers/image-helpers';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';
import { AssetsService } from '../../core/services/assets.service';
import { DistributionRouteService } from '../../core/services/distribution-route.service';
import { Asset } from '../../core/models/assets';
import { Vehicle } from '../../core/models/vehicle';
import { DistributionRoute } from '../../core/models/distribution-route';
import { RoleName } from '../../core/models/role-name';

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
export class DistributorsComponent implements OnInit, OnDestroy {
  private distributorService = inject(DistributorService);
  private assetService = inject(AssetsService);
  private distributionRouteService = inject(DistributionRouteService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  distributors = signal<Distributor[]>([]);

  isLoadingDistributors = true;
  isSavingDistributor = false;
  isDeletingDistributor = signal(false);
  loadingVehicles = true;

  visibleDialog = signal(false);
  isEditing = signal(false);
  selectedDistributor = signal<Distributor | null>(null);

  visibleImageModal = false;
  selectedImageUrl = signal('');

  distributorForm: FormGroup;

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  roles: { label: string; value: RoleName }[] = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Rider', value: 'RIDER' },
    { label: 'Cook', value: 'COOK' }
  ];

  vehicles: Vehicle[] = [];
  routes: DistributionRoute[] = [];

  private distributorsSubscription?: Subscription;
  private assetsSubscription?: Subscription;
  private routesSubscription?: Subscription;

  constructor() {
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
      dateJoined: [null, Validators.required],
      dateLeft: [null],
      idFront: ['', Validators.required],
      idBack: ['', Validators.required],
      profilePicture: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDistributors();
    this.loadVehicles();
    this.loadRoutes();
  }

  ngOnDestroy(): void {
    this.distributorsSubscription?.unsubscribe();
    this.assetsSubscription?.unsubscribe();
    this.routesSubscription?.unsubscribe();
  }

  loadDistributors(): void {
    this.isLoadingDistributors = true;
    this.distributorsSubscription = this.distributorService.getDistributors().subscribe({
      next: (distributors) => {
        this.distributors.set(distributors);
        this.isLoadingDistributors = false;
      },
      error: (error) => {
        console.error('Error loading distributors:', error);
        this.isLoadingDistributors = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load distributors',
        });
      },
    });
  }

  private loadVehicles(): void {
    this.assetsSubscription = this.assetService.getAssets().pipe(
      map(assets => assets.filter(asset => asset.category === 'Vehicle'))
    ).subscribe({
      next: (vehicleAssets: Asset[]) => {
        this.vehicles = vehicleAssets.map(asset => ({
          id: asset.id,
          regNo: asset.name,
          model: asset.model || ''
        }));
        this.loadingVehicles = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.loadingVehicles = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load vehicles'
        });
      }
    });
  }

  private loadRoutes(): void {
    this.routesSubscription = this.distributionRouteService.getDistributionRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
      },
      error: (error) => {
        console.error('Error loading routes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load routes'
        });
      }
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
    this.distributorForm.reset({ status: 'active', dateJoined: new Date() });

    if (distributor) {
      this.isEditing.set(true);
      this.selectedDistributor.set(distributor);
      
      // Convert Firestore Timestamps to Date for form
      const dateJoined = this.toDate(distributor.dateJoined);
      const dateLeft = distributor.dateLeft ? this.toDate(distributor.dateLeft) : null;

      this.distributorForm.patchValue({
        ...distributor,
        dateJoined: dateJoined,
        dateLeft: dateLeft,
      });

      // Clear validators for images when editing (images are already uploaded)
      this.distributorForm.get('idFront')?.clearValidators();
      this.distributorForm.get('idBack')?.clearValidators();
      this.distributorForm.get('profilePicture')?.clearValidators();
      this.distributorForm.get('idFront')?.updateValueAndValidity();
      this.distributorForm.get('idBack')?.updateValueAndValidity();
      this.distributorForm.get('profilePicture')?.updateValueAndValidity();
    } else {
      this.isEditing.set(false);
      this.selectedDistributor.set(null);

      // Require images when creating
      this.distributorForm.get('idFront')?.setValidators([Validators.required]);
      this.distributorForm.get('idBack')?.setValidators([Validators.required]);
      this.distributorForm.get('profilePicture')?.setValidators([Validators.required]);
      this.distributorForm.get('idFront')?.updateValueAndValidity();
      this.distributorForm.get('idBack')?.updateValueAndValidity();
      this.distributorForm.get('profilePicture')?.updateValueAndValidity();
    }

    this.visibleDialog.set(true);
  }

  private toDate(value: any): Date | null {
    if (!value) return null;

    // Firestore Timestamp
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // ISO string
    if (typeof value === 'string') {
      return new Date(value);
    }

    // Already a Date
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
  }

  async saveDistributor(): Promise<void> {
    if (this.distributorForm.invalid) {
      this.distributorForm.markAllAsTouched();
      return;
    }

    this.isSavingDistributor = true;

    try {
      const formValue = this.distributorForm.value;

      // Generate full name
      const fullName = `${formValue.firstName} ${formValue.middleName ? formValue.middleName + ' ' : ''}${formValue.lastName}`.trim();

      if (this.isEditing() && this.selectedDistributor()) {
        // UPDATE
        const updateData: any = {
          firstName: formValue.firstName,
          middleName: formValue.middleName || null,
          lastName: formValue.lastName,
          fullName: fullName,
          idNumber: formValue.idNumber,
          phone: formValue.phone,
          email: formValue.email,
          role: formValue.role,
          carAssigned: formValue.carAssigned,
          routesAssigned: formValue.routesAssigned,
          status: formValue.status,
          dateJoined: Timestamp.fromDate(new Date(formValue.dateJoined)),
          dateLeft: formValue.dateLeft ? Timestamp.fromDate(new Date(formValue.dateLeft)) : null,
        };

        // Only update images if new ones were uploaded
        if (formValue.idFront) updateData.idFront = formValue.idFront;
        if (formValue.idBack) updateData.idBack = formValue.idBack;
        if (formValue.profilePicture) updateData.profilePicture = formValue.profilePicture;

        await this.distributorService.updateDistributor(
          String(this.selectedDistributor()!.id),
          updateData
        );

        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Distributor updated successfully',
        });
      } else {
        const distributorData = {
          firstName: formValue.firstName,
          middleName: formValue.middleName || null,
          lastName: formValue.lastName,
          fullName: fullName,
          idNumber: formValue.idNumber,
          phone: formValue.phone,
          email: formValue.email,
          role: formValue.role,
          carAssigned: formValue.carAssigned,
          routesAssigned: formValue.routesAssigned,
          status: formValue.status,
          dateJoined: Timestamp.fromDate(new Date(formValue.dateJoined)),
          dateLeft: formValue.dateLeft ? Timestamp.fromDate(new Date(formValue.dateLeft)) : null,
          idFront: formValue.idFront,
          idBack: formValue.idBack,
          profilePicture: formValue.profilePicture,
          createdAt: Timestamp.now()
        };

        await this.distributorService.addDistributor(distributorData);

        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Distributor added successfully',
        });
      }

      this.hideDialog();
    } catch (error) {
      console.error('Error saving distributor:', error);
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
          await this.distributorService.deleteDistributor(String(distributor.id));
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Distributor removed',
          });
        } catch (error) {
          console.error('Error deleting distributor:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete distributor',
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
      this.distributorForm.patchValue({ [controlName]: base64 });
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