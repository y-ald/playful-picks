import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar, ScrollAreaPrimitive } from "@/components/ui/scroll-area";

interface ShippingOptionsProps {
  shippingRates: any[];
  selectedRate: any;
  setSelectedRate: (rate: any) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function ShippingOptions({ shippingRates, selectedRate, setSelectedRate, onSubmit, loading }: ShippingOptionsProps) {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Shipping Options</h3>
      <ScrollArea className="h-40">
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
          <div className="space-y-4">
            {shippingRates.map((rate: any) => (
              <div
                key={rate.object_id}
                className={`flex items-center justify-between p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedRate && selectedRate.object_id === rate.object_id ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedRate(rate)}
              >
                <div>
                  <p className="font-medium">{rate.provider}</p>
                  <p className="text-sm text-gray-600">{rate.servicelevel.name}</p>
                  <p className="text-sm text-gray-600">
                    Estimated delivery: {rate.estimated_days} days
                  </p>
                </div>
                <div className="text-lg font-semibold">
                  ${parseFloat(rate.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
      </ScrollArea>

      <Button 
        onClick={onSubmit}
        className="w-full text-lg py-6 mt-6" 
        disabled={loading || !selectedRate}
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </Button>
    </div>
  );
}
