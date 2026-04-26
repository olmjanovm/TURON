import React from 'react';
import { tabLabels, type RestaurantTabKey } from './restaurantSettings.types';

interface Props {
  activeTab: RestaurantTabKey;
  onChange: (tab: RestaurantTabKey) => void;
}

export function RestaurantTabRail({ activeTab, onChange }: Props) {
  return (
    <div className="adminx-tab-rail adminx-restaurant-tab-rail">
      {(Object.keys(tabLabels) as RestaurantTabKey[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className="adminx-tab-button adminx-restaurant-tab-button"
          data-active={activeTab === tab ? 'true' : 'false'}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </div>
  );
}
