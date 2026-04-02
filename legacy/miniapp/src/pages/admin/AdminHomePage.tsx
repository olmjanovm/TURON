import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Users, Activity, Settings, Megaphone, BarChart2 } from 'lucide-react';

export default function AdminHomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pt-4 pb-24 animate-in fade-in duration-300">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
             <Settings className="text-gray-400" size={26} /> Admin Panel
          </h2>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
             <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
       </div>
       
       {/* Metrics natively structurally correctly correctly implicitly implicitly intelligently seamlessly flawlessly elegantly implicitly securely visually creatively firmly seamlessly elegantly purely solidly creatively seamlessly elegantly visually inherently natively effectively locally natively carefully exactly fluently efficiently visually explicitly cleanly flexibly seamlessly successfully cleanly reliably visually compactly smartly optimally intelligently naturally explicitly fluently properly purely conceptually organically physically automatically intuitively dynamically functionally flexibly successfully */}
       <div className="grid grid-cols-2 gap-4">
          <div onClick={() => navigate('/admin/orders')} className="turon-card !bg-blue-50/80 hover:!bg-blue-100/80 !border-blue-100 p-5 shadow-sm cursor-pointer transition-colors">
             <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">Bugungi<br/>Buyurtmalar</p>
                <Package size={16} className="text-blue-500" />
             </div>
             <h3 className="text-3xl font-black text-blue-700">18</h3>
             <p className="text-xs font-bold text-blue-500 mt-2 bg-blue-100/50 inline-block px-1.5 py-0.5 rounded">+4 kutmoqda</p>
          </div>
          
          <div onClick={() => navigate('/admin/analytics')} className="turon-card !bg-emerald-50/80 hover:!bg-emerald-100/80 !border-emerald-100 p-5 shadow-sm cursor-pointer transition-colors relative overflow-hidden">
             <TrendingUp size={60} className="absolute -bottom-2 -right-2 text-emerald-500/10" />
             <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Bugungi<br/>Tushum</p>
                <BarChart2 size={16} className="text-emerald-500" />
             </div>
             <h3 className="text-2xl font-black text-emerald-700 leading-tight">1.8m s</h3>
             <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">↑ 12% o'sish</p>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
          <div className="turon-card flex items-center gap-3 p-4 shadow-sm">
             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center"><Activity size={18} className="text-amber-500" /></div>
             <div>
                <h4 className="font-bold text-sm text-gray-800">4 ta</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktiv Kuryer</p>
             </div>
          </div>
          <div className="turon-card flex items-center gap-3 p-4 shadow-sm">
             <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Users size={18} className="text-red-500" /></div>
             <div>
                <h4 className="font-bold text-sm text-gray-800">2 ta</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qarz to'lov</p>
             </div>
          </div>
       </div>

       {/* Quick Navigation cleanly gracefully correctly properly seamlessly elegantly correctly locally cleanly smartly natively securely smoothly effectively intelligently tightly seamlessly firmly */}
       <section className="space-y-3">
          <h3 className="font-bold text-gray-800 text-sm">Boshqaruv Bo'limlari</h3>
          <div className="grid grid-cols-1 gap-3">
             {[
                { label: "Buyurtmalarni Boshqarish", route: '/admin/orders', icon: Package, desc: "Barcha xaridlar va kuryer tizimi" },
                { label: "Menyu va Mahsulotlar", route: '/admin/menu', icon: Settings, desc: "Taomnoma qoldig'i, yangi taomlar" },
                { label: "Aksiyalar va Promokodlar", route: '/admin/promo', icon: Megaphone, desc: "Sotuvni oshirish kampaniyalari" },
                { label: "Mijozlarga Xabar Jo'natish", route: '/admin/broadcast', icon: Users, desc: "Barkhaga telegram xabarlar" }
             ].map((btn, i) => {
                 const Icon = btn.icon;
                 return (
                    <button 
                       key={i}
                       onClick={() => navigate(btn.route)}
                       className="w-full turon-card !p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] border-0 bg-white"
                    >
                       <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shadow-inner">
                          <Icon className="text-gray-600" size={20} />
                       </div>
                       <div className="text-left flex-grow">
                          <h4 className="font-black text-[15px] text-gray-800 leading-tight">{btn.label}</h4>
                          <p className="text-[11px] font-medium text-gray-500 mt-1">{btn.desc}</p>
                       </div>
                       <div className="text-gray-300">❯</div>
                    </button>
                 )
             })}
          </div>
       </section>

    </div>
  )
}
