export const calculateParcelSize = (itemCount: number) => {
  // Base dimensions for 2 items
  const baseLength = 20;
  const baseWidth = 15;
  const baseHeight = 8;

  // Scaling factors (example values, adjust as needed)
  const lengthFactor = 1.1; // 10% increase per additional item
  const widthFactor = 1.05;  // 5% increase per additional item
  const heightFactor = 1.05; // 5% increase per additional item

  // Calculate dimensions for the given number of items
  const length = baseLength * Math.pow(lengthFactor, itemCount - 2);
  const width = baseWidth * Math.pow(widthFactor, itemCount - 2);
  const height = baseHeight * Math.pow(heightFactor, itemCount - 2);

  return {
    length: length.toFixed(2),
    width: width.toFixed(2),
    height: height.toFixed(2),
    distance_unit: "cm",
    weight: "1",
    mass_unit: "kg",
  };
};
