import React from 'react';
import { Wrench, CheckCircle2, Clock } from 'lucide-react';
import type { MaintenanceTicket } from '../../types';


interface MaintenanceTicketsTabProps {
  tickets?: (MaintenanceTicket & { roomNumber?: string; building?: string; floor?: number })[];
  onOpenReportModal: () => void;
  onResolveTicket?: (ticketId: string) => void;
}

export const MaintenanceTicketsTab: React.FC<MaintenanceTicketsTabProps> = ({
  tickets = [],
  onOpenReportModal,
  onResolveTicket,
}) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
        <div className="p-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1C1815]">
              Engineering Work Orders ({tickets.length})
            </h3>
            <p className="text-xs text-[#736B63]">
              Active maintenance tickets, room quirks, and defect triage across the property.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-3.5 py-2 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
          >
            <Wrench className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>New Work Order</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-xs">
            <thead className="bg-[#FAF8F5]/80 border-b border-[#E5E0D8] text-[#736B63] font-medium">
              <tr>
                <th className="p-4 whitespace-nowrap">Suite #</th>
                <th className="p-4 whitespace-nowrap">Category & Issue Description</th>
                <th className="p-4 whitespace-nowrap">Priority</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Reported By</th>
                <th className="p-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {tickets.map((tkt) => {
                const isResolved = tkt.status === 'resolved' || tkt.status === 'closed';
                const suiteDisplay = tkt.roomNumber ? `#${tkt.roomNumber}` : 'General / Facility';

                return (
                  <tr key={tkt.id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="p-4 font-serif text-base font-bold text-[#1C1815] whitespace-nowrap">
                      {suiteDisplay}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1C1815] text-sm">{tkt.title}</span>
                      </div>
                      <p className="text-xs text-[#524B43] mt-0.5">{tkt.description}</p>
                      {tkt.notes && (
                        <span className="text-[11px] text-[#8C621E] block mt-1 font-mono">
                          Note: {tkt.notes}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${
                          tkt.priority === 'urgent'
                            ? 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]'
                            : tkt.priority === 'high'
                            ? 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]'
                            : tkt.priority === 'medium'
                            ? 'bg-[#FAF8F5] text-[#524B43] border-[#E5E0D8]'
                            : 'bg-[#F0EFEF] text-[#5C5855] border-[#DDDCDA]'
                        }`}
                      >
                        {tkt.priority}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${
                          isResolved
                            ? 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]'
                            : tkt.status === 'in_progress'
                            ? 'bg-[#EEF4FA] text-[#1E456B] border-[#C8DCEF]'
                            : 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#236446]" /> Resolved
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-[#8C621E]" /> {tkt.status}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-[#736B63] whitespace-nowrap">
                      <div>{tkt.reportedBy}</div>
                      <span className="text-[10px] text-[#A69E95] block">
                        {tkt.createdAt ? new Date(tkt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {!isResolved && onResolveTicket ? (
                        <button
                          type="button"
                          onClick={() => onResolveTicket(tkt.id)}
                          className="px-3 py-1.5 rounded-md bg-[#EBF4EF] hover:bg-[#D5EADF] text-[#236446] border border-[#C8E3D4] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#736B63] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-[#736B63]">
                    <Wrench className="w-8 h-8 text-[#DDD7CD] mx-auto mb-2" />
                    <p className="font-semibold text-[#1C1815]">No active work orders</p>
                    <p className="text-[11px] text-[#736B63] mt-0.5">
                      All suites and facilities for this property are operating nominally.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTicketsTab;
