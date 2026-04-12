/**
 * Calculate parcel size based on the number of items in the cart.
 * Returns dimensions as strings per Shippo API spec.
 */
export const calculateParcelSize = (itemCount: number) => {
  const baseParcel = {
    length: "20",
    width: "15",
    height: "10",
    distance_unit: "cm",
    weight: "0.5",
    mass_unit: "kg",
  };

  if (itemCount <= 1) {
    return baseParcel;
  } else if (itemCount <= 3) {
    return {
      ...baseParcel,
      length: "25",
      width: "20",
      height: "15",
      weight: "1.0",
    };
  } else if (itemCount <= 5) {
    return {
      ...baseParcel,
      length: "30",
      width: "25",
      height: "20",
      weight: "2.0",
    };
  } else {
    return {
      ...baseParcel,
      length: "40",
      width: "30",
      height: "25",
      weight: String(3.0 + (itemCount - 5) * 0.5),
    };
  }
};
