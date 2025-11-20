
import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';
import { Icons } from './Icons';

interface Props {
  appointments: Appointment[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AgendaList: React.FC<Props> = ({ appointments, onToggleComplete, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Controls the month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()); // Controls the selected day for list

  // Helpers for Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  // --- Core Logic: Check if an appointment occurs on a specific date ---
  const getAppointmentsForDate = (targetDateStr: string) => {
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    targetDate.setHours(0, 0, 0, 0);

    return appointments.filter(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        apptDate.setHours(0, 0, 0, 0);

        // 1. Basic check: If start date is in the future of target, it can't be shown (unless it's exact match)
        if (targetDate < apptDate) return false;

        // 2. End Date check
        if (appt.repeatEndDate) {
            const end = new Date(appt.repeatEndDate + 'T00:00:00');
            end.setHours(0,0,0,0);
            if (targetDate > end) return false;
        }

        // 3. Recurrence Logic
        if (appt.repeat === 'none') {
            return appt.date === targetDateStr;
        } else if (appt.repeat === 'daily') {
            return true;
        } else if (appt.repeat === 'weekly') {
            return targetDate.getDay() === apptDate.getDay();
        } else if (appt.repeat === 'monthly') {
            return targetDate.getDate() === apptDate.getDate();
        }
        return false;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Memoized list of appointments for the SELECTED date
  const selectedDateAppointments = useMemo(() => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      return getAppointmentsForDate(dateStr);
  }, [selectedDate, appointments]);

  // Render Calendar Grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dateStr = tempDate.toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      // Check if this day has ANY appointments (for the dot indicator)
      const hasEvents = getAppointmentsForDate(dateStr).length > 0;

      days.push(
        <button
          key={d}
          onClick={() => setSelectedDate(tempDate)}
          className={`h-10 w-10 rounded-full flex flex-col items-center justify-center relative transition-all
            ${isSelected ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-110 z-10' : 'text-gray-300 hover:bg-white/5'}
            ${isToday && !isSelected ? 'border border-secondary/50 text-secondary' : ''}
          `}
        >
          <span className="text-sm font-medium">{d}</span>
          {hasEvents && (
              <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`}></span>
          )}
        </button>
      );
    }
    return days;
  };

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-6 animate-fadeIn pb-32">
        
        {/* Calendar Widget */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-bold text-white">
                    {months[currentDate.getMonth()]} <span className="text-gray-500">{currentDate.getFullYear()}</span>
                </h2>
                <div className="flex gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
                        <Icons.ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {renderCalendar()}
            </div>
        </div>

        {/* List of Appointments for Selected Date */}
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pl-1 text-primary/70">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            
            {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-gray-500 text-sm">Nada agendado para este dia.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {selectedDateAppointments.map((item) => (
                        <div key={item.id} className="group bg-card border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-white/5 rounded-lg border border-white/5">
                                <Icons.Clock className="w-4 h-4 text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-white">{item.time}</span>
                            </div>
                            
                            <div className="flex-1">
                                <p className={`font-medium text-slate-200 ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {item.title}
                                </p>
                                {item.description && (
                                    <p className="text-xs text-gray-500">{item.description}</p>
                                )}
                                {item.repeat !== 'none' && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Icons.RotateCcw className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] text-primary uppercase tracking-wide">
                                            {item.repeat === 'daily' ? 'Diário' : item.repeat === 'weekly' ? 'Semanal' : 'Mensal'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => onToggleComplete(item.id)}
                                    className={`p-2 rounded-full transition-colors ${item.isCompleted ? 'text-green-500' : 'text-gray-600 hover:text-green-400'}`}
                                >
                                    <Icons.CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => onDelete(item.id)}
                                    className="p-2 rounded-full text-gray-600 hover:text-red-400 transition-colors"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
