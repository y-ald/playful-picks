import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"

interface TrackingInfo {
  tracking_number: string
  status: string
  carrier: string
  eta: string
  tracking_history: {
    status: string
    status_details: string
    location: string
    status_date: string
  }[]
}

export default function TrackingPage() {
  const { trackingNumber } = useParams()
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrackingInfo = async () => {
      try {
        const { data: shipment } = await supabase
          .from('shipments')
          .select('*')
          .eq('tracking_number', trackingNumber)
          .single()

        if (!shipment) {
          setError('Shipment not found')
          setLoading(false)
          return
        }

        const { data, error: trackingError } = await supabase.functions.invoke('shipping', {
          body: {
            action: 'trackShipment',
            payload: {
              carrier: shipment.carrier,
              trackingNumber: shipment.tracking_number,
            },
          },
        })

        if (trackingError) throw trackingError
        setTrackingInfo(data)
      } catch (err) {
        setError('Failed to fetch tracking information')
        console.error('Tracking error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (trackingNumber) {
      fetchTrackingInfo()
    }
  }, [trackingNumber])

  if (loading) {
    return <div className="container mx-auto p-4">Loading tracking information...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p>{error}</p>
        </Card>
      </div>
    )
  }

  if (!trackingInfo) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No tracking information found</h2>
          <p>Please check your tracking number and try again.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Shipment Tracking</h1>
        
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-1">Tracking Number</h3>
              <p>{trackingInfo.tracking_number}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Carrier</h3>
              <p>{trackingInfo.carrier}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Status</h3>
              <p>{trackingInfo.status}</p>
            </div>
          </div>

          {trackingInfo.eta && (
            <div>
              <h3 className="font-semibold mb-1">Estimated Delivery</h3>
              <p>{new Date(trackingInfo.eta).toLocaleDateString()}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4">Tracking History</h3>
            <div className="space-y-4">
              {trackingInfo.tracking_history?.map((event, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-medium">{event.status}</p>
                  <p className="text-sm text-gray-600">{event.status_details}</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(event.status_date).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
