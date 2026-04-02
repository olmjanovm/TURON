interface Window {
    Telegram?: {
        WebApp?: {
            initData: string;
            initDataUnsafe?: {
                user?: any;
            };
            ready: () => void;
            expand: () => void;
            close: () => void;
            colorScheme: string;
            HapticFeedback?: {
                impactOccurred: (style: string) => void;
            };
        };
    };
}
