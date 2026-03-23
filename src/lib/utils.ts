import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateConsistencyDNA(stats: any[]): string {
  if (stats.length < 5) return "Irregular";
  
  const activeDays = stats.filter(s => s.totalSolved > 0).length;
  const ratio = activeDays / stats.length;
  
  if (ratio > 0.8) return "Consistent";
  if (ratio > 0.5) return "Burst coder";
  
  // Check if active days are mostly weekends
  const weekendActive = stats.filter(s => {
    const day = new Date(s.date).getDay();
    return (day === 0 || day === 6) && s.totalSolved > 0;
  }).length;
  
  if (weekendActive / activeDays > 0.7) return "Weekend coder";
  
  return "Irregular";
}
