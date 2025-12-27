import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/lib/supabaseClient";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Driver specific icon (maybe different color later)
const DriverIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface DriverLocation {
    driverId: string;
    latitude: number;
    longitude: number;
    lastUpdate: string;
    name?: string;
    plate?: string;
}

interface CompanyMapProps {
    drivers: { id: string; name: string; plate: string }[];
    focusedDriverId?: string | null;
    className?: string;
}

// Map Controller to handle panning
const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
};

const CompanyMap = ({ drivers, focusedDriverId, className }: CompanyMapProps) => {
    const [locations, setLocations] = useState<Record<string, DriverLocation>>({});
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        if (drivers.length === 0) return;

        const driverIds = drivers.map(d => d.id);

        // 1. Initial Fetch of active locations
        const fetchLocations = async () => {
            const { data } = await supabase
                .from('locationSharing')
                .select('*')
                .in('driverId', driverIds)
                .eq('isSharing', true);

            if (data) {
                const locMap: Record<string, DriverLocation> = {};
                data.forEach(loc => {
                    const driver = drivers.find(d => d.id === loc.driverId);
                    locMap[loc.driverId] = {
                        driverId: loc.driverId,
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                        lastUpdate: loc.lastUpdate,
                        name: driver?.name,
                        plate: driver?.plate
                    };
                });
                setLocations(locMap);
            }
        };

        fetchLocations();

        // 2. Realtime Subscription
        const subscription = supabase
            .channel('company-map-tracking')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE
                    schema: 'public',
                    table: 'locationSharing',
                    filter: `isSharing=eq.true` // We might receive all sharing, need to filter by ID in callback
                },
                (payload) => {
                    const newLoc = payload.new as any;
                    if (driverIds.includes(newLoc.driverId)) {
                        const driver = drivers.find(d => d.id === newLoc.driverId);
                        setLocations(prev => ({
                            ...prev,
                            [newLoc.driverId]: {
                                driverId: newLoc.driverId,
                                latitude: parseFloat(newLoc.latitude),
                                longitude: parseFloat(newLoc.longitude),
                                lastUpdate: newLoc.lastUpdate,
                                name: driver?.name,
                                plate: driver?.plate
                            }
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [drivers]);

    // Handle focus
    useEffect(() => {
        if (focusedDriverId && locations[focusedDriverId]) {
            const loc = locations[focusedDriverId];
            setMapCenter([loc.latitude, loc.longitude]);
        }
    }, [focusedDriverId, locations]);

    // Default center (Turkey)
    const defaultCenter: [number, number] = [39.1667, 35.6667];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={6}
            className={`rounded-xl z-0 ${className}`}
            style={{ width: "100%", height: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {Object.values(locations).map((loc) => (
                <Marker
                    key={loc.driverId}
                    position={[loc.latitude, loc.longitude]}
                    icon={DriverIcon}
                >
                    <Popup>
                        <div className="text-center min-w-[150px]">
                            <h3 className="font-bold text-lg mb-1">{loc.name}</h3>
                            <div className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-sm font-mono inline-block mb-2">
                                {loc.plate}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Son Güncelleme: {loc.lastUpdate}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            <MapController center={mapCenter} />
        </MapContainer>
    );
};

export default CompanyMap;
