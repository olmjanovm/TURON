'use client';

import { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useAddresses } from '@/hooks/use-customer';
import { AddressForm } from '@/components/customer/address-form';

export default function EditAddressPage({ params }: { params: Promise<{ addressId: string }> }) {
  const { addressId } = use(params);
  const { data: addresses, isLoading } = useAddresses();
  const address = addresses?.find((a) => a.id === addressId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#c62020]" />
      </div>
    );
  }

  if (!address) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-base font-bold">Topilmadi</p>
      </div>
    );
  }

  return <AddressForm initial={address} />;
}
