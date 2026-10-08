"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
  Binoculars,
  CircleX,
  Cog,
  Eye,
  FilePlus,
  FileX,
  LayoutList,
  ListOrdered,
  Lock,
  PanelRight,
  Pencil,
  Printer,
  Radio,
  ScrollText,
  SkipForward,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import {
  CHANNEL,
  Rundown,
  RundownRow,
  TEMPLATES,
  buildRundown,
  computeTimings,
  fmtDur,
  makeRow,
  makeVoVt,
  parseDur,
  totalDuration,
} from "@/data/rundownData";
import { OCT, OCT_FONT } from "./octopusTheme";
import RundownGrid from "./RundownGrid";
import DeskSidebar from "./DeskSidebar";
import { IconButton, PreviewPane, ScriptEditor } from "./ScriptPanels";
import { MosDialog, SelectRundownDialog, SlugDialog, SlugValues } from "./DeskDialogs";

type DialogState = { type: "slug"; rowId: string | null } | { type: "rundown" } | { type: "mos" } | null;

const INITIAL_TABS = ["05:00", "15:00", "09:00"];

interface RundownDeskProps {
  username: string;
  onLogout: () => void;
}

const RundownDesk: React.FC<RundownDeskProps> = ({ username, onLogout }) => {
  const [rundowns, setRundowns] = useState<Record<string, Rundown>>(() =>
    Object.fromEntries(INITIAL_TABS.map((time) => [time, buildRundown(time)]))
  );
  const [tabs, setTabs] = useState<string[]>(INITIAL_TABS);
  const [activeTime, setActiveTime] = useState("09:00");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rundown = rundowns[activeTime];
  const timings = useMemo(() => computeTimings(rundown), [rundown]);
  const selected = rundown.rows.find((r) => r.id === selectedId) ?? null;
  const selectedStory = selected?.kind === "story" ? selected : null;
  const total = totalDuration(rundown);
  const diff = total - rundown.planned;
  const ready = rundown.rows.every((r) => r.kind !== "story" || r.skipped || r.ready === "READY");

  // ─── Rundown / tab actions ──────────────────────────────────────────────────
  const openRundown = (time: string) => {
    setRundowns((prev) => (prev[time] ? prev : { ...prev, [time]: buildRundown(time) }));
    setTabs((prev) => (prev.includes(time) ? prev : [...prev, time]));
    setActiveTime(time);
    setSelectedId(null);
    setEditorOpen(false);
    setDialog(null);
  };

  const closeTab = (time: string) => {
    if (tabs.length === 1) return;
    const rest = tabs.filter((t) => t !== time);
    setTabs(rest);
    if (time === activeTime) {
      setActiveTime(rest[rest.length - 1]);
      setSelectedId(null);
      setEditorOpen(false);
    }
  };

  // ─── Row actions ────────────────────────────────────────────────────────────
  const setRows = (update: (rows: RundownRow[]) => RundownRow[]) =>
    setRundowns((prev) => ({ ...prev, [activeTime]: { ...prev[activeTime], rows: update(prev[activeTime].rows) } }));

  const updateRow = (id: string, patch: Partial<RundownRow>) =>
    setRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const moveSelection = (step: number) => {
    const index = rundown.rows.findIndex((r) => r.id === selectedId);
    const next = rundown.rows[Math.min(rundown.rows.length - 1, Math.max(0, index + step))];
    if (next) setSelectedId(next.id);
  };

  const openScript = (id: string) => {
    setSelectedId(id);
    if (rundown.rows.find((r) => r.id === id)?.kind === "story") setEditorOpen(true);
  };

  const removeSelected = () => {
    if (!selected || selected.locked) return;
    setRows((rows) => rows.filter((r) => r.id !== selected.id));
    setSelectedId(null);
    setEditorOpen(false);
  };

  const renumber = () =>
    setRows((rows) => {
      let page = 0;
      return rows.map((r) => (r.kind === "story" && !r.skipped ? { ...r, page: String(++page) } : { ...r, page: "" }));
    });

  const submitSlug = (values: SlugValues, rowId: string | null) => {
    const template = TEMPLATES.find((t) => t.label === values.template) ?? TEMPLATES[0];
    const patch = {
      name: values.name.trim(),
      planDur: parseDur(values.planDur),
      format: template.format,
      page: values.page,
      tags: values.tags,
      reporters: values.reporters,
      locations: values.locations,
      producer: values.producer,
      editors: values.editors,
    };
    const blocks = (existing: RundownRow["voVt"]) =>
      Array.from({ length: template.blocks }, (_, i) => existing[i] ?? makeVoVt());

    if (rowId) {
      setRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, ...patch, voVt: blocks(r.voVt) } : r)));
    } else {
      const row = makeRow({ ...patch, ready: "NOT READY", createdBy: username, voVt: blocks([]) });
      setRows((rows) => {
        const at = rows.findIndex((r) => r.id === selectedId);
        return at === -1 ? [...rows, row] : [...rows.slice(0, at + 1), row, ...rows.slice(at + 1)];
      });
      setSelectedId(row.id);
    }
    setDialog(null);
  };

  const title = `${CHANNEL} ${rundown.time}`;
  const noStory = !selectedStory;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        minHeight: 480,
        backgroundColor: OCT.panel,
        color: OCT.black,
        fontFamily: OCT_FONT,
        fontSize: 12,
        lineHeight: 1.3,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <DeskSidebar activeTime={activeTime} onOpenRundown={openRundown} />

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          <Box role="tablist" sx={{ display: "flex", overflowX: "auto", backgroundColor: OCT.white, flexShrink: 0 }}>
            {tabs.map((time) => (
              <Box
                key={time}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  px: "8px",
                  py: "3px",
                  whiteSpace: "nowrap",
                  borderRight: `1px solid ${OCT.black}`,
                  ...(time === activeTime && { fontWeight: 700, borderTop: `2px solid ${OCT.black}` }),
                }}
              >
                <Box
                  component="button"
                  role="tab"
                  aria-selected={time === activeTime}
                  onClick={() => openRundown(time)}
                  sx={{ border: 0, background: "none", font: "inherit", color: OCT.black, cursor: "pointer", p: 0 }}
                >
                  {CHANNEL} {time}
                </Box>
                <Box
                  component="button"
                  aria-label={`Close ${CHANNEL} ${time}`}
                  onClick={() => closeTab(time)}
                  sx={{ border: 0, background: "none", cursor: "pointer", display: "flex", p: 0, color: "#555" }}
                >
                  <CircleX size={12} />
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
            {editorOpen && selectedStory ? (
              <ScriptEditor
                key={selectedStory.id}
                row={selectedStory}
                onChange={(patch) => updateRow(selectedStory.id, patch)}
                onEditSlug={() => setDialog({ type: "slug", rowId: selectedStory.id })}
                onPrev={() => moveSelection(-1)}
                onNext={() => moveSelection(1)}
                onClose={() => setEditorOpen(false)}
              />
            ) : (
              <>
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  {/* Rundown status strip */}
                  <Box sx={{ backgroundColor: OCT.navy, color: OCT.white, fontWeight: 700, fontSize: 11, p: "1px 5px", display: "flex", gap: "5px", flexShrink: 0 }}>
                    <span>{title} {ready ? "READY" : "NOT READY"}</span>
                    {rundown.onAir && <Box component="span" sx={{ backgroundColor: OCT.red, px: "3px" }}>ON AIR</Box>}
                    {rundown.onAir && <span>Active at WASP STRATUS PROMPTER2</span>}
                    {rundown.archived && <Box component="span" sx={{ backgroundColor: OCT.red, px: "3px" }}>ARCHIVED</Box>}
                  </Box>

                  {/* Toolbar */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", backgroundColor: OCT.white, flexShrink: 0, py: "2px" }}>
                    <IconButton label="Rundown" icon={<LayoutList size={18} color="#2b5fa8" />} onClick={() => setDialog({ type: "rundown" })} />
                    <IconButton label="New" icon={<FilePlus size={18} color="#777" />} onClick={() => setDialog({ type: "slug", rowId: null })} />
                    <IconButton label="Edit" icon={<Pencil size={18} color="#c77700" />} disabled={noStory} onClick={() => selectedStory && setDialog({ type: "slug", rowId: selectedStory.id })} />
                    <IconButton label="Locate" icon={<Binoculars size={18} color="#7a1010" />} disabled />
                    <IconButton label="Lock" icon={<Lock size={18} color="#e06a00" />} disabled={!selected} onClick={() => selected && updateRow(selected.id, { locked: !selected.locked })} />
                    <IconButton label="Preview" icon={<PanelRight size={18} color="#2b5fa8" />} active={showPreview} onClick={() => setShowPreview((v) => !v)} />
                    <IconButton label="Script" icon={<ScrollText size={18} color="#2b5fa8" />} disabled={noStory} onClick={() => setEditorOpen(true)} />
                    <IconButton label="Skip" icon={<SkipForward size={18} color="#444" />} disabled={!selected} onClick={() => selected && updateRow(selected.id, { skipped: !selected.skipped })} />
                    <IconButton label="Remove" icon={<FileX size={18} color="#d00000" />} disabled={!selected || selected.locked} onClick={removeSelected} />
                    <IconButton label="Action" icon={<Cog size={18} color="#6f8fbf" />} disabled />
                    <IconButton label="Renumber" icon={<ListOrdered size={18} color="#444" />} onClick={renumber} />
                    <IconButton label="Timer" icon={<Timer size={18} color="#1e88e5" />} disabled />
                    <IconButton label="Buddy" icon={<Users size={18} color="#2b5fa8" />} disabled />
                    <IconButton label="MOS" icon={<Radio size={18} color="#111" />} onClick={() => setDialog({ type: "mos" })} />
                    <IconButton label="Print" icon={<Printer size={18} color="#555" />} onClick={() => window.print()} />
                    <IconButton label="Config" icon={<Wrench size={18} color="#c77700" />} disabled />
                  </Box>

                  <RundownGrid rundown={rundown} timings={timings} selectedId={selectedId} onSelect={setSelectedId} onOpen={openScript} />

                  {/* Grid footer */}
                  <Box sx={{ backgroundColor: OCT.white, borderTop: `1px solid ${OCT.line}`, p: "2px 6px", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box>
                        Items: {rundown.rows.length} &nbsp;Selected items: {selected ? 1 : 0} &nbsp;
                        <Box component="span" sx={{ color: OCT.link, textDecoration: "underline" }}>Expand All</Box>{" "}
                        <Box component="span" sx={{ color: OCT.link, textDecoration: "underline" }}>Collapse All</Box>
                      </Box>
                      <Box>
                        Rundown duration: {fmtDur(total)} [ {fmtDur(rundown.planned)} ]{" "}
                        <Box component="span" sx={{ backgroundColor: diff > 0 ? OCT.red : OCT.blue, color: OCT.yellow, fontWeight: 700, px: "3px" }}>
                          {diff >= 0 ? "+" : "-"}{fmtDur(Math.abs(diff))}
                        </Box>
                        &nbsp;&nbsp; Selected slug durations (playable/skipped):{" "}
                        {fmtDur(selected && !selected.skipped ? selected.duration : 0)} / {fmtDur(selected?.skipped ? selected.duration : 0)}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", border: `1px solid ${OCT.line}`, borderRadius: "3px", px: "8px", py: "1px" }}>
                      <Eye size={12} /> Follow
                    </Box>
                  </Box>
                </Box>

                {showPreview && <PreviewPane row={selected} onPrev={() => moveSelection(-1)} onNext={() => moveSelection(1)} />}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom status bar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", borderTop: `1px solid ${OCT.line}`, px: "6px", height: 18, fontSize: 10, flexShrink: 0 }}>
        <Box sx={{ backgroundColor: "#00c832", color: OCT.white, px: "8px" }}>● OCTOPUS-FINDIA</Box>
        <span>{now ? `${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-GB")}` : ""}</span>
        <span>100</span>
        <span>{username}</span>
        <Box
          component="button"
          onClick={onLogout}
          sx={{ border: 0, background: "none", font: "inherit", color: OCT.link, textDecoration: "underline", cursor: "pointer", p: 0 }}
        >
          Logout
        </Box>
      </Box>

      {dialog?.type === "slug" && (
        <SlugDialog
          row={rundown.rows.find((r) => r.id === dialog.rowId) ?? null}
          onSubmit={(values) => submitSlug(values, dialog.rowId)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "rundown" && <SelectRundownDialog onPick={openRundown} onClose={() => setDialog(null)} />}
      {dialog?.type === "mos" && <MosDialog onClose={() => setDialog(null)} />}
    </Box>
  );
};

export default RundownDesk;
