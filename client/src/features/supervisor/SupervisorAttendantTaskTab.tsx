import React from 'react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

interface SupervisorAttendantTaskTabProps {
  rooms: any[];
}

export const SupervisorAttendantTaskTab: React.FC<SupervisorAttendantTaskTabProps> = ({ rooms }) => {
  const dirtyCount = rooms.filter((r) => r.status === 'dirty').length;
  const cleanCount = rooms.filter((r) => r.status === 'clean').length;
  const inspectedCount = rooms.filter((r) => r.status === 'inspected').length;

  const attendants = [
    { name: 'Elena Ramos', role: 'Room Attendant', assignedFloors: 'Floor 1', completedToday: 8, pending: 2, status: 'Active' },
    { name: 'Mateo Ortiz', role: 'Room Attendant', assignedFloors: 'Floor 2', completedToday: 6, pending: 3, status: 'Active' },
    { name: 'Lucia Morales', role: 'Linen Attendant', assignedFloors: 'Floor 3', completedToday: 7, pending: 1, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Attendance & Shift KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Active Staff on Shift</span>
            <Users className="w-4 h-4 text-[#C5A059]" />
          </div>
          <span className="text-3xl font-serif font-bold text-slate-900">3 Attendants</span>
          <p className="text-[11px] font-semibold text-emerald-700">100% Shift Attendance</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Completed Turnovers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-serif font-bold text-emerald-700">{cleanCount + inspectedCount} Suites</span>
          <p className="text-[11px] font-medium text-slate-600">Inspected & Clean</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Remaining Turnover Queue</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-3xl font-serif font-bold text-rose-700">{dirtyCount} Suites</span>
          <p className="text-[11px] font-semibold text-rose-600">Dispatched to attendants</p>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200">
          <h3 className="font-serif text-base font-semibold text-slate-900">Room Attendant Roster & Floor Allocations</h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Attendant Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Section</th>
                <th className="p-4">Suites Cleaned</th>
                <th className="p-4">Pending</th>
                <th className="p-4">Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendants.map((att, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-semibold text-slate-900">{att.name}</td>
                  <td className="p-4 text-slate-600">{att.role}</td>
                  <td className="p-4 font-mono font-medium text-slate-800">{att.assignedFloors}</td>
                  <td className="p-4 font-mono font-bold text-emerald-700 text-sm">{att.completedToday}</td>
                  <td className="p-4 font-mono font-bold text-rose-600 text-sm">{att.pending}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAttendantTaskTab;
