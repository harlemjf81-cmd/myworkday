export const formatDateISO = (date: Date): string => {
  // Use local date components to avoid timezone shifts when only the date part is needed
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth is 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMonthName = (monthIndex: number, locale: string = 'es'): string => {
  const date = new Date();
  date.setDate(1); // Set day to 1st to avoid month overflow issues
  date.setMonth(monthIndex);
  return date.toLocaleString(locale, { month: 'long' });
};

export const getDaysInMonthGrid = (year: number, month: number): (Date | null)[] => {
  const days: (Date | null)[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Adjust startingDayOfWeek: 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
  let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  if (startingDayOfWeek === 0) { // Sunday
    startingDayOfWeek = 6; // Make Sunday the last day of the week (index 6)
  } else {
    startingDayOfWeek -= 1; // Shift Monday (1) to 0, Tuesday (2) to 1, etc.
  }

  // Add nulls for days from previous month to align the grid
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Add nulls for days from next month to fill the grid (optional, makes full weeks)
  // Grid aims for 6 weeks (42 cells) if needed, or at least fill current week.
  const totalGridCells = Math.ceil((startingDayOfWeek + lastDayOfMonth.getDate()) / 7) * 7;
  while(days.length < totalGridCells && days.length < 42) { // Max 42 cells (6 weeks)
    days.push(null);
  }
  // Ensure the grid isn't excessively long if totalGridCells calculation is off. Max 6 weeks typically.
  return days.slice(0, 42); 
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getWeeksInMonth = (dateForMonth: Date): { weekNumber: number; days: Date[] }[] => {
  const year = dateForMonth.getFullYear();
  const month = dateForMonth.getMonth();
  
  const weeksMap = new Map<string, Date[]>();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
    const currentDay = new Date(d);
    // getDay(): 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
    // We want weeks to start on Monday.
    const dayOfWeek = currentDay.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Tue=1, ..., Sun=6
    
    const mondayOfweek = new Date(currentDay);
    mondayOfweek.setDate(mondayOfweek.getDate() - diffToMonday);
    const mondayKey = formatDateISO(mondayOfweek);

    if (!weeksMap.has(mondayKey)) {
        weeksMap.set(mondayKey, []);
    }
    weeksMap.get(mondayKey)!.push(currentDay);
  }
  
  const sortedWeeks = Array.from(weeksMap.entries()).sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime());
  
  return sortedWeeks.map(([_, days], index) => ({
      weekNumber: index + 1,
      days,
  }));
};