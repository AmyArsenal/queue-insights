"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClusterFilterBarProps {
  selectedISO: string;
  selectedCluster: string;
  selectedPhase: string;
  onISOChange: (value: string) => void;
  onClusterChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  availableClusters?: { value: string; label: string; disabled?: boolean }[];
  availablePhases?: { value: string; label: string; disabled?: boolean }[];
}

const DEFAULT_CLUSTERS = [
  { value: "TC2", label: "TC2 (2024)" },
  { value: "TC1", label: "TC1", disabled: true },
  { value: "Cycle1", label: "Cycle 1", disabled: true },
];

const DEFAULT_PHASES = [
  { value: "PHASE_1", label: "Phase 1" },
  { value: "PHASE_2", label: "Phase 2", disabled: true },
  { value: "PHASE_3", label: "Phase 3", disabled: true },
  { value: "ALL", label: "All", disabled: true },
];

export function ClusterFilterBar({
  selectedISO,
  selectedCluster,
  selectedPhase,
  onISOChange,
  onClusterChange,
  onPhaseChange,
  availableClusters = DEFAULT_CLUSTERS,
  availablePhases = DEFAULT_PHASES,
}: ClusterFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      {/* ISO Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">ISO</span>
        <Select value={selectedISO} onValueChange={onISOChange}>
          <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Select ISO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PJM">PJM</SelectItem>
            <SelectItem value="MISO" disabled>
              MISO
            </SelectItem>
            <SelectItem value="CAISO" disabled>
              CAISO
            </SelectItem>
            <SelectItem value="SPP" disabled>
              SPP
            </SelectItem>
            <SelectItem value="ERCOT" disabled>
              ERCOT
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cluster Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Cluster</span>
        <Select value={selectedCluster} onValueChange={onClusterChange}>
          <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Select Cluster" />
          </SelectTrigger>
          <SelectContent>
            {availableClusters.map((cluster) => (
              <SelectItem
                key={cluster.value}
                value={cluster.value}
                disabled={cluster.disabled}
              >
                {cluster.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phase Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Phase</span>
        <Tabs value={selectedPhase} onValueChange={onPhaseChange}>
          <TabsList className="bg-zinc-800 h-9">
            {availablePhases.map((phase) => (
              <TabsTrigger
                key={phase.value}
                value={phase.value}
                disabled={phase.disabled}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm px-3"
              >
                {phase.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
