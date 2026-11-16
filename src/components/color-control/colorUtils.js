export const THEME = {
    bg: "#151f2d",
    header: "#1b2638",
    card: "#1b2638",
    field: "#0f172a",
    border: "#2a3850",
    accent: "#00c96b",
    accentHover: "#00b85f",
    text: "#e2e8f0",
    muted: "#94a3b8",
};

export const SWATCHES = ["#FF2222", "#FF8C00", "#FFFF00", "#00FF66", "#00E5FF", "#0055FF", "#AA00FF"];
export const DEFAULT_HSV = { h: 14, s: 0.87, v: 1 };
export const DEFAULT_BRIGHTNESS = 82;
export const DEFAULT_OPACITY = 100;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function hsvToRgb({ h, s, v }) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
        g = 0,
        b = 0;
    if (h < 60)[r, g, b] = [c, x, 0];
    else if (h < 120)[r, g, b] = [x, c, 0];
    else if (h < 180)[r, g, b] = [0, c, x];
    else if (h < 240)[r, g, b] = [0, x, c];
    else if (h < 300)[r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function rgbToHsv({ r, g, b }) {
    const rn = r / 255,
        gn = g / 255,
        bn = b / 255;
    const max = Math.max(rn, gn, bn),
        min = Math.min(rn, gn, bn),
        d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === rn) h = 60 * (((gn - bn) / d) % 6);
        else if (max === gn) h = 60 * ((bn - rn) / d + 2);
        else h = 60 * ((rn - gn) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function rgbToCmyk({ r, g, b }) {
    const rn = r / 255,
        gn = g / 255,
        bn = b / 255;
    const k = 1 - Math.max(rn, gn, bn);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return {
        c: Math.round(((1 - rn - k) / (1 - k)) * 100),
        m: Math.round(((1 - gn - k) / (1 - k)) * 100),
        y: Math.round(((1 - bn - k) / (1 - k)) * 100),
        k: Math.round(k * 100),
    };
}

export function cmykToRgb({ c, m, y, k }) {
    const cn = c / 100,
        mn = m / 100,
        yn = y / 100,
        kn = k / 100;
    return {
        r: Math.round(255 * (1 - cn) * (1 - kn)),
        g: Math.round(255 * (1 - mn) * (1 - kn)),
        b: Math.round(255 * (1 - yn) * (1 - kn)),
    };
}

export const rgbToHex = ({ r, g, b }) => [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();

export function hexToRgb(hex = "") {
    const clean = hex.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

export const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

export const fieldSx = {
    "& .MuiOutlinedInput-root": {
        height: 30,
        fontSize: 12,
        color: THEME.text,
        bgcolor: THEME.field,
        "& fieldset": { borderColor: THEME.border },
        "&:hover fieldset": { borderColor: "#475569" },
        "&.Mui-focused fieldset": { borderColor: THEME.accent },
    },
    "& input": { p: "5px 8px" },
};

export const primaryButtonSx = {
    minHeight: 32,
    borderRadius: 1.25,
    bgcolor: THEME.accent,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "none",
    "&:hover": { bgcolor: THEME.accentHover },
};
export const secondaryButtonSx = {
    minHeight: 32,
    borderRadius: 1.25,
    bgcolor: THEME.field,
    color: THEME.text,
    border: `1px solid ${THEME.border}`,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "none",
    "&:hover": { bgcolor: THEME.border },
};