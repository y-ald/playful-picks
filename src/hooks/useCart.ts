
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStorage } from '@/hooks/useCartStorage';
import { useCartActions } from '@/hooks/useCartActions';

export const useCart = () => {
  const { cartItems } = useCartStorage();
  const { addToCart, updateQuantity, removeItem, calculateTotal } = useCartActions();

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    calculateTotal,
  };
};
