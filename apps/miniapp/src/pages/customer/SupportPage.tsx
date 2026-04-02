import React from 'react';
import { Loader2, MessageCircleMore, SendHorizontal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { useOrderDetails } from '../../hooks/queries/useOrders';
import { useSendSupportMessage, useSupportThread } from '../../hooks/queries/useSupport';

type SupportTopic = 'where' | 'change' | 'cancel' | 'other';

const TOPIC_MESSAGES: Record<SupportTopic, string> = {
  where: 'Buyurtmam qani?',
  change: "Buyurtmani o'zgartirmoqchiman.",
  cancel: 'Buyurtmani bekor qilmoqchiman.',
  other: 'Savolim bor.',
};

function formatMessageTime(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || null;
  const initialTopic = (searchParams.get('topic') as SupportTopic | null) || 'where';
  const { formatText, intlLocale } = useCustomerLanguage();
  const { data: order, isError: isOrderError, error: orderError, refetch: refetchOrder } = useOrderDetails(orderId || '');
  const { data: thread, isLoading, isError, error, refetch } = useSupportThread(orderId);
  const sendMessage = useSendSupportMessage(orderId);
  const [draft, setDraft] = React.useState(TOPIC_MESSAGES[initialTopic]);
  const [activeTopic, setActiveTopic] = React.useState<SupportTopic>(initialTopic);
  const lastMessageRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread?.messages.length]);

  const quickActions = [
    { id: 'where' as const, label: "Buyurtmam qani?" },
    { id: 'change' as const, label: "Buyurtmani o'zgartirish" },
    { id: 'cancel' as const, label: 'Buyurtmani bekor qilish' },
    { id: 'other' as const, label: 'Boshqa savol' },
  ];

  const handleSend = () => {
    const nextText = draft.trim();
    if (!nextText || sendMessage.isPending) {
      return;
    }

    sendMessage.mutate(
      {
        text: nextText,
        topic: quickActions.find((item) => item.id === activeTopic)?.label,
      },
      {
        onSuccess: () => {
          setDraft('');
        },
      },
    );
  };

  const handleQuickAction = (topic: SupportTopic) => {
    setActiveTopic(topic);
    setDraft(TOPIC_MESSAGES[topic]);
  };

  if ((isOrderError && orderId) || isError) {
    return (
      <div className="px-4 py-10">
        <ErrorStateCard
          title="Support"
          message={((orderError || error) as Error).message}
          onRetry={() => {
            if (orderId) {
              void refetchOrder();
            }

            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pb-[calc(env(safe-area-inset-bottom,0px)+14px)]">
      <div className="space-y-3 px-4 pb-3 pt-4">
        <section className="rounded-[12px] border border-white/8 bg-[#111827] px-4 py-3.5 shadow-[0_14px_24px_rgba(2,6,23,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Support</p>
              <h2 className="mt-2 text-[24px] font-black leading-[0.96] tracking-[-0.04em] text-white">
                Operator bilan yozish
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-white/58">
                Xabaringiz operator Telegram chatiga boradi, javobi esa shu oynaga qaytadi.
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/[0.06] text-white/82">
              <MessageCircleMore size={18} />
            </div>
          </div>
        </section>

        <section className="rounded-[12px] border border-white/8 bg-[#111827] px-4 py-3 shadow-[0_12px_24px_rgba(2,6,23,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Buyurtma</p>
              <p className="mt-1 truncate text-[14px] font-black text-white">
                {order ? `#${order.orderNumber}` : 'Umumiy savol'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/42">
                {order
                  ? formatText(order.customerAddress?.addressText || "Manzil ko'rsatilmagan")
                  : 'Buyurtmasiz umumiy yordam'}
              </p>
            </div>
            {order ? (
              <button
                type="button"
                onClick={() => navigate(`/customer/orders/${order.id}`)}
                className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/68"
              >
                Buyurtmaga qaytish
              </button>
            ) : null}
          </div>
        </section>

        <section className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleQuickAction(action.id)}
              className={`shrink-0 rounded-full px-3.5 py-2.5 text-[11px] font-black transition-all ${
                activeTopic === action.id
                  ? 'bg-white text-slate-950'
                  : 'border border-white/8 bg-white/[0.05] text-white/68'
              }`}
            >
              {action.label}
            </button>
          ))}
        </section>
      </div>

      <div className="flex-1 px-4">
        <div className="flex h-full min-h-[260px] flex-col overflow-hidden rounded-[12px] border border-white/8 bg-[#0f172a] shadow-[0_14px_28px_rgba(2,6,23,0.2)]">
          <div className="border-b border-white/8 px-4 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Suhbat</p>
            <p className="mt-1 text-[12px] font-semibold text-white/62">
              Operator javobi shu yerga real vaqtda keladi.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 size={22} className="animate-spin text-white/68" />
              </div>
            ) : thread?.messages.length ? (
              thread.messages.map((message, index) => {
                const isCustomer = message.senderRole === 'CUSTOMER';

                return (
                  <div
                    key={message.id}
                    ref={index === thread.messages.length - 1 ? lastMessageRef : null}
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[84%] rounded-[12px] px-3 py-2.5 ${
                        isCustomer
                          ? 'rounded-br-[6px] bg-white text-slate-950'
                          : 'rounded-bl-[6px] border border-white/8 bg-white/[0.06] text-white'
                      }`}
                    >
                      <p className={`text-[11px] font-black ${isCustomer ? 'text-slate-600' : 'text-white/42'}`}>
                        {message.senderLabel}
                      </p>
                      <p className={`mt-1 text-[13px] leading-5 ${isCustomer ? 'text-slate-950' : 'text-white/84'}`}>
                        {message.text}
                      </p>
                      <p className={`mt-2 text-[10px] font-bold ${isCustomer ? 'text-slate-500' : 'text-white/36'}`}>
                        {formatMessageTime(message.createdAt, intlLocale)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-[260px] text-center">
                  <p className="text-sm font-black text-white">Suhbat hali boshlanmagan</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    Pastdagi maydonga yozing yoki tez savollardan birini tanlang.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 px-4">
        <div className="rounded-[12px] border border-white/8 bg-[#111827]/96 p-2.5 shadow-[0_16px_32px_rgba(2,6,23,0.24)] backdrop-blur-xl">
          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              placeholder="Savolingizni yozing..."
              className="min-h-[52px] flex-1 resize-none rounded-[10px] border border-white/8 bg-white/[0.05] px-3 py-2.5 text-[13px] font-semibold text-white outline-none placeholder:text-white/32 focus:border-white/16"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sendMessage.isPending || !draft.trim()}
              className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-4 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/60"
            >
              {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
              <span>Yuborish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
