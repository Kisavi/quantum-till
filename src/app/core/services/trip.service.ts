// src/app/services/trip.service.ts

import { Injectable } from '@angular/core';
import { Trip, CreateTripDto, EndTripDto } from '../models/trip';
import { Vehicle } from '../models/vehicle';
import { Route } from '../models/route';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private trips: Trip[] = [
    {
      id: 't1',
      userId: 'driver1',
      driverName: 'John A Doe',
      route: { id: '2', name: 'Mombasa' },
      vehicle: { id: 'v1', regNo: 'KCK 9039', model: 'Mazda Demio' },
      startOdometerReading: 54320,
      endOdometerReading: 54890,
      startTime: new Date('2025-04-05T07:30:00'),
      endTime: new Date('2025-04-05T16:45:00'),
      totalKm: 570,
      durationMinutes: 555,
      status: 'ENDED',
    }
  ];

  routes: Route[] = [
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

  get currentUser() {
    return { uid: 'driver1', name: 'John A Doe' };
  }

  // 1. Create Trip → PENDING
  createTrip(dto: CreateTripDto): Trip {
    const route = this.routes.find(r => r.id === dto.routeId)!;
    const vehicle = this.vehicles.find(v => v.id === dto.vehicleId)!;

    const newTrip: Trip = {
      id: 't' + Date.now(),
      userId: this.currentUser.uid,
      driverName: this.currentUser.name,
      route,
      vehicle,
      startOdometerReading: dto.startOdometerReading,
      startTime: new Date(), // planned time
      status: 'PENDING'
    };

    this.trips.unshift(newTrip);
    return newTrip;
  }

  // 2. Start Trip → ONGOING
  startTrip(tripId: string): Trip {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip || trip.status !== 'PENDING') {
      throw new Error('Trip cannot be started');
    }

    trip.status = 'ONGOING';
    trip.startTime = new Date(); // actual start time
    return trip;
  }

  // 3. End Trip → ENDED
  endTrip(tripId: string, dto: EndTripDto): Trip {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip || trip.status !== 'ONGOING') {
      throw new Error('Trip not ongoing');
    }

    if (dto.endOdometerReading <= trip.startOdometerReading) {
      throw new Error('End odometer must be greater');
    }

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - trip.startTime.getTime()) / 60000);
    const totalKm = dto.endOdometerReading - trip.startOdometerReading;

    Object.assign(trip, {
      endOdometerReading: dto.endOdometerReading,
      endTime,
      totalKm,
      durationMinutes,
      status: 'ENDED' as const
    });

    return trip;
  }

  getTrips(): Trip[] {
    return [...this.trips];
  }

  hasOngoingTrip(userId: string): boolean {
    return this.trips.some(t => t.userId === userId && t.status === 'ONGOING');
  }

  hasPendingTrip(userId: string): boolean {
    return this.trips.some(t => t.userId === userId && t.status === 'PENDING');
  }
}