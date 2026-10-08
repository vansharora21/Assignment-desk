"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import { Archive, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Rss, Trash2, Video } from "lucide-react";
import { BULLETIN_SLOTS } from "@/data/rundownData";
import { OCT } from "./octopusTheme";

interface DeskSidebarProps {
  activeTime: string;
  onOpenRundown: (time: string) => void;
}

const GROUPS = ["Manuals", "Assignment", "FLASH", "WIRES", "Features", "Stories", "POOL", "Hold Story", "News ON-AIR"];
const MY_OCTOPUS = ["Rundown schedule", "Notification history", "Notification Rules", "My stories", "Octopus E-Learning"];

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  width: "100%",
  border: 0,
  borderBottom: `1px solid ${OCT.sideLine}`,
  backgroundColor: OCT.side,
  color: OCT.white,
  font: "inherit",
  textAlign: "left" as const,
  padding: "2px 6px",
  cursor: "pointer",
  "&:hover": { backgroundColor: OCT.sideDark },
};

const DeskSidebar: React.FC<DeskSidebarProps> = ({ activeTime, onOpenRundown }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ "News ON-AIR": true, "My Octopus": true });
  const toggle = (name: string) => setOpen((prev) => ({ ...prev, [name]: !prev[name] }));

  if (collapsed) {
    return (
      <Box sx={{ width: 18, flexShrink: 0, backgroundColor: OCT.navy }}>
        <Box
          component="button"
          aria-label="Expand folders"
          onClick={() => setCollapsed(false)}
          sx={{ width: "100%", height: 20, border: 0, background: "none", color: OCT.white, cursor: "pointer", p: 0 }}
        >
          <ChevronRight size={12} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Rundown folders"
      sx={{ width: 176, flexShrink: 0, display: "flex", flexDirection: "column", backgroundColor: OCT.side, minHeight: 0 }}
    >
      <Box sx={{ height: 20, backgroundColor: OCT.navy, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <Box
          component="button"
          aria-label="Collapse folders"
          onClick={() => setCollapsed(true)}
          sx={{ border: 0, background: "none", color: OCT.white, cursor: "pointer", display: "flex", px: "4px" }}
        >
          <ChevronLeft size={12} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {GROUPS.map((group) => (
          <React.Fragment key={group}>
            <Box component="button" sx={{ ...rowSx, fontWeight: 600 }} aria-expanded={!!open[group]} onClick={() => toggle(group)}>
              {group === "WIRES" && <Rss size={13} />}
              <Box component="span" sx={{ flex: 1 }}>{group}</Box>
              {open[group] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Box>
            {group === "News ON-AIR" &&
              open[group] &&
              BULLETIN_SLOTS.map((time) => (
                <Box
                  component="button"
                  key={time}
                  aria-current={time === activeTime}
                  onClick={() => onOpenRundown(time)}
                  sx={{
                    ...rowSx,
                    pl: "18px",
                    ...(time === activeTime && { backgroundColor: OCT.red, "&:hover": { backgroundColor: OCT.red } }),
                  }}
                >
                  News {time}
                </Box>
              ))}
          </React.Fragment>
        ))}
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Box component="button" sx={{ ...rowSx, py: "5px" }}><Video size={15} /> Media</Box>
        <Box component="button" sx={{ ...rowSx, py: "5px" }}><Archive size={15} /> Archive</Box>
        <Box component="button" sx={{ ...rowSx, py: "5px" }}><Trash2 size={15} /> Trash</Box>
        <Box component="button" sx={{ ...rowSx, py: "5px" }} aria-expanded={!!open["My Octopus"]} onClick={() => toggle("My Octopus")}>
          <Box component="span" sx={{ flex: 1 }}>My Octopus</Box>
          {open["My Octopus"] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Box>
        {open["My Octopus"] &&
          MY_OCTOPUS.map((item) => (
            <Box component="button" key={item} sx={{ ...rowSx, pl: "14px" }}>
              {item}
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default DeskSidebar;
