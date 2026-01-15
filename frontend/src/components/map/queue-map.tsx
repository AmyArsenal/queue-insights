"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Map, { NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, ViewStateChangeEvent } from "react-map-gl/maplibre";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import { getMapData } from "@/lib/api";
import type { MapDataResponse } from "@/types";

import "maplibre-gl/dist/maplibre-gl.css";

// Region colors based on design system
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

// FIPS code to state abbreviation
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

interface TooltipInfo {
  x: number;
  y: number;
  county?: string;
  state?: string;
  region?: string;
  projectCount?: number;
  totalMw?: number;
}

interface CountyData {
  projectCount: number;
  totalMw: number;
}

interface QueueMapProps {
  className?: string;
  typeFilter?: string;
  statusFilter?: string;
}

export function QueueMap({ className, typeFilter, statusFilter }: QueueMapProps) {
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<FeatureCollection | null>(null);
  const [countiesGeoJson, setCountiesGeoJson] = useState<FeatureCollection | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -96,
    latitude: 38,
    zoom: 3.5,
  });

  // Load TopoJSON and convert to GeoJSON
  useEffect(() => {
    async function loadGeoData() {
      try {
        const [statesRes, countiesRes] = await Promise.all([
          fetch("/geo/states-10m.json"),
          fetch("/geo/counties-10m.json"),
        ]);

        const statesTopo = (await statesRes.json()) as Topology<{
          states: GeometryCollection;
        }>;
        const countiesTopo = (await countiesRes.json()) as Topology<{
          counties: GeometryCollection;
        }>;

        const statesFeatures = feature(
          statesTopo,
          statesTopo.objects.states
        ) as FeatureCollection;

        const countiesFeatures = feature(
          countiesTopo,
          countiesTopo.objects.counties
        ) as FeatureCollection;

        setStatesGeoJson(statesFeatures);
        setCountiesGeoJson(countiesFeatures);
      } catch (error) {
        console.error("Failed to load geo data:", error);
      }
    }

    loadGeoData();
  }, []);

  // Load map data from API
  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await getMapData({
          type_clean: typeFilter,
          q_status: statusFilter,
        });
        setMapData(data);
      } catch (error) {
        console.error("Failed to load map data:", error);
      }
    }

    loadMapData();
  }, [typeFilter, statusFilter]);

  // Create county data lookup using object instead of Map for TS compatibility
  const countyDataLookup = useMemo(() => {
    if (!mapData) return {} as Record<string, CountyData>;

    const lookup: Record<string, CountyData> = {};
    for (const county of mapData.by_county) {
      lookup[county.fips] = {
        projectCount: county.project_count,
        totalMw: county.total_mw,
      };
    }
    return lookup;
  }, [mapData]);

  // Calculate max capacity for color scaling
  const maxCapacity = useMemo(() => {
    if (!mapData || mapData.by_county.length === 0) return 1000;
    return Math.max(...mapData.by_county.map((c) => c.total_mw), 1);
  }, [mapData]);

  // Add data to counties GeoJSON
  const countiesWithData = useMemo(() => {
    if (!countiesGeoJson || !mapData) return null;

    const features = countiesGeoJson.features.map((f) => {
      const fips = String(f.id).padStart(5, "0");
      const data = countyDataLookup[fips];
      const stateFips = fips.substring(0, 2);
      const state = FIPS_TO_STATE[stateFips] || "";
      const region = STATE_TO_REGION[state] || "Other";

      return {
        ...f,
        properties: {
          ...f.properties,
          fips,
          state,
          region,
          projectCount: data?.projectCount || 0,
          totalMw: data?.totalMw || 0,
          intensity: data ? Math.min(data.totalMw / maxCapacity, 1) : 0,
        },
      };
    });

    return { ...countiesGeoJson, features } as FeatureCollection;
  }, [countiesGeoJson, mapData, countyDataLookup, maxCapacity]);

  // Add region to states GeoJSON
  const statesWithRegion = useMemo(() => {
    if (!statesGeoJson) return null;

    const features = statesGeoJson.features.map((f) => {
      const stateFips = String(f.id).padStart(2, "0");
      const state = FIPS_TO_STATE[stateFips] || "";
      const region = STATE_TO_REGION[state] || "Other";

      return {
        ...f,
        properties: {
          ...f.properties,
          state,
          region,
        },
      };
    });

    return { ...statesGeoJson, features } as FeatureCollection;
  }, [statesGeoJson]);

  // Handle hover events
  const onHover = useCallback((event: MapLayerMouseEvent) => {
    const { features, point } = event;
    const hoveredFeature = features?.[0];

    if (hoveredFeature) {
      const props = hoveredFeature.properties;
      setTooltip({
        x: point.x,
        y: point.y,
        county: props?.name,
        state: props?.state,
        region: props?.region,
        projectCount: props?.projectCount,
        totalMw: props?.totalMw,
      });
    } else {
      setTooltip(null);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Free dark map style from CARTO
  const mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  return (
    <div className={`relative ${className}`}>
      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        interactiveLayerIds={["county-fill"]}
        onMouseMove={onHover}
        onMouseLeave={onMouseLeave}
        maxBounds={[[-130, 22], [-65, 52]]}
        minZoom={3}
        maxZoom={10}
      >
        <NavigationControl position="top-right" />

        {countiesWithData && (
          <Source id="counties" type="geojson" data={countiesWithData}>
            <Layer
              id="county-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  [">", ["get", "totalMw"], 0],
                  [
                    "interpolate",
                    ["linear"],
                    ["get", "intensity"],
                    0, "#1e3a5f",
                    0.25, "#3B82F6",
                    0.5, "#60a5fa",
                    0.75, "#93c5fd",
                    1, "#dbeafe",
                  ],
                  "rgba(30, 41, 59, 0.3)",
                ],
                "fill-opacity": 0.8,
              }}
            />
            <Layer
              id="county-line"
              type="line"
              paint={{
                "line-color": "#475569",
                "line-width": 0.5,
                "line-opacity": 0.5,
              }}
            />
          </Source>
        )}

        {statesWithRegion && (
          <Source id="states" type="geojson" data={statesWithRegion}>
            <Layer
              id="state-line"
              type="line"
              paint={{
                "line-color": "#94a3b8",
                "line-width": 1.5,
              }}
            />
            <Layer
              id="region-line"
              type="line"
              paint={{
                "line-color": [
                  "match",
                  ["get", "region"],
                  "CAISO", REGION_COLORS.CAISO,
                  "ERCOT", REGION_COLORS.ERCOT,
                  "MISO", REGION_COLORS.MISO,
                  "PJM", REGION_COLORS.PJM,
                  "SPP", REGION_COLORS.SPP,
                  "NYISO", REGION_COLORS.NYISO,
                  "ISO-NE", REGION_COLORS["ISO-NE"],
                  "West", REGION_COLORS.West,
                  "Southeast", REGION_COLORS.Southeast,
                  "#64748b",
                ],
                "line-width": 2.5,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Tooltip */}
      {tooltip && tooltip.projectCount !== undefined && tooltip.projectCount > 0 && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-slate-900/95 px-3 py-2 text-sm shadow-lg backdrop-blur-sm"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          <div className="font-semibold text-white">
            {tooltip.county}, {tooltip.state}
          </div>
          <div className="text-slate-300">
            {tooltip.projectCount} projects
          </div>
          <div className="text-slate-300">
            {tooltip.totalMw?.toLocaleString()} MW
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Region: {tooltip.region}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-slate-900/90 p-3 backdrop-blur-sm">
        <div className="mb-2 text-xs font-semibold text-white">Capacity (MW)</div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm bg-[#1e3a5f]" />
          <div className="h-3 w-6 rounded-sm bg-[#3B82F6]" />
          <div className="h-3 w-6 rounded-sm bg-[#60a5fa]" />
          <div className="h-3 w-6 rounded-sm bg-[#93c5fd]" />
          <div className="h-3 w-6 rounded-sm bg-[#dbeafe]" />
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>0</span>
          <span>{Math.round(maxCapacity / 2).toLocaleString()}</span>
          <span>{maxCapacity.toLocaleString()}</span>
        </div>

        <div className="mt-3 border-t border-slate-700 pt-2">
          <div className="mb-1 text-xs font-semibold text-white">ISO Regions</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {Object.entries(REGION_COLORS).slice(0, 6).map(([region, color]) => (
              <div key={region} className="flex items-center gap-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300">{region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
