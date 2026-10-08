"use client";

import React, { CSSProperties } from "react";
import { Box } from "@mui/material";
import { Lock } from "lucide-react";
import { Rundown, RundownRow, RowTiming, fmtClock, fmtDur, scriptStatus, ScriptStatus } from "@/data/rundownData";
import { OCT } from "./octopusTheme";

interface RundownGridProps {
  rundown: Rundown;
  timings: Record<string, RowTiming>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

// [label, width in px — 0 means flexible]
const COLUMNS: [string, number][] = [
  ["Pg", 26],
  ["Ready", 86],
  ["?", 92],
  ["#", 34],
  ["Lck", 30],
  ["MOS", 86],
  ["Format", 108],
  ["Name", 0],
  ["Duration", 66],
  ["Plan dur", 62],
  ["Hit time", 72],
  ["Report…", 62],
  ["Edit…", 46],
  ["Produ…", 52],
  ["Created by", 112],
];

const SCRIPT_CELL: Record<ScriptStatus, CSSProperties> = {
  "NO SCRIPT": { background: OCT.red, color: OCT.redText },
  SCRIPTED: { background: OCT.yellow, color: OCT.black },
  CHECKED: { background: OCT.orange, color: OCT.black },
  VISUALS: { background: OCT.green, color: OCT.black },
};

const MOS_CELL: Record<string, CSSProperties> = {
  "NOT READY": { background: OCT.blue, color: OCT.white, fontStyle: "normal" },
  READY: { background: OCT.white, color: OCT.black, fontStyle: "italic" },
  PLAY: { background: OCT.play, color: OCT.white, fontStyle: "normal" },
};

function rowStyle(row: RundownRow, selected: boolean, onAir: boolean): CSSProperties {
  if (selected) return { background: OCT.black, color: OCT.white };
  if (onAir) return { background: OCT.red, color: OCT.yellow };
  if (row.kind === "segment") return { background: OCT.cyan, color: OCT.black };
  if (row.kind === "break") return { background: OCT.yellow, color: OCT.black };
  if (row.skipped) return { background: OCT.skipped, color: OCT.skippedText, fontStyle: "italic" };
  return { background: OCT.white, color: OCT.black };
}

const RundownGrid: React.FC<RundownGridProps> = ({ rundown, timings, selectedId, onSelect, onOpen }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const index = rundown.rows.findIndex((r) => r.id === selectedId);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = rundown.rows[Math.min(rundown.rows.length - 1, Math.max(0, index + (e.key === "ArrowDown" ? 1 : -1)))];
      if (next) onSelect(next.id);
    } else if (e.key === "Enter" && selectedId) {
      onOpen(selectedId);
    }
  };

  return (
    <Box
      tabIndex={0}
      onKeyDown={handleKeyDown}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        backgroundColor: OCT.white,
        outline: "none",
        "& table": { borderCollapse: "collapse", tableLayout: "fixed", width: "100%", minWidth: 1180 },
        "& th": {
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: OCT.head,
          color: OCT.black,
          fontWeight: 400,
          textAlign: "left",
          border: `1px solid ${OCT.line}`,
          padding: "1px 4px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        },
        "& td": {
          border: `1px solid ${OCT.line}`,
          padding: "1px 4px",
          height: 20,
          whiteSpace: "nowrap",
          overflow: "hidden",
          verticalAlign: "top",
        },
        "& td.num": { textAlign: "right" },
        "& tr": { cursor: "default", userSelect: "none" },
      }}
    >
      <table aria-label={`${rundown.channel} ${rundown.time} rundown`}>
        <colgroup>
          {COLUMNS.map(([label, width]) => (
            <col key={label} style={width ? { width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map(([label]) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rundown.rows.map((row) => {
            const selected = row.id === selectedId;
            const timing = timings[row.id];
            const isStory = row.kind === "story";
            const isSegment = row.kind === "segment";
            const status = scriptStatus(row);
            const over = isStory && row.planDur > 0 && row.duration > row.planDur;
            return (
              <tr
                key={row.id}
                aria-selected={selected}
                style={rowStyle(row, selected, rundown.onAir && row.mos === "PLAY")}
                onClick={() => onSelect(row.id)}
                onDoubleClick={() => onOpen(row.id)}
              >
                <td />
                <td>{row.ready}</td>
                <td style={isStory ? SCRIPT_CELL[status] : undefined}>{isStory ? status : ""}</td>
                <td>{row.page}</td>
                <td>{row.locked && <Lock size={11} aria-label="Locked" />}</td>
                <td style={MOS_CELL[row.mos]}>{row.mos}</td>
                <td>{row.format}</td>
                <td style={selected ? { outline: `1px solid ${OCT.orange}`, outlineOffset: -1 } : undefined}>
                  {isSegment ? (
                    <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <span>↓ {row.name}</span>
                      <Box component="span" sx={{ backgroundColor: OCT.red, color: OCT.yellow, px: "3px", fontStyle: "normal" }}>
                        [0:00] +{fmtDur(timing.segSum)}
                      </Box>
                    </Box>
                  ) : (
                    row.name
                  )}
                </td>
                <td
                  className="num"
                  style={
                    isSegment
                      ? { background: OCT.red, color: OCT.yellow }
                      : over
                        ? { background: OCT.red, color: OCT.white }
                        : undefined
                  }
                >
                  {isSegment ? `∑ ${fmtDur(timing.segSum)}` : fmtDur(row.duration)}
                </td>
                <td className="num">{isSegment ? `∑ ${fmtDur(timing.segPlan)}` : fmtDur(row.planDur)}</td>
                <td className="num">{timing.hit === null ? "" : fmtClock(timing.hit)}</td>
                <td>{row.reporters}</td>
                <td>{row.editors}</td>
                <td>{row.producer}</td>
                <td>{row.createdBy}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
};

export default RundownGrid;
