"use client";

import React, { ReactNode, useState } from "react";
import { Box } from "@mui/material";
import {
  Binoculars,
  CircleArrowLeft,
  CircleArrowRight,
  CircleX,
  Layers,
  Pencil,
  Play,
  Printer,
  Save,
  Settings,
  Star,
  Wrench,
} from "lucide-react";
import {
  RundownRow,
  VoVtBlock,
  fmtDur,
  fmtTimecode,
  parseDur,
  readTime,
  scriptStatus,
  voVtTotal,
} from "@/data/rundownData";
import { OCT } from "./octopusTheme";

// ─── Shared pieces ────────────────────────────────────────────────────────────
const STATUS_SQUARE: Record<string, { bg: string; label: string }> = {
  "NO SCRIPT": { bg: OCT.red, label: "NO SCRIPT" },
  SCRIPTED: { bg: OCT.yellow, label: "SCRIPT" },
  CHECKED: { bg: OCT.orange, label: "CHECKED" },
  VISUALS: { bg: OCT.green, label: "VISUALS" },
};

const StatusSquare: React.FC<{ row: RundownRow; size: number }> = ({ row, size }) => {
  const s = STATUS_SQUARE[scriptStatus(row)];
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: s.bg,
        color: OCT.black,
        fontSize: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {s.label}
    </Box>
  );
};

const IconButton: React.FC<{ label: string; icon: ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean }> = ({
  label,
  icon,
  onClick,
  disabled,
  active,
}) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1px",
      border: 0,
      background: active ? "#cfe6fb" : "none",
      color: OCT.black,
      font: "inherit",
      fontSize: 11,
      padding: "2px 5px",
      cursor: "pointer",
      "&:hover:not(:disabled)": { backgroundColor: "#dcebf9" },
      "&:disabled": { opacity: 0.4, cursor: "default" },
    }}
  >
    {icon}
    {label}
  </Box>
);

const Flags: React.FC<{ row: RundownRow; onChange?: (patch: Partial<RundownRow>) => void; withVisuals?: boolean }> = ({
  row,
  onChange,
  withVisuals,
}) => (
  <>
    {(["scripted", "checked", ...(withVisuals ? ["visuals"] : [])] as ("scripted" | "checked" | "visuals")[]).map((flag) => (
      <Box component="label" key={flag} sx={{ display: "flex", alignItems: "center", gap: "3px", color: "#555" }}>
        <input
          type="checkbox"
          checked={row[flag]}
          disabled={!onChange}
          onChange={(e) => onChange?.({ [flag]: e.target.checked })}
          style={{ margin: 0 }}
        />
        {flag.toUpperCase()}
      </Box>
    ))}
  </>
);

/** Grey block bar with the blue label and orange end cap (LINK, VO/VT). */
const BlockBar: React.FC<{ label: string; labelWidth: number; right: string; rightBg?: string; children?: ReactNode }> = ({
  label,
  labelWidth,
  right,
  rightBg = OCT.white,
  children,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", backgroundColor: OCT.bar, height: 20 }}>
    <Box sx={{ width: labelWidth, flexShrink: 0, alignSelf: "stretch", backgroundColor: OCT.barLabel, color: OCT.white, fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", pl: "4px" }}>
      {label}
    </Box>
    <Box sx={{ width: 10, flexShrink: 0, alignSelf: "stretch", backgroundColor: OCT.barCap }} />
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "4px", pl: "4px" }}>{children}</Box>
    <Box sx={{ color: OCT.white, fontSize: 10, pr: "2px" }}>D:</Box>
    <Box sx={{ backgroundColor: rightBg, color: OCT.black, fontSize: 10, px: "3px", mr: "4px", border: "1px solid #888" }}>{right}</Box>
  </Box>
);

const ReadyBadge: React.FC<{ ready: boolean; onClick?: () => void }> = ({ ready, onClick }) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={!onClick}
    title={onClick ? "Toggle clip status" : undefined}
    sx={{
      border: 0,
      font: "inherit",
      fontSize: 10,
      fontWeight: 700,
      px: "5px",
      alignSelf: "stretch",
      backgroundColor: ready ? "transparent" : OCT.red,
      color: OCT.white,
      cursor: onClick ? "pointer" : "default",
    }}
  >
    {ready ? "READY" : "NOT READY"}
  </Box>
);

const metaLine = (row: RundownRow) => `C: ${row.createdBy}  Duration: ${fmtDur(row.duration)}  Scheduled: ${fmtDur(row.planDur)}`;

// ─── Right-hand preview pane ──────────────────────────────────────────────────
interface PreviewPaneProps {
  row: RundownRow | null;
  onPrev: () => void;
  onNext: () => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ row, onPrev, onNext }) => {
  const linkDur = row ? readTime(row.scriptText) : 0;
  return (
    <Box
      component="aside"
      aria-label="Script preview"
      sx={{ width: 244, flexShrink: 0, display: "flex", flexDirection: "column", backgroundColor: OCT.white, borderLeft: `1px solid ${OCT.line}`, minHeight: 0 }}
    >
      <Box sx={{ backgroundColor: OCT.navy, color: OCT.white, p: "3px 5px", minHeight: 52, fontSize: 10 }}>
        <Box sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{row?.name ?? ""}</Box>
        {row && <Box sx={{ whiteSpace: "pre-wrap" }}>{metaLine(row)}</Box>}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "4px", p: "3px 4px" }}>
        {row && row.kind === "story" ? <StatusSquare row={row} size={34} /> : <Box sx={{ width: 34, height: 34, border: `1px solid ${OCT.line}` }} />}
        <IconButton label="Previous" icon={<CircleArrowLeft size={18} color={OCT.blue} />} onClick={onPrev} />
        <IconButton label="Next" icon={<CircleArrowRight size={18} color={OCT.blue} />} onClick={onNext} />
        <Box sx={{ flex: 1 }} />
        <Star size={18} color="#555" />
      </Box>

      {row && row.kind === "story" && (row.scriptText || row.voVt.length > 0) ? (
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", px: "5px", fontSize: 10 }}>
            <Flags row={row} />
            <Box sx={{ flex: 1 }} />
            <span>Duration: {fmtTimecode(row.duration)}</span>
          </Box>
          <Box sx={{ display: "flex", gap: "8px", px: "5px", py: "2px", fontSize: 10 }}>
            <Box component="span" sx={{ borderBottom: `1px solid ${OCT.black}` }}>Script</Box>
            <span>History</span>
          </Box>
          <BlockBar label="LINK" labelWidth={64} right={fmtTimecode(linkDur)} />
          <Box sx={{ p: "4px 6px", fontSize: 15, lineHeight: 1.35, whiteSpace: "pre-wrap", color: OCT.black }}>{row.scriptText}</Box>
          {row.voVt.map((block) => (
            <Box key={block.id} sx={{ mb: "4px" }}>
              <BlockBar label="VO/VT" labelWidth={64} right={fmtTimecode(parseDur(block.dur))} rightBg={OCT.barCap}>
                <ReadyBadge ready={block.ready} />
              </BlockBar>
              <Box sx={{ backgroundColor: OCT.bar, display: "flex", gap: "4px", p: "2px 4px", fontSize: 10 }}>
                <Box sx={{ flex: 1, backgroundColor: OCT.white, px: "3px", overflow: "hidden", whiteSpace: "nowrap" }}>{block.name}</Box>
                <Box sx={{ color: OCT.white }}>ID:</Box>
                <Box sx={{ width: 70, backgroundColor: OCT.white, px: "3px" }}>{block.clipId}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 10 }}>
          (no script available)
        </Box>
      )}
    </Box>
  );
};

// ─── Full script editor ───────────────────────────────────────────────────────
interface ScriptEditorProps {
  row: RundownRow;
  onChange: (patch: Partial<RundownRow>) => void;
  onEditSlug: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

const fieldStyle: React.CSSProperties = {
  border: "1px solid #888",
  background: OCT.white,
  color: OCT.black,
  font: "inherit",
  padding: "1px 4px",
  height: 20,
  minWidth: 0,
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ row, onChange, onEditSlug, onPrev, onNext, onClose }) => {
  const [tab, setTab] = useState<"script" | "history">("script");
  const linkDur = readTime(row.scriptText);

  const changeText = (scriptText: string) =>
    onChange({ scriptText, scripted: scriptText.trim() !== "", duration: readTime(scriptText) + voVtTotal(row.voVt) });

  const changeBlock = (id: string, patch: Partial<VoVtBlock>) => {
    const voVt = row.voVt.map((b) => (b.id === id ? { ...b, ...patch } : b));
    onChange({ voVt, duration: linkDur + voVtTotal(voVt) });
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", backgroundColor: OCT.white, minHeight: 0 }}>
      <Box sx={{ backgroundColor: OCT.navy, color: OCT.white, fontWeight: 700, p: "2px 5px", whiteSpace: "pre-wrap" }}>
        {row.name}  {metaLine(row)}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "2px", p: "2px 0" }}>
        <StatusSquare row={row} size={38} />
        <IconButton label="Previous" icon={<CircleArrowLeft size={18} color={OCT.blue} />} onClick={onPrev} />
        <IconButton label="Next" icon={<CircleArrowRight size={18} color={OCT.blue} />} onClick={onNext} />
        <IconButton label="Edit" icon={<Pencil size={18} color="#c77700" />} onClick={onEditSlug} />
        <IconButton label="Save" icon={<Save size={18} color="#777" />} disabled />
        <IconButton label="Technical" icon={<Layers size={18} color="#c9a100" />} disabled />
        <IconButton label="Assets" icon={<Layers size={18} color="#3f7fc4" />} active />
        <IconButton label="Locate" icon={<Binoculars size={18} color="#7a1010" />} disabled />
        <IconButton label="Config" icon={<Wrench size={18} color="#c77700" />} disabled />
        <IconButton label="Print" icon={<Printer size={18} color="#555" />} onClick={() => window.print()} />
        <IconButton label="Close" icon={<CircleX size={18} color={OCT.blue} />} onClick={onClose} />
        <Box sx={{ flex: 1 }} />
        <Star size={18} color="#555" style={{ marginRight: 8 }} />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "12px", px: "6px", py: "2px" }}>
        <Flags row={row} onChange={onChange} withVisuals />
        <Box sx={{ flex: 1 }} />
        <span>Duration:</span>
        <Box sx={{ ...fieldStyle, display: "flex", alignItems: "center" }}>{fmtTimecode(row.duration)}</Box>
      </Box>

      <Box role="tablist" sx={{ display: "flex", gap: "2px", px: "6px", pt: "4px" }}>
        {(["script", "history"] as const).map((t) => (
          <Box
            component="button"
            role="tab"
            key={t}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            sx={{
              border: 0,
              background: "none",
              font: "inherit",
              color: OCT.black,
              cursor: "pointer",
              padding: "1px 4px",
              borderBottom: tab === t ? `1px solid ${OCT.black}` : "1px solid transparent",
              textTransform: "capitalize",
            }}
          >
            {t}
          </Box>
        ))}
      </Box>

      {tab === "history" ? (
        <Box sx={{ p: "8px", color: "#555" }}>Created by {row.createdBy}. No later changes recorded.</Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, p: "2px 4px" }}>
          <BlockBar label="LINK" labelWidth={84} right={fmtTimecode(linkDur)} />
          <Box sx={{ backgroundColor: OCT.barBody, mb: "6px" }}>
            <Box
              component="textarea"
              aria-label="Link script"
              value={row.scriptText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => changeText(e.target.value)}
              sx={{
                display: "block",
                width: "100%",
                minHeight: 84,
                resize: "vertical",
                border: 0,
                outline: "none",
                background: "transparent",
                color: OCT.black,
                font: "inherit",
                fontSize: 19,
                lineHeight: 1.35,
                padding: "4px 8px",
              }}
            />
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: OCT.barLabel, color: OCT.white, fontWeight: 700, fontSize: 10, p: "3px 4px" }}>
              DUR
              <Box sx={{ backgroundColor: OCT.white, color: OCT.black, fontWeight: 400, px: "6px", minWidth: 40, textAlign: "right" }}>{fmtDur(linkDur)}</Box>
            </Box>
          </Box>

          {row.voVt.map((block) => (
            <Box key={block.id} sx={{ mb: "6px" }}>
              <BlockBar label="VO/VT" labelWidth={84} right={fmtTimecode(parseDur(block.dur))} rightBg={OCT.barCap}>
                <ReadyBadge ready={block.ready} onClick={() => changeBlock(block.id, { ready: !block.ready })} />
                {block.ready && <Play size={11} color={OCT.barLabel} fill={OCT.barLabel} />}
                <Settings size={11} color={OCT.white} />
              </BlockBar>
              <Box sx={{ backgroundColor: OCT.bar, display: "flex", alignItems: "center", gap: "5px", p: "2px 4px 3px", color: OCT.white, fontSize: 10 }}>
                Name:
                <input aria-label="Clip name" style={{ ...fieldStyle, width: 210 }} value={block.name} onChange={(e) => changeBlock(block.id, { name: e.target.value })} />
                ID:
                <input aria-label="Clip ID" style={{ ...fieldStyle, width: 210 }} value={block.clipId} onChange={(e) => changeBlock(block.id, { clipId: e.target.value })} />
                DUR:
                <input aria-label="Clip duration (m:ss)" style={{ ...fieldStyle, width: 70 }} value={block.dur} onChange={(e) => changeBlock(block.id, { dur: e.target.value })} />
              </Box>
              <Box sx={{ backgroundColor: OCT.barBody, height: 26 }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export { IconButton };
