"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { getMapData } from "@/lib/api";
import type { MapDataResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";

// US TopoJSON - using the existing file
const GEO_URL = "/geo/counties-10m.json";

// ISO Region colors from design system
const REGION_COLORS: Record<string, string> = {
  CAISO: "#3B82F6",
  ERCOT: "#F59E0B",
  MISO: "#10B981",
  PJM: "#8B5CF6",
  SPP: "#14B8A6",
  NYISO: "#EC4899",
  "ISO-NE": "#6366F1",
  West: "#F97316",
  Southeast: "#84CC16",
};

// State to region mapping
const STATE_TO_REGION: Record<string, string> = {
  CA: "CAISO",
  TX: "ERCOT",
  CT: "ISO-NE", MA: "ISO-NE", ME: "ISO-NE", NH: "ISO-NE", RI: "ISO-NE", VT: "ISO-NE",
  NY: "NYISO",
  DE: "PJM", IL: "PJM", IN: "PJM", KY: "PJM", MD: "PJM", MI: "PJM",
  NJ: "PJM", NC: "PJM", OH: "PJM", PA: "PJM", TN: "PJM", VA: "PJM", WV: "PJM", DC: "PJM",
  AR: "MISO", IA: "MISO", LA: "MISO", MN: "MISO", MO: "MISO", MS: "MISO",
  MT: "MISO", ND: "MISO", SD: "MISO", WI: "MISO",
  KS: "SPP", NE: "SPP", NM: "SPP", OK: "SPP",
  AZ: "West", CO: "West", ID: "West", NV: "West", OR: "West", UT: "West", WA: "West", WY: "West",
  AL: "Southeast", FL: "Southeast", GA: "Southeast", SC: "Southeast",
  AK: "West", HI: "West",
};

// FIPS to state mapping
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY",
};

interface TooltipData {
  county: string;
  state: string;
  region: string;
  projectCount: number;
  totalMw: number;
  x: number;
  y: number;
}

interface USChoroplethMapProps {
  className?: string;
  filters?: {
    region?: string;
    type_clean?: string;
    q_status?: string;
  };
}

export function USChoroplethMap({ className, filters }: USChoroplethMapProps) {
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([-96, 38]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.5, 1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setCenter([-96, 38]);
  }, []);

  // Load map data - re-fetch when filters change
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getMapData({
          type_clean: filters?.type_clean,
          q_status: filters?.q_status,
        });
        setMapData(data);
      } catch (error) {
        console.error("Failed to load map data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [filters?.type_clean, filters?.q_status]);

  // Create county data lookup
  const countyDataLookup = useMemo(() => {
    if (!mapData) return {};
    const lookup: Record<string, { projectCount: number; totalMw: number }> = {};
    for (const county of mapData.by_county) {
      lookup[county.fips] = {
        projectCount: county.project_count,
        totalMw: county.total_mw,
      };
    }
    return lookup;
  }, [mapData]);

  // Calculate color scale
  const colorScale = useMemo(() => {
    if (!mapData || mapData.by_county.length === 0) {
      return () => "#1e293b";
    }
    const capacities = mapData.by_county.map((c) => c.total_mw).filter((v) => v > 0);
    return scaleQuantile<string>()
      .domain(capacities)
      .range([
        "#0f172a", // slate-900 - lowest
        "#1e3a5f", // dark blue
        "#1d4ed8", // blue-700
        "#3b82f6", // blue-500
        "#60a5fa", // blue-400
        "#93c5fd", // blue-300
        "#bfdbfe", // blue-200
        "#dbeafe", // blue-100 - highest
      ]);
  }, [mapData]);

  // Get max capacity for legend
  const maxCapacity = useMemo(() => {
    if (!mapData || mapData.by_county.length === 0) return 1000;
    return Math.max(...mapData.by_county.map((c) => c.total_mw));
  }, [mapData]);

  // Handle mouse events
  const handleMouseEnter = useCallback(
    (geo: { id?: string | number; properties?: { name?: string } }, event: React.MouseEvent) => {
      const fips = String(geo.id).padStart(5, "0");
      const stateFips = fips.substring(0, 2);
      const state = FIPS_TO_STATE[stateFips] || "";
      const region = STATE_TO_REGION[state] || "Other";
      const data = countyDataLookup[fips];

      if (data && data.projectCount > 0) {
        setTooltip({
          county: geo.properties?.name || "Unknown",
          state,
          region,
          projectCount: data.projectCount,
          totalMw: data.totalMw,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [countyDataLookup]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading map data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-900 ${className}`}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{
          scale: 1000,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          onMoveEnd={({ coordinates, zoom: newZoom }) => {
            setCenter(coordinates as [number, number]);
            setZoom(newZoom);
          }}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = String(geo.id).padStart(5, "0");
                const stateFips = fips.substring(0, 2);
                const state = FIPS_TO_STATE[stateFips] || "";
                const region = STATE_TO_REGION[state] || "Other";
                const data = countyDataLookup[fips];
                const hasData = data && data.totalMw > 0;

                // If region filter is active, dim counties outside that region
                const isInSelectedRegion = !filters?.region || region === filters.region;
                const dimmed = filters?.region && !isInSelectedRegion;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      dimmed
                        ? "#0f172a" // Dimmed for non-selected regions
                        : hasData
                        ? colorScale(data.totalMw)
                        : "#1e293b"
                    }
                    stroke={dimmed ? "#1e293b" : "#334155"}
                    strokeWidth={0.3}
                    style={{
                      default: {
                        outline: "none",
                        transition: "fill 0.2s ease, opacity 0.2s ease",
                        opacity: dimmed ? 0.4 : 1,
                      },
                      hover: {
                        fill: dimmed ? "#0f172a" : hasData ? "#f59e0b" : "#334155",
                        outline: "none",
                        cursor: hasData && !dimmed ? "pointer" : "default",
                        opacity: dimmed ? 0.4 : 1,
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(event) => !dimmed && handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-slate-800/95 px-4 py-3 shadow-xl backdrop-blur-sm border border-slate-700"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15,
          }}
        >
          <div className="font-semibold text-white text-base">
            {tooltip.county}, {tooltip.state}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: REGION_COLORS[tooltip.region] || "#64748b" }}
            />
            <span className="text-sm text-slate-400">{tooltip.region}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
            <div>
              <span className="text-slate-400">Projects</span>
              <span className="ml-2 font-semibold text-white">{tooltip.projectCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Capacity</span>
              <span className="ml-2 font-semibold text-blue-400">{tooltip.totalMw.toLocaleString()} MW</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-slate-800/90 p-4 backdrop-blur-sm border border-slate-700">
        <div className="mb-3 text-xs font-semibold text-white uppercase tracking-wider">
          Queue Capacity (MW)
        </div>
        <div className="flex items-center gap-0.5">
          {["#0f172a", "#1e3a5f", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"].map(
            (color, i) => (
              <div
                key={i}
                className="h-3 w-5 first:rounded-l last:rounded-r"
                style={{ backgroundColor: color }}
              />
            )
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-400">
          <span>0</span>
          <span>{Math.round(maxCapacity / 2).toLocaleString()}</span>
          <span>{maxCapacity.toLocaleString()}</span>
        </div>

        {/* ISO Regions Legend */}
        <div className="mt-4 border-t border-slate-700 pt-3">
          <div className="mb-2 text-xs font-semibold text-white uppercase tracking-wider">
            ISO Regions
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
            {Object.entries(REGION_COLORS).map(([region, color]) => (
              <div key={region} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 truncate">{region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 rounded-lg bg-slate-800/90 p-4 backdrop-blur-sm border border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wider">Total in Queue</div>
        <div className="mt-1 text-2xl font-bold text-white">
          {mapData ? mapData.by_county.reduce((sum, c) => sum + c.project_count, 0).toLocaleString() : "—"}
        </div>
        <div className="text-sm text-slate-400">projects</div>
        <div className="mt-3 text-xs text-slate-400 uppercase tracking-wider">Total Capacity</div>
        <div className="mt-1 text-2xl font-bold text-blue-400">
          {mapData ? Math.round(mapData.by_county.reduce((sum, c) => sum + c.total_mw, 0) / 1000).toLocaleString() : "—"}
        </div>
        <div className="text-sm text-slate-400">GW</div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-slate-800/90 p-2 backdrop-blur-sm border border-slate-700">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-slate-600" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={handleReset}
          title="Reset view"
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <span className="text-xs text-slate-400 px-2">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
