'use client';
import React from 'react';

type Props = {
  mode?: 'candidate' | 'recruiter';
  children?: React.ReactNode;
};

// Componente neutro: non rende nulla, zero effetti.
export default function MouseGlow(_props: Props) {
  return null;
}
