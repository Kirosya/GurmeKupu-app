export const API_URL = 'https://g.sbaspava.com/api';

export const fetchOrders = async () => {
  const res = await fetch(`${API_URL}/orders`);
  if (!res.ok) throw new Error('Siparişler çekilemedi');
  return res.json();
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status }),
  });
  if (!res.ok) throw new Error('Sipariş güncellenemedi');
  return res.json();
};

export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Ürünler çekilemedi');
  return res.json();
};

export const updateProducts = async (products) => {
  const res = await fetch(`${API_URL}/products`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  });
  if (!res.ok) throw new Error('Ürünler güncellenemedi');
  return res.json();
};

export const registerPushToken = async (token) => {
  const res = await fetch(`${API_URL}/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Token kaydedilemedi');
  return res.json();
};

export const createOrder = async (orderData) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Sipariş oluşturulamadı');
  return res.json();
};
