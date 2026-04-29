import React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { ChatEmpty } from '../../components/chat/ChatEmpty';
import { QuickReplyChips } from '../../components/chat/QuickReplyChips';
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

const QUICK_REPLIES = [
  { id: 'where' as const, label: "Buyurtmam qani?" },
  { id: 'change' as const, label: "Buyurtmani o'zgartirish" },
  { id: 'cancel' as const, label: 'Buyurtmani bekor qilish' },
  { id: 'other' as const, label: 'Boshqa savol' },
];

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
  const {
    data: order,
    isError: isOrderError,
    error: orderError,
    refetch: refetchOrder,
  } = useOrderDetails(orderId || '');
  const { data: thread, isLoading, isError, error, refetch } = useSupportThread(orderId);
  const sendMessage = useSendSupportMessage(orderId);
  const [draft, setDraft] = React.useState(TOPIC_MESSAGES[initialTopic]);
  const [activeTopicLabel, setActiveTopicLabel] = React.useState<string | undefined>(
    QUICK_REPLIES.find((q) => q.id === initialTopic)?.label,
  );
  const lastMessageRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread?.messages.length]);

  const handleSend = () => {
    const nextText = draft.trim();
    if (!nextText || sendMessage.isPending) return;

    sendMessage.mutate(
      { text: nextText, topic: activeTopicLabel },
      {
        onSuccess: () => setDraft(''),
      },
    );
  };

  const handlePickQuick = (label: string) => {
    setActiveTopicLabel(label);
    const found = QUICK_REPLIES.find((q) => q.label === label);
    if (found) {
      setDraft(TOPIC_MESSAGES[found.id]);
    }
  };

  if ((isOrderError && orderId) || isError) {
    return (
      <div className="px-4 py-10">
        <ErrorStateCard
          title="Support"
          message={((orderError || error) as Error).message}
          onRetry={() => {
            if (orderId) void refetchOrder();
            void refetch();
          }}
        />
      </div>
    );
  }

  const subtitle = order
    ? `#${order.orderNumber} · ${formatText(order.customerAddress?.addressText || "Manzil ko'rsatilmagan")}`
    : 'Umumiy savol';

  // Pin the chat surface to the viewport so the input always stays at the
  // bottom of 100dvh and the page never scrolls. Messages list scrolls inside.
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[var(--app-bg)] text-[var(--app-text)]"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <ChatHeader
        title="Operator bilan yozishuv"
        subtitle={subtitle}
        onBack={() => {
          if (order) {
            navigate(`/customer/orders/${order.id}`);
          } else {
            navigate(-1);
          }
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--app-muted)]" />
          </div>
        ) : thread?.messages.length ? (
          <div className="space-y-1.5">
            {thread.messages.map((message, index) => {
              const isCustomer = message.senderRole === 'CUSTOMER';
              const isLast = index === thread.messages.length - 1;

              return (
                <div key={message.id} ref={isLast ? lastMessageRef : null}>
                  <ChatBubble
                    side={isCustomer ? 'own' : 'other'}
                    text={message.text}
                    time={formatMessageTime(message.createdAt, intlLocale)}
                    authorLabel={isCustomer ? undefined : message.senderLabel || 'Operator'}
                    status={isCustomer ? 'sent' : undefined}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <ChatEmpty
            title="Suhbat hali boshlanmagan"
            hint="Pastdagi maydonga yozing yoki tez savollardan birini tanlang."
          />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2">
        <QuickReplyChips
          items={QUICK_REPLIES.map((q) => q.label)}
          activeValue={activeTopicLabel}
          onPick={handlePickQuick}
        />
      </div>

      <div
        className="shrink-0 bg-[var(--app-bg)] px-3 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          isSending={sendMessage.isPending}
          placeholder="Savolingizni yozing..."
        />
      </div>
    </div>
  );
};

export default SupportPage;
