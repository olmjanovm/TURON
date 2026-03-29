export default function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md shadow-sm flex items-center justify-between px-5 z-50 border-b border-orange-100/50">
       <h1 className="text-xl font-black tracking-tight text-amber-600 drop-shadow-sm">Turon</h1>
       <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-amber-600 font-bold text-xs select-none shadow-inner border border-amber-100">
         👤
       </div>
    </header>
  );
}
