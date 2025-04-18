import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Truck, Clock } from "lucide-react";

interface ImprovedShippingOptionsProps {
  shippingRates: any[];
  selectedRate: any;
  setSelectedRate: (rate: any) => void;
  onSubmit: () => void;
  loading: boolean;
}

// Using memo to prevent unnecessary re-renders
const ImprovedShippingOptions = memo(
  ({
    shippingRates,
    selectedRate,
    setSelectedRate,
    onSubmit,
    loading,
  }: ImprovedShippingOptionsProps) => {
    if (shippingRates.length === 0) {
      return null;
    }

    // Group shipping rates by provider
    const groupedRates = shippingRates.reduce((acc, rate) => {
      const provider = rate.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(rate);
      return acc;
    }, {});

    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Shipping Options</h3>
        <ScrollArea className="h-64 border rounded-md p-1">
          <div className="space-y-4 p-2">
            {Object.entries(groupedRates).map(([provider, rates]) => (
              <div key={provider} className="space-y-2">
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">
                  {provider}
                </h4>
                <div className="space-y-2">
                  {(rates as any[]).map((rate) => (
                    <div
                      key={rate.object_id}
                      className={`flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRate &&
                        selectedRate.object_id === rate.object_id
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedRate(rate);
                        // Add a visual feedback when an option is selected
                        const element = document.getElementById(
                          `shipping-option-${rate.object_id}`
                        );
                        if (element) {
                          element.classList.add("animate-pulse");
                          setTimeout(() => {
                            element.classList.remove("animate-pulse");
                          }, 500);
                        }
                      }}
                      id={`shipping-option-${rate.object_id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedRate &&
                          selectedRate.object_id === rate.object_id ? (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {rate.servicelevel.name}
                          </p>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>
                              Estimated delivery: {rate.estimated_days} days
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Truck className="w-4 h-4 mr-1" />
                            <span>{rate.provider}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold">
                        ${parseFloat(rate.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
);

// Set display name for debugging
ImprovedShippingOptions.displayName = "ImprovedShippingOptions";

export default ImprovedShippingOptions;
