import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Generator de ID-uri temporare pentru operații optimiste/outbox
export function generateTempId(resourceType = 'resource') {
  const randomPart = Math.random().toString(36).slice(2, 10)
  const timePart = Date.now().toString(36)
  return `temp_${resourceType}_${timePart}_${randomPart}`
}
