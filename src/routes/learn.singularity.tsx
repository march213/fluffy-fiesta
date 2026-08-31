import { SingularityLab } from '@/components/singularity_lab'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/learn/singularity')({
  component: SingularityLab,
})
