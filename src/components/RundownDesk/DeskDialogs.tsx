"use client";

import React, { ReactNode, useState } from "react";
import { Box } from "@mui/material";
import { X } from "lucide-react";
import { BULLETIN_SLOTS, CHANNEL, LOCATIONS, RundownRow, TEMPLATES, fmtDur } from "@/data/rundownData";
import { OCT, OCT_FONT } from "./octopusTheme";

// ─── Window-style dialog frame ────────────────────────────────────────────────
interface DialogFrameProps {
  title: string;
  width: number;
  onClose: () => void;
  onOk: () => void;
  okDisabled?: boolean;
  children: ReactNode;
}

const buttonSx = {
  minWidth: 96,
  height: 26,
  border: "1px solid #adadad",
  borderRadius: "3px",
  backgroundColor: "#fdfdfd",
  color: OCT.black,
  font: "inherit",
  cursor: "pointer",
  "&:disabled": { opacity: 0.5, cursor: "default" },
};

const DialogFrame: React.FC<DialogFrameProps> = ({ title, width, onClose, onOk, okDisabled, children }) => (
  <Box
    onKeyDown={(e) => e.key === "Escape" && onClose()}
    sx={{ position: "fixed", inset: 0, zIndex: 1400, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)", p: 2 }}
  >
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={title}
      sx={{
        width,
        maxWidth: "100%",
        maxHeight: "100%",
        overflowY: "auto",
        backgroundColor: OCT.panel,
        color: OCT.black,
        border: "1px solid #999",
        borderRadius: "6px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        fontFamily: OCT_FONT,
        fontSize: 12,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px", p: "6px 8px" }}>
        <Box sx={{ width: 16, height: 16, backgroundColor: OCT.navy, color: OCT.white, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>Ω</Box>
        <Box sx={{ flex: 1 }}>{title}</Box>
        <Box component="button" aria-label="Close" onClick={onClose} sx={{ border: 0, background: "none", cursor: "pointer", display: "flex", color: OCT.black }}>
          <X size={15} />
        </Box>
      </Box>
      <Box sx={{ p: "6px 14px" }}>{children}</Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: "8px", p: "12px" }}>
        <Box component="button" onClick={onOk} disabled={okDisabled} sx={{ ...buttonSx, borderColor: "#0067c0" }}>OK</Box>
        <Box component="button" onClick={onClose} sx={buttonSx}>Cancel</Box>
      </Box>
    </Box>
  </Box>
);

const GroupBox: React.FC<{ legend: string; children: ReactNode }> = ({ legend, children }) => (
  <Box component="fieldset" sx={{ border: "1px solid #a0a0a0", m: 0, mb: "8px", p: "6px 6px 8px", minWidth: 0 }}>
    <Box component="legend" sx={{ px: "4px" }}>{legend}</Box>
    {children}
  </Box>
);

const inputStyle: React.CSSProperties = {
  border: "1px solid #7a7a7a",
  background: OCT.white,
  color: OCT.black,
  font: "inherit",
  padding: "2px 4px",
  height: 22,
  minWidth: 0,
};

// ─── Slug dialog ──────────────────────────────────────────────────────────────
export interface SlugValues {
  name: string;
  planDur: string;
  template: string;
  page: string;
  tags: string;
  reporters: string;
  locations: string;
  producer: string;
  editors: string;
}

interface SlugDialogProps {
  row: RundownRow | null;
  onSubmit: (values: SlugValues) => void;
  onClose: () => void;
}

const todayLabel = () => new Date().toLocaleDateString("en-GB");

export const SlugDialog: React.FC<SlugDialogProps> = ({ row, onSubmit, onClose }) => {
  const [values, setValues] = useState<SlugValues>(() => ({
    name: row?.name ?? "",
    planDur: fmtDur(row?.planDur ?? 0),
    template: TEMPLATES.find((t) => t.format === row?.format)?.label ?? TEMPLATES[0].label,
    page: row?.page ?? "",
    tags: row?.tags ?? "",
    reporters: row?.reporters ?? "",
    locations: row?.locations ?? "",
    producer: row?.producer ?? "",
    editors: row?.editors ?? "",
  }));
  const [schedule] = useState(todayLabel);
  const set = (key: keyof SlugValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  const valid = values.name.trim() !== "";

  return (
    <DialogFrame title="Slug" width={680} onClose={onClose} onOk={() => valid && onSubmit(values)} okDisabled={!valid}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "8px" }}>
        <b>Type:</b>
        <select aria-label="Type" style={{ ...inputStyle, width: 100 }} defaultValue="Story">
          <option>Story</option>
        </select>
      </Box>

      <GroupBox legend="Slug">
        <Box sx={{ display: "grid", gridTemplateColumns: "76px 1fr", alignItems: "center", rowGap: "6px", columnGap: "4px" }}>
          <Box component="label" htmlFor="slug-name" sx={{ color: OCT.blue, fontWeight: 700, textAlign: "right" }}>Name:</Box>
          <input id="slug-name" autoFocus style={inputStyle} value={values.name} onChange={set("name")} onKeyDown={(e) => e.key === "Enter" && valid && onSubmit(values)} />

          <Box component="label" htmlFor="slug-plan" sx={{ fontWeight: 700, textAlign: "right" }}>Planned dur:</Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <input id="slug-plan" style={{ ...inputStyle, width: 56, textAlign: "right" }} value={values.planDur} onChange={set("planDur")} />
            <label htmlFor="slug-template">Template:</label>
            <select id="slug-template" style={{ ...inputStyle, width: 170 }} value={values.template} onChange={set("template")}>
              {TEMPLATES.map((t) => (
                <option key={t.label}>{t.label}</option>
              ))}
            </select>
            <label htmlFor="slug-page">Page:</label>
            <input id="slug-page" style={{ ...inputStyle, width: 44 }} value={values.page} onChange={set("page")} />
            <label htmlFor="slug-schedule">Schedule:</label>
            <input id="slug-schedule" style={{ ...inputStyle, width: 84 }} value={schedule} readOnly />
          </Box>

          <Box component="label" htmlFor="slug-tags" sx={{ textAlign: "right", alignSelf: "start", pt: "4px" }}>Tags:</Box>
          <textarea id="slug-tags" placeholder="Start typing..." style={{ ...inputStyle, height: 58, resize: "none" }} value={values.tags} onChange={set("tags")} />
        </Box>
      </GroupBox>

      <Box sx={{ display: "inline-block", border: "1px solid #a0a0a0", borderBottom: 0, backgroundColor: OCT.white, p: "2px 8px" }}>Basic</Box>
      <Box sx={{ border: "1px solid #dcdcdc", p: "6px" }}>
        <GroupBox legend="Story">
          <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr", alignItems: "start", columnGap: "4px" }}>
            <label htmlFor="slug-reporters">Reporters:</label>
            <textarea id="slug-reporters" placeholder="Start typing / press F4..." style={{ ...inputStyle, height: 56, resize: "none" }} value={values.reporters} onChange={set("reporters")} />
          </Box>
        </GroupBox>
        <GroupBox legend="Custom fields">
          <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr 64px 1fr", alignItems: "center", rowGap: "6px", columnGap: "4px", pt: "40px", pb: "30px" }}>
            <Box component="label" htmlFor="slug-locations" sx={{ textAlign: "right" }}>Locations:</Box>
            <input id="slug-locations" list="slug-location-list" placeholder="Start typing / press F4..." style={inputStyle} value={values.locations} onChange={set("locations")} />
            <Box component="label" htmlFor="slug-producer" sx={{ textAlign: "right" }}>Producer:</Box>
            <input id="slug-producer" style={inputStyle} value={values.producer} onChange={set("producer")} />
            <Box component="label" htmlFor="slug-editors" sx={{ textAlign: "right" }}>Editors:</Box>
            <input id="slug-editors" style={inputStyle} value={values.editors} onChange={set("editors")} />
          </Box>
          <datalist id="slug-location-list">
            {LOCATIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </GroupBox>
      </Box>
    </DialogFrame>
  );
};

// ─── Select rundown dialog ────────────────────────────────────────────────────
interface SelectRundownDialogProps {
  onPick: (time: string) => void;
  onClose: () => void;
}

const BLOCKS = [20, 16, 12, 8, 4, 0];
const pad = (n: number) => String(n).padStart(2, "0");

const treeRow = (level: number, selected = false) => ({
  display: "block",
  width: "100%",
  border: 0,
  borderBottom: "1px solid #e8f0fb",
  textAlign: "left" as const,
  font: "inherit",
  color: selected ? OCT.white : level < 2 ? OCT.white : OCT.black,
  backgroundColor: selected ? OCT.navy : ["#4a8fdc", "#5d9be0", "#8fb8ec", "#c3d8f5"][level],
  padding: `2px 6px 2px ${6 + level * 14}px`,
  cursor: "pointer",
});

export const SelectRundownDialog: React.FC<SelectRundownDialogProps> = ({ onPick, onClose }) => {
  const [openBlock, setOpenBlock] = useState<number | null>(12);
  const [picked, setPicked] = useState<string | null>(null);
  const [day] = useState(() => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long" }));

  return (
    <DialogFrame title="Select rundown..." width={460} onClose={onClose} onOk={() => picked && onPick(picked)} okDisabled={!picked}>
      <Box sx={{ border: "1px solid #a0a0a0", backgroundColor: OCT.white, height: 380, overflowY: "auto" }}>
        <Box sx={treeRow(0)}>{CHANNEL}</Box>
        <Box sx={treeRow(1)}>Not scheduled</Box>
        <Box sx={treeRow(1)}>{day}</Box>
        {BLOCKS.map((start) => (
          <React.Fragment key={start}>
            <Box component="button" aria-expanded={openBlock === start} onClick={() => setOpenBlock(openBlock === start ? null : start)} sx={treeRow(2)}>
              {pad(start)}:00-{pad(start + 3)}:59
            </Box>
            {openBlock === start &&
              BULLETIN_SLOTS.filter((t) => Math.floor(parseInt(t, 10) / 4) * 4 === start).map((time) => (
                <Box
                  component="button"
                  key={time}
                  onClick={() => setPicked(time)}
                  onDoubleClick={() => onPick(time)}
                  sx={treeRow(3, picked === time)}
                >
                  {CHANNEL} {time}
                </Box>
              ))}
          </React.Fragment>
        ))}
      </Box>
    </DialogFrame>
  );
};

// ─── MOS activation dialog ────────────────────────────────────────────────────
const DEVICES = [
  { name: "WASP", connected: true },
  { name: "STRATUS", connected: true },
  { name: "PROMPTER", connected: false },
  { name: "PROMPTER2", connected: true },
];

export const MosDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [active, setActive] = useState<Record<string, boolean>>({ WASP: true, STRATUS: true, PROMPTER2: true });
  const [resent, setResent] = useState<string | null>(null);

  return (
    <DialogFrame title="MOS activation of rundown" width={520} onClose={onClose} onOk={onClose}>
      <Box sx={{ border: "1px solid #a0a0a0", p: "8px 10px", minHeight: 300 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 96px", alignItems: "center", rowGap: "8px", columnGap: "8px" }}>
          <span>Device</span>
          <span>Range</span>
          <span>Connection</span>
          <span />
          {DEVICES.map((d) => (
            <React.Fragment key={d.name}>
              <Box component="label" sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={!!active[d.name]} onChange={(e) => setActive((prev) => ({ ...prev, [d.name]: e.target.checked }))} />
                {d.name}
              </Box>
              <span>Range not defined</span>
              <Box component="span" sx={{ justifySelf: "start", px: "5px", backgroundColor: d.connected ? "#00d000" : OCT.red, color: d.connected ? OCT.yellow : OCT.redText }}>
                {d.connected ? "Yes" : "No"}
              </Box>
              <Box component="button" onClick={() => setResent(d.name)} sx={{ ...buttonSx, minWidth: 0 }}>
                {resent === d.name ? "Resent" : "Resend"}
              </Box>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </DialogFrame>
  );
};
