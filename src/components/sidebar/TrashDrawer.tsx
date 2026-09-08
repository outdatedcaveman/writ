import React from "react";
import { TrashItem } from "../../types/workspace";
import { Trash2, RotateCcw, X, AlertCircle } from "lucide-react";

interface TrashDrawerProps {
  isOpen: boolean;
  trashItems: TrashItem[];
  onClose: () => void;
  onRestore: (trashId: string) => void;
}

export const TrashDrawer: React.FC<TrashDrawerProps> = ({
  isOpen,
  trashItems,
  onClose,
  onRestore
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="w-full max-w-xl bg-[#101010] border border-[#242424] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-[#ECE7DE]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-[#C8A051]" />
            <h3 className="font-serif text-base font-medium">Safety Archive (Rule 1 Compliance)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#66625B] hover:text-[#ECE7DE] p-1 rounded-lg hover:bg-[#202020] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[#181818] px-6 py-3 border-b border-[#202020] flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#7E9F86] shrink-0" />
          <p className="text-xs text-[#A09A8F] leading-relaxed">
            Nothing is ever permanently destroyed in Writ. Any removed entity, scene, character, or project is stored in this safety drawer and can be restored at any time.
          </p>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {trashItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#66625B]">
              The safety archive is currently empty.
            </div>
          ) : (
            trashItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-[#202020] bg-[#0c0c0c]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1c1c1c] text-[#A09A8F]">
                      {item.entityType}
                    </span>
                    <span className="text-xs text-[#66625B]">
                      Archived {new Date(item.deletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[#ECE7DE]">{item.entityName}</h4>
                </div>

                <button
                  onClick={() => onRestore(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2c2c2c] text-xs text-[#7E9F86] font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
