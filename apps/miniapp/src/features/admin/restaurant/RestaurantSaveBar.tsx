import React from 'react';
import { Check, Loader2, Save } from 'lucide-react';

interface Props {
  visible: boolean;
  disabled: boolean;
  isSaving: boolean;
  isSaved: boolean;
  label: string;
  onClick: () => void;
}

export function RestaurantSaveBar({ visible, disabled, isSaving, isSaved, label, onClick }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <div className="adminx-save-bar">
      <div className="adminx-save-shell">
        <button type="button" disabled={disabled || isSaving} onClick={onClick} className="adminx-save-button">
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <Check size={18} /> : <Save size={18} />}
          {isSaving ? 'Saqlanmoqda' : isSaved ? 'Saqlandi' : label}
        </button>
      </div>
    </div>
  );
}
