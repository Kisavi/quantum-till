import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { Trip, CreateTripDto, EndTripDto } from '../../core/models/trip';
import { TripService } from '../../core/services/trip.service';
import { DistributionRoute } from '../../core/models/distribution-route';
import { Vehicle } from '../../core/models/vehicle';

import { Auth } from '@angular/fire/auth';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    CardModule,
    ToastModule,
    Tooltip,
    TimestampMillisPipe
  ],
  providers: [MessageService],
  templateUrl: './trips.component.html',
})
export class TripsComponent implements OnInit {
  private auth = inject(Auth);

  trips: Trip[] = [];
  distributors: User[] = [];
  routes: DistributionRoute[] = [
    { id: '1', name: 'Mariakani' },
    { id: '2', name: 'Mombasa' },
    { id: '3', name: 'Kilifi' },
    { id: '4', name: 'Lamu' },
  ];

  vehicles: Vehicle[] = [
    { id: 'v1', regNo: 'KCK 9039', model: 'Mazda Demio' },
    { id: 'v2', regNo: 'KDB 9045', model: 'Mazda Demio' },
    { id: 'v3', regNo: 'KCB 123A', model: 'Toyota Probox' },
  ];

  /** Loading flags */
  isLoadingTrips = false;
  isCreatingTrip = false;
  isStartingTrip = false;
  isEndingTrip = false;

  /** Dialogs */
  visibleCreateDialog = false;
  visibleStartDialog = false;
  visibleEndDialog = false;

  selectedTrip: Trip | null = null;

  createForm!: FormGroup;
  endForm!: FormGroup;
  private userService = inject(UserService)

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadTrips();
    this.getUsersExcludingCooks();
  }

  getUsersExcludingCooks(): void {
    this.userService.getUsersExcludingRole('COOK').subscribe({
      next: (users: User[]) => {
        this.distributors = users.filter(u => u.active && u.valid);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
      }
    });
  }


  private initForms(): void {
    this.createForm = this.fb.group({
      userId: ['', Validators.required],
      routeId: ['', Validators.required],
      vehicleId: ['', Validators.required],
      startOdometerReading: [null, [Validators.required, Validators.min(1)]],
    });

    this.endForm = this.fb.group({
      endOdometerReading: [null, [Validators.required, Validators.min(1)]],
    });
  }

  /** LOAD TRIPS */
  loadTrips(): void {
    this.isLoadingTrips = true;

    this.tripService.getAllTrips().subscribe({
      next: trips => {
        this.trips = trips;
        console.log(trips);
        this.isLoadingTrips = false;
      },
      error: () => {
        this.isLoadingTrips = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load trips'
        });
      }
    });
  }

  /** State helpers */
  get hasOngoingTrip(): boolean {
    return this.trips.some(t => t.status === 'ONGOING');
  }

  get hasPendingTrip(): boolean {
    return this.trips.some(t => t.status === 'PENDING');
  }

  /** CREATE */
  showCreateDialog(): void {
    this.createForm.reset();
    this.visibleCreateDialog = true;
  }

  async createTrip(): Promise<void> {
    if (this.createForm.invalid) return;

    this.isCreatingTrip = true;

    const dto = this.createForm.value;
    const route = this.routes.find(r => r.id === dto.routeId)!;
    const vehicle = this.vehicles.find(v => v.id === dto.vehicleId)!;
    const selectedUser = this.distributors.find(u => u.uid === dto.userId);
    console.log(selectedUser);
    if (!selectedUser) return;

    const trip: CreateTripDto = {
      userId: selectedUser.uid,
      driverName: selectedUser.displayName || '',
      route,
      vehicle,
      startOdometerReading: dto.startOdometerReading,
      status: 'PENDING',
      createdOn: new Date()
    };

    try {
      await this.tripService.createTrip(trip);
      this.messageService.add({
        severity: 'success',
        summary: 'Trip Created',
        detail: 'Ready to start!'
      });
      this.visibleCreateDialog = false;
    } finally {
      this.isCreatingTrip = false;
    }
  }

  showStartDialog(trip: Trip): void {
    if (trip.status !== 'PENDING') return;
    this.selectedTrip = trip;
    this.visibleStartDialog = true;
  }

  async startTrip(): Promise<void> {
    if (!this.selectedTrip) return;

    this.isStartingTrip = true;

    await this.tripService.updateTrip(this.selectedTrip.id!, {
      status: 'ONGOING',
      startTime: new Date()
    });

    this.visibleStartDialog = false;
    this.isStartingTrip = false;
  }


  showEndDialog(trip: Trip): void {
    if (trip.status !== 'ONGOING') return;
    this.selectedTrip = trip;
    this.endForm.patchValue({
      endOdometerReading: null
    });
    this.visibleEndDialog = true;
  }

  async endTrip(): Promise<void> {
    if (!this.selectedTrip || this.endForm.invalid) return;


    const endReading = this.endForm.value.endOdometerReading;
    if (!endReading || endReading <= this.selectedTrip.startOdometerReading) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Odometer',
        detail: 'End odometer must be greater than start odometer.'
      });
      return;
    }
    this.isEndingTrip = true;

    const endTime = new Date();
    const totalKm = endReading - this.selectedTrip.startOdometerReading;

    const durationMinutes = Math.round(
      (endTime.getTime() - new Date(this.selectedTrip.startTime).getTime()) / 60000
    );

    await this.tripService.updateTrip(this.selectedTrip.id!, {
      endOdometerReading: endReading,
      endTime,
      totalKm,
      durationMinutes,
      status: 'ENDED'
    });

    this.visibleEndDialog = false;
    this.isEndingTrip = false;
  }

  /** UI helpers */
  getStatusClass(status: Trip['status']) {
    switch (status) {
      case 'PENDING': return 'px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs';
      case 'ONGOING': return 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs';
      case 'ENDED': return 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs';
      default: return '';
    }
  }

getDuration(start: any, end: any): string {
  if (!start || !end) return '—';

  // Convert Firestore Timestamp or Date to milliseconds
  const startMs = start.seconds ? start.seconds * 1000 : start.getTime();
  const endMs = end.seconds ? end.seconds * 1000 : end.getTime();

  let diffMs = endMs - startMs;
  if (diffMs < 0) return '—'; 

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '1m';
  }
}


}
