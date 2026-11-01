'use client';

import { use } from 'react';
import { RequireAuth } from '@/components/Auth';
import { ProjectApp } from '@/components/ProjectApp';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireAuth><ProjectApp id={id} /></RequireAuth>;
}
