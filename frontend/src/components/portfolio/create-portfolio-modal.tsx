"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import type { Portfolio } from "@/lib/portfolio-store";
import type { ClusterProject } from "@/lib/api";

interface CreatePortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, projectIds: string[]) => void;
  editingPortfolio?: Portfolio | null;
  projects: ClusterProject[];
  isLoading?: boolean;
}

export function CreatePortfolioModal({
  open,
  onOpenChange,
  onSubmit,
  editingPortfolio,
  projects,
  isLoading = false,
}: CreatePortfolioModalProps) {
  const [name, setName] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Reset form when modal opens/closes or editing portfolio changes
  useEffect(() => {
    if (open) {
      if (editingPortfolio) {
        setName(editingPortfolio.name);
        setSelectedProjects(new Set(editingPortfolio.projectIds));
      } else {
        setName("");
        setSelectedProjects(new Set());
      }
      setSearchQuery("");
    }
  }, [open, editingPortfolio]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_id.toLowerCase().includes(query) ||
        p.developer?.toLowerCase().includes(query) ||
        p.utility?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set(selectedProjects);
    filteredProjects.forEach((p) => newSelected.add(p.project_id));
    setSelectedProjects(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedProjects(new Set());
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), Array.from(selectedProjects));
    onOpenChange(false);
  };

  const isEditing = !!editingPortfolio;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Portfolio" : "Create New Portfolio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Portfolio Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Kentucky Solar Projects"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Add Projects</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleClearSelection}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-9 bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Selected count */}
            {selectedProjects.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/20">
                  {selectedProjects.size} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-zinc-400"
                  onClick={handleClearSelection}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            )}

            {/* Project list */}
            <ScrollArea className="h-[250px] rounded-md border border-zinc-800">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  Loading projects...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  No projects found
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.project_id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors ${
                        selectedProjects.has(project.project_id)
                          ? "bg-zinc-800"
                          : ""
                      }`}
                      onClick={() => handleToggleProject(project.project_id)}
                    >
                      <Checkbox
                        checked={selectedProjects.has(project.project_id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {project.project_id}
                          </span>
                          {project.fuel_type && (
                            <Badge
                              variant="outline"
                              className="text-xs border-zinc-700"
                            >
                              {project.fuel_type}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {project.developer || "Unknown"} •{" "}
                          {project.mw_capacity?.toFixed(0) || "—"} MW
                        </div>
                      </div>
                      {project.cost_per_kw && (
                        <div className="text-sm text-zinc-300">
                          ${project.cost_per_kw.toFixed(0)}/kW
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            {isEditing ? "Save Changes" : "Create Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
