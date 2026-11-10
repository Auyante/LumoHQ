'use client';

import React, { useState } from 'react';
import { MasterTemplateView } from '@/components/template/MasterTemplateView';
import { BarberOwnerPanel, type BarberAppointment } from '@/components/demos/BarberOwnerPanel';
import { barberiaDemoConfig } from '@/lib/demo-data';

const initialAppointments: BarberAppointment[] = [
  {
    id: 'apt-1',
    clientName: 'Carlos G.',
    clientPhone: '+1 (432) 555-0192',
    service: 'Corte Clásico + Barba',
    barber: 'Mateo (Barbero Principal)',
    date: 'Hoy',
    time: '11:30 AM',
    price: 35,
    status: 'Confirmada',
    createdAt: '2026-11-08T09:00:00Z',
  },
  {
    id: 'apt-2',
    clientName: 'Miguel R.',
    clientPhone: '+1 (432) 555-0144',
    service: 'Corte Ejecutivo & Fade',
    barber: 'Mateo (Barbero Principal)',
    date: 'Hoy',
    time: '01:00 PM',
    price: 40,
    status: 'Confirmada',
    createdAt: '2026-11-08T09:30:00Z',
  },
  {
    id: 'apt-3',
    clientName: 'Roberto D.',
    clientPhone: '+1 (432) 555-0188',
    service: 'Perfilado de Barba y Toalla Caliente',
    barber: 'Mateo (Barbero Principal)',
    date: 'Hoy',
    time: '02:30 PM',
    price: 30,
    status: 'Confirmada',
    createdAt: '2026-11-08T10:00:00Z',
  },
];

export default function BarberiaDemoPage() {
  const [viewMode, setViewMode] = useState<'client' | 'owner'>('client');
  const [appointments, setAppointments] = useState<BarberAppointment[]>(initialAppointments);

  const handleUpdateStatus = (id: string, newStatus: BarberAppointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
  };

  const toggleView = () => {
    setViewMode((prev) => (prev === 'client' ? 'owner' : 'client'));
  };

  if (viewMode === 'owner') {
    return (
      <BarberOwnerPanel
        appointments={appointments}
        onUpdateStatus={handleUpdateStatus}
        onBackToClient={() => setViewMode('client')}
      />
    );
  }

  return (
    <MasterTemplateView
      config={barberiaDemoConfig}
      ownerToggle={{
        isOwnerView: false,
        appointmentCount: appointments.length,
        onToggle: toggleView,
      }}
    />
  );
}
