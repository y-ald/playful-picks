/**
 * Calculate parcel size based on the number of items in the cart
 * This is a simplified calculation for demonstration purposes
 * In a real application, you would calculate the size based on the actual dimensions and weight of the products
 *
 * @param itemCount Number of items in the cart
 * @returns Parcel dimensions object for Shippo API
 */
export const calculateParcelSize = (itemCount: number) => {
  // Base dimensions for a small parcel
  const baseParcel = {
    length: 20,
    width: 15,
    height: 10,
    distance_unit: "cm",
    weight: 0.5,
    mass_unit: "kg",
  };

  // Adjust dimensions based on item count
  if (itemCount <= 1) {
    return baseParcel;
  } else if (itemCount <= 3) {
    return {
      ...baseParcel,
      length: 25,
      width: 20,
      height: 15,
      weight: 1.0,
    };
  } else if (itemCount <= 5) {
    return {
      ...baseParcel,
      length: 30,
      width: 25,
      height: 20,
      weight: 2.0,
    };
  } else {
    // For larger orders
    return {
      ...baseParcel,
      length: 40,
      width: 30,
      height: 25,
      weight: 3.0 + (itemCount - 5) * 0.5, // Add 0.5kg for each additional item
    };
  }
};
