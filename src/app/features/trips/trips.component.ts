// src/app/trips/trips.component.ts

import { Component, OnInit } from '@angular/core';
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
import { Route } from '../../core/models/route';
import { Vehicle } from '../../core/models/vehicle';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, TableModule,
    DialogModule, InputTextModule, SelectModule, CardModule,
    ToastModule, Tooltip
  ],
  providers: [MessageService],
  templateUrl: './trips.component.html',
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  routes: Route[] = [];
  vehicles: Vehicle[] = [];


  // Dialogs
  visibleCreateDialog = false;
  visibleStartDialog = false;
  visibleEndDialog = false;
  selectedTrip: Trip | null = null;

  createForm!: FormGroup;
  endForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadTrips();
      this.routes = this.tripService.routes;
  this.vehicles = this.tripService.vehicles;
  }

  private initForms(): void {
    this.createForm = this.fb.group({
      routeId: ['', Validators.required],
      vehicleId: ['', Validators.required],
      startOdometerReading: [null, [Validators.required, Validators.min(1)]],
    });

    this.endForm = this.fb.group({
      endOdometerReading: [null, [Validators.required, Validators.min(1)]],
    });
  }

  loadTrips(): void {
    this.trips = this.tripService.getTrips();
  }

  get hasOngoingTrip(): boolean {
    return this.tripService.hasOngoingTrip(this.tripService.currentUser.uid);
  }

  get hasPendingTrip(): boolean {
    return this.tripService.hasPendingTrip(this.tripService.currentUser.uid);
  }

  // CREATE TRIP
  showCreateDialog(): void {
    if (this.hasOngoingTrip || this.hasPendingTrip) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Create',
        detail: 'You already have a pending or ongoing trip.',
      });
      return;
    }
    this.createForm.reset();
    this.visibleCreateDialog = true;
  }

  createTrip(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload: CreateTripDto = this.createForm.value;
    this.tripService.createTrip(payload);
    this.messageService.add({ severity: 'success', summary: 'Trip Created', detail: 'Ready to start!' });
    this.visibleCreateDialog = false;
    this.loadTrips();
  }

  // START TRIP (from PENDING)
  showStartDialog(trip: Trip): void {
    if (trip.status !== 'PENDING') return;
    this.selectedTrip = trip;
    this.visibleStartDialog = true;
  }

  startTrip(): void {
    if (!this.selectedTrip) return;
    this.tripService.startTrip(this.selectedTrip.id);
    this.messageService.add({ severity: 'success', summary: 'On the Road!', detail: 'Trip started successfully' });
    this.visibleStartDialog = false;
    this.loadTrips();
  }

  // END TRIP
  showEndDialog(trip: Trip): void {
    if (trip.status !== 'ONGOING') return;
    this.selectedTrip = trip;
    this.endForm.patchValue({
      endOdometerReading: trip.startOdometerReading + 200
    });
    this.visibleEndDialog = true;
  }

  endTrip(): void {
    if (this.endForm.invalid || !this.selectedTrip) {
      this.endForm.markAllAsTouched();
      return;
    }

    const payload: EndTripDto = this.endForm.value;
    this.tripService.endTrip(this.selectedTrip.id, payload);
    this.messageService.add({ severity: 'success', summary: 'Trip Ended', detail: 'Well done!' });
    this.visibleEndDialog = false;
    this.loadTrips();
  }

  getStatusClass(status: Trip['status']) {
    switch (status) {
      case 'PENDING': return 'px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium';
      case 'ONGOING': return 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium';
      case 'ENDED': return 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium';
      default: return 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs';
    }
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}