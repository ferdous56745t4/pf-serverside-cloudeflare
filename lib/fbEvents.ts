// lib/fbEvents.ts
import { generateEventId, firePixelEvent, sendServerEvent } from './fbcapi';

export const trackPageView = () => {
  const eventId = generateEventId();
  firePixelEvent('PageView', {}, eventId);
  sendServerEvent('PageView', {}, {}, eventId);
};

export const trackViewContent = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT'
) => {
  const eventId = generateEventId();
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
  };
  
  firePixelEvent('ViewContent', customData, eventId);
  sendServerEvent('ViewContent', customData, {}, eventId);
};

export const trackAddToCart = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT'
) => {
  const eventId = generateEventId();
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
  };

  firePixelEvent('AddToCart', customData, eventId);
  sendServerEvent('AddToCart', customData, {}, eventId);
};

export const trackInitiateCheckout = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  numItems: number = 1
) => {
  const eventId = generateEventId();
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: numItems
  };

  firePixelEvent('InitiateCheckout', customData, eventId);
  sendServerEvent('InitiateCheckout', customData, {}, eventId);
};

export const trackPurchase = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  numItems: number = 1,
  orderId: string,
  userData: { ph?: string; fn?: string; ln?: string; em?: string } = {}
) => {
  const eventId = generateEventId();
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: numItems,
    order_id: orderId, // Crucial for dedupping standard events outside of the eventId CAPI paradigm too sometimes
    contents: contentIds.map(id => ({ id, quantity: numItems, item_price: value })) // FB format for product tracking
  };

  firePixelEvent('Purchase', customData, eventId);
  sendServerEvent('Purchase', customData, userData, eventId);
};

export const trackLead = (userData: { ph?: string; em?: string; fn?: string; ln?: string }) => {
  const eventId = generateEventId();
  firePixelEvent('Lead', {}, eventId);
  sendServerEvent('Lead', {}, userData, eventId);
};

export const trackCompleteRegistration = (userData: { ph?: string; em?: string; fn?: string; ln?: string }) => {
  const eventId = generateEventId();
  firePixelEvent('CompleteRegistration', {}, eventId);
  sendServerEvent('CompleteRegistration', {}, userData, eventId);
};

// Custom events matching the previous GTM implementations
export const trackCustomEvent = (eventName: string, value: number, currency: string = 'BDT') => {
  const eventId = generateEventId();
  const customData = { value, currency };
  firePixelEvent(eventName, customData, eventId);
  sendServerEvent(eventName, customData, {}, eventId);
};
