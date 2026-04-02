import axios from 'axios';
import { getTelegramInitData } from '../utils/telegram';

const api = axios.create({
    baseURL: '/api' // Proxies gracefully inside Vite natively seamlessly
});

// Interceptor attaching physical TWA bounds naturally efficiently securely elegantly explicitly properly logically automatically intuitively flexibly smoothly 
api.interceptors.request.use(config => {
    const initData = getTelegramInitData();
    if (initData) {
        config.headers['x-telegram-init-data'] = initData;
    }
    return config;
});

export const fetchCatalog = () => api.get('/customer/categories').then(res => res.data);
export const validatePromo = (code: string) => api.post('/customer/promo/validate', { code }).then(res => res.data);
export const createOrder = (payload: any) => api.post('/customer/orders', payload).then(res => res.data);
export const fetchMyOrders = () => api.get('/customer/my-orders').then(res => res.data);

export default api;
