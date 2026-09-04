import React from 'react';

export const MaintenancePreventativeTab: React.FC = () => {
  const schedule = [
    { title: 'Boiler & Steam Heating Seasonal Inspection', frequency: 'Monthly', section: 'Basement Mechanical', nextDue: 'Sept 15, 2026', technician: 'Pete Kovacs' },
    { title: 'Salto BLE Smart Lock Battery Audit (All 42 Doors)', frequency: 'Quarterly', section: 'Floors 1-3', nextDue: 'Oct 01, 2026', technician: 'Pete Kovacs' },
    { title: 'Heritage Wood Fireplace Chimney Flue Sweep', frequency: 'Bi-Annual', section: 'Wings A & B', nextDue: 'Oct 10, 2026', technician: 'Contractor (Aspen Chimney)' },
    { title: 'Courtyard Heated Pool & Jacuzzi Filter Backwash', frequency: 'Weekly', section: 'Courtyard Spa', nextDue: 'Every Friday', technician: 'Pete Kovacs' },
  ];

  return (
    <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D8]">
        <h3 className="font-serif text-base font-semibold text-[#1C1815]">Preventative Maintenance & Safety Inspections</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[#736B63] font-medium">
            <tr>
              <th className="p-4">Maintenance Schedule</th>
              <th className="p-4">Cadence</th>
              <th className="p-4">Building Section</th>
              <th className="p-4">Next Due Date</th>
              <th className="p-4">Assigned Engineer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {schedule.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#FAF8F5] transition">
                <td className="p-4 font-semibold text-[#1C1815]">{item.title}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F5] border border-[#E5E0D8]">
                    {item.frequency}
                  </span>
                </td>
                <td className="p-4 text-[#736B63]">{item.section}</td>
                <td className="p-4 font-mono font-medium text-[#8C621E]">{item.nextDue}</td>
                <td className="p-4 text-[#1C1815] font-medium">{item.technician}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenancePreventativeTab;
