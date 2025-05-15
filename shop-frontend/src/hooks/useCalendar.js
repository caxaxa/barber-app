// src/hooks/useCalendar.js
import { useMemo } from 'react';

export function useCalendar(currentDate = new Date()) {
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the name of the current month
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
      new Date(year, month, 1)
    );
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1).getDay();
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create an array to store the days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return { 
      monthName, 
      days,
      today: currentDate.getDate()
    };
  }, [currentDate]);
  
  // Available days (for demo) - In a real app, this would come from a backend API
  const availableDays = useMemo(() => [3, 8, 12, 15, 19, 22, 26, 29], []);

  // Days of the week for the calendar
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return {
    ...calendarData,
    availableDays,
    daysOfWeek
  };
}