import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Property } from '../../types';

interface OwnerPortfolioTabProps {
  properties: Property[];
  currentProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

export const OwnerPortfolioTab: React.FC<OwnerPortfolioTabProps> = ({
  properties,
  currentProperty,
  onSelectProperty,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((prop) => {
          const isSelected = prop.id === currentProperty?.id;
          return (
            <div
              key={prop.id}
              onClick={() => onSelectProperty(prop)}
              className={`editorial-card rounded-xl bg-white border p-5 cursor-pointer transition flex flex-col justify-between space-y-4 shadow-sm ${
                isSelected ? 'border-[#B08D57] ring-1 ring-[#B08D57] bg-[#FAF8F5]' : 'border-[#DDD7CD] hover:border-[#B08D57]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1C1815]">{prop.name}</h3>
                    <p className="text-xs text-[#736B63]">{prop.city}, {prop.state}</p>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#736B63] mt-2 line-clamp-2">{prop.description}</p>
              </div>

              <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-xs">
                <span className="text-[#1C1815] font-semibold">{prop.totalRooms} Total Suites</span>
                <span className="text-[#236446] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Salto BLE Live
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerPortfolioTab;
