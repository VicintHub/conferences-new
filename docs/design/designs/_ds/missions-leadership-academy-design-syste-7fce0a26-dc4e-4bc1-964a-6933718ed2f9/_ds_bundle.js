/* @ds-bundle: {"format":3,"namespace":"MissionsLeadershipAcademyDesignSystem_7fce0a","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Seal","sourcePath":"components/core/Seal.jsx"},{"name":"Stamp","sourcePath":"components/core/Stamp.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"95d7bfd99638","components/core/Button.jsx":"2cc6c982e3d9","components/core/Card.jsx":"6b44f901998e","components/core/Eyebrow.jsx":"49499ca67f7b","components/core/Icon.jsx":"ca2f7034df8a","components/core/Seal.jsx":"2153eff0fd9f","components/core/Stamp.jsx":"7fa824c9fb81","components/forms/Checkbox.jsx":"e87497b4ef47","components/forms/Input.jsx":"aa0ae389ea23","components/forms/Select.jsx":"7625e2781784","ui_kits/academy-site/App.jsx":"9288ac5f7c1e","ui_kits/academy-site/ApplyScreen.jsx":"0c3116c86de3","ui_kits/academy-site/HomeScreen.jsx":"153a2722e502","ui_kits/academy-site/Parts.jsx":"c84f2da31f15","ui_kits/academy-site/ProgrammesScreen.jsx":"dc119e6574ed","ui_kits/academy-site/academy-data.js":"4b6495defe52"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MissionsLeadershipAcademyDesignSystem_7fce0a = window.MissionsLeadershipAcademyDesignSystem_7fce0a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — compact status capsule / tactical tag. Mono lettering, uppercase.
 * Use for programme labels, statuses, counts, "ADMISSION OPEN" style flags.
 */
function Badge({
  children,
  tone = 'cobalt',
  variant = 'soft',
  size = 'md',
  dot = false,
  style = {},
  ...rest
}) {
  const palette = {
    cobalt: {
      solid: 'var(--cobalt-600)',
      soft: 'var(--cobalt-100)',
      softText: 'var(--cobalt-800)',
      line: 'var(--cobalt-600)'
    },
    brick: {
      solid: 'var(--brick-600)',
      soft: 'var(--brick-100)',
      softText: 'var(--brick-800)',
      line: 'var(--brick-600)'
    },
    ink: {
      solid: 'var(--ink-800)',
      soft: 'var(--ink-100)',
      softText: 'var(--ink-800)',
      line: 'var(--ink-600)'
    },
    cream: {
      solid: 'var(--cream-100)',
      soft: 'rgba(255,255,255,0.14)',
      softText: 'var(--cream-50)',
      line: 'var(--border-on-dark)'
    },
    success: {
      solid: 'var(--success-600)',
      soft: 'var(--success-100)',
      softText: '#1d5536',
      line: 'var(--success-600)'
    },
    warning: {
      solid: 'var(--warning-600)',
      soft: 'var(--warning-100)',
      softText: '#7a4e0c',
      line: 'var(--warning-600)'
    }
  };
  const p = palette[tone] || palette.cobalt;
  const sizes = {
    sm: {
      padding: '2px 7px',
      font: 'var(--text-2xs)'
    },
    md: {
      padding: '4px 10px',
      font: 'var(--text-xs)'
    },
    lg: {
      padding: '6px 13px',
      font: 'var(--text-sm)'
    }
  };
  const s = sizes[size] || sizes.md;
  const looks = {
    solid: {
      background: p.solid,
      color: tone === 'cream' ? 'var(--cobalt-900)' : 'var(--cream-50)',
      border: `1px solid ${p.solid}`
    },
    soft: {
      background: p.soft,
      color: p.softText,
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: p.softText,
      border: `1px solid ${p.line}`
    }
  };
  const l = looks[variant] || looks.soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      fontSize: s.font,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
      padding: s.padding,
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      ...l,
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'currentColor',
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — the primary action control for Missions & Leadership Academy.
 * Firm edges, decisive press. Cobalt for primary action, brick-red for
 * urgent / enlistment CTAs.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  href = null,
  onClick,
  type = 'button',
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '7px 14px',
      font: 'var(--text-sm)',
      gap: '6px'
    },
    md: {
      padding: '11px 22px',
      font: 'var(--text-base)',
      gap: '8px'
    },
    lg: {
      padding: '15px 32px',
      font: 'var(--text-md)',
      gap: '10px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--cream-50)',
      border: '1.5px solid var(--color-primary)'
    },
    accent: {
      background: 'var(--color-accent)',
      color: 'var(--cream-50)',
      border: '1.5px solid var(--color-accent)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-primary-strong)',
      border: '1.5px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-primary-strong)',
      border: '1.5px solid transparent'
    },
    onDark: {
      background: 'var(--cream-50)',
      color: 'var(--cobalt-900)',
      border: '1.5px solid var(--cream-50)'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    padding: s.padding,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: s.font,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    lineHeight: 1,
    textDecoration: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out), background var(--dur-fast)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...v,
    ...style
  };
  const handlers = disabled ? {} : {
    onMouseDown: e => {
      e.currentTarget.style.transform = 'translateY(1px) scale(0.99)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = '';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.filter = '';
    },
    onMouseEnter: e => {
      e.currentTarget.style.filter = variant === 'outline' || variant === 'ghost' ? 'none' : 'brightness(1.08)';
      if (variant === 'outline') e.currentTarget.style.borderColor = 'var(--color-primary)';
      if (variant === 'ghost') e.currentTarget.style.background = 'var(--cobalt-50)';
    }
  };
  const content = /*#__PURE__*/React.createElement(React.Fragment, null, iconLeft, /*#__PURE__*/React.createElement("span", null, children), iconRight);
  if (href && !disabled) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: base,
      onClick: onClick
    }, handlers, rest), content);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: base,
    disabled: disabled,
    onClick: onClick
  }, handlers, rest), content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — surface container. Firm edges, decisive shadow, optional red
 * top-edge accent that echoes the brand's signature divider.
 */
function Card({
  children,
  variant = 'light',
  accent = false,
  interactive = false,
  padding = 'var(--space-6)',
  style = {},
  ...rest
}) {
  const variants = {
    light: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      border: '1px solid var(--border)'
    },
    sunk: {
      background: 'var(--surface-sunk)',
      color: 'var(--text-body)',
      border: '1px solid var(--border)'
    },
    dark: {
      background: 'var(--surface-dark-card)',
      color: 'var(--cream-50)',
      border: '1px solid var(--border-on-dark)'
    },
    night: {
      background: 'var(--cobalt-900)',
      color: 'var(--cream-50)',
      border: '1px solid var(--border-on-dark)'
    }
  };
  const v = variants[variant] || variants.light;
  const handlers = interactive ? {
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = variant === 'light' ? 'var(--shadow-sm)' : 'none';
    }
  } : {};
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-lg)',
      padding,
      overflow: 'hidden',
      boxShadow: variant === 'light' ? 'var(--shadow-sm)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      cursor: interactive ? 'pointer' : 'default',
      ...v,
      ...style
    }
  }, handlers, rest), accent && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'var(--brick-600)'
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Eyebrow — the signature mono kicker with a leading red rule. Sits above
 * headlines to label a section ("PROGRAMME 01", "THE CHALLENGE").
 */
function Eyebrow({
  children,
  tone = 'brick',
  align = 'left',
  style = {},
  ...rest
}) {
  const colors = {
    brick: 'var(--brick-600)',
    cobalt: 'var(--cobalt-600)',
    cream: 'var(--cream-50)',
    muted: 'var(--ink-400)'
  };
  const c = colors[tone] || colors.brick;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: c,
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '28px',
      height: '2px',
      background: 'currentColor',
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Icon — line icons drawn from the Lucide set (MIT). 24×24, 2px stroke,
 * round caps — the Academy's line-art iconography (cream stroke on dark,
 * cobalt/ink on light). Pass `name`, `size`, `color`, `strokeWidth`.
 */
const PATHS = {
  'arrow-right': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 5l7 7-7 7"
  })),
  'chevron-right': /*#__PURE__*/React.createElement("path", {
    d: "M9 18l6-6-6-6"
  }),
  'book-open': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
  })),
  'compass': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"
  })),
  'clock': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6v6l4 2"
  })),
  'laptop': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "12",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 20h20"
  })),
  'users': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  })),
  'briefcase': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "20",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
  })),
  'route': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  })),
  'map-pin': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })),
  'phone': /*#__PURE__*/React.createElement("path", {
    d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
  }),
  'mail': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
  })),
  'check': /*#__PURE__*/React.createElement("path", {
    d: "M20 6L9 17l-5-5"
  }),
  'shield': /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
  }),
  'target': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  })),
  'flag': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "22",
    x2: "4",
    y2: "15"
  })),
  'crosshair': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "22",
    y1: "12",
    x2: "18",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "12",
    x2: "2",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "6",
    x2: "12",
    y2: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "22",
    x2: "12",
    y2: "18"
  })),
  'menu': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  })),
  'calendar': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }))
};
function Icon({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  style = {},
  ...rest
}) {
  const body = PATHS[name];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: 'block',
      flex: 'none',
      ...style
    },
    "aria-hidden": "true"
  }, rest), body || null);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Seal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Seal — the Men of Issachar Vision patch badge. Renders the official mark
 * as a round, drop-shadowed seal. Pass `src` pointing at the copied logo
 * asset (assets/logo/issachar-patch.png) relative to your page.
 */
function Seal({
  src = 'assets/logo/issachar-patch.png',
  size = 96,
  shadow = true,
  alt = 'The Men of Issachar Vision Inc.',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      flex: 'none',
      boxShadow: shadow ? 'var(--shadow-seal)' : 'none',
      background: 'var(--cream-50)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      display: 'block',
      objectFit: 'cover'
    }
  }));
}
Object.assign(__ds_scope, { Seal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Seal.jsx", error: String((e && e.message) || e) }); }

// components/core/Stamp.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Stamp — stencil-framed insignia stamp ("ADMISSION OPEN"). Decisive,
 * slightly rotated, like an ink stamp pressed onto the surface.
 */
function Stamp({
  children,
  tone = 'brick',
  rotate = -3,
  size = 'md',
  style = {},
  ...rest
}) {
  const colors = {
    brick: {
      fg: 'var(--brick-700)',
      line: 'var(--brick-600)'
    },
    cobalt: {
      fg: 'var(--cobalt-700)',
      line: 'var(--cobalt-600)'
    },
    cream: {
      fg: 'var(--cream-50)',
      line: 'var(--cream-100)'
    },
    ink: {
      fg: 'var(--ink-800)',
      line: 'var(--ink-700)'
    }
  };
  const c = colors[tone] || colors.brick;
  const sizes = {
    sm: {
      font: '16px',
      pad: '5px 12px',
      bw: '2px'
    },
    md: {
      font: '22px',
      pad: '7px 16px',
      bw: '3px'
    },
    lg: {
      font: '30px',
      pad: '10px 22px',
      bw: '3px'
    }
  };
  const s = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-stencil)',
      color: c.fg,
      border: `${s.bw} solid ${c.line}`,
      padding: s.pad,
      fontSize: s.font,
      letterSpacing: '0.06em',
      lineHeight: 1.05,
      transform: `rotate(${rotate}deg)`,
      borderRadius: 'var(--radius-xs)',
      textTransform: 'uppercase',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Stamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stamp.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — square check control with cobalt fill. Firm, stamped look.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const fieldId = id || (label ? `chk-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-body)',
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: '20px',
      height: '20px',
      flex: 'none',
      borderRadius: 'var(--radius-xs)',
      border: `1.5px solid ${on ? 'var(--cobalt-600)' : 'var(--border-strong)'}`,
      background: on ? 'var(--cobalt-600)' : 'var(--white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast), border-color var(--dur-fast)'
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.2L5 8.5L9.5 3.5",
    stroke: "var(--cream-50)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with optional label, hint and error. Firm cobalt focus
 * ring, mono-free clean Barlow text.
 */
function Input({
  label,
  hint,
  error,
  required = false,
  id,
  type = 'text',
  iconLeft = null,
  style = {},
  containerStyle = {},
  ...rest
}) {
  const fieldId = id || (label ? `fld-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--brick-600)' : focused ? 'var(--cobalt-500)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--ink-600)',
      fontWeight: 500
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brick-600)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'var(--white)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      padding: '0 12px',
      boxShadow: focused ? 'var(--ring)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-400)',
      display: 'flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)',
      padding: '11px 0',
      minWidth: 0,
      ...style
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: error ? 'var(--brick-600)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native select with brand styling and a custom chevron.
 */
function Select({
  label,
  hint,
  error,
  required = false,
  id,
  children,
  style = {},
  containerStyle = {},
  ...rest
}) {
  const fieldId = id || (label ? `sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--brick-600)' : focused ? 'var(--cobalt-500)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--ink-600)',
      fontWeight: 500
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brick-600)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      appearance: 'none',
      WebkitAppearance: 'none',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--white)',
      padding: '11px 38px 11px 12px',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: focused ? 'var(--ring)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: '13px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--ink-400)',
      fontSize: '12px'
    }
  }, "\u25BE")), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: error ? 'var(--brick-600)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/App.jsx
try { (() => {
/* App — shell + routing for the Academy marketing-site UI kit. */
const {
  Button,
  Badge,
  Eyebrow,
  Seal,
  Icon
} = window.DesignSystem_7fce0a;
const A = window.ACADEMY;
function Header({
  screen,
  go
}) {
  const links = [['home', 'Home'], ['programmes', 'Programmes'], ['apply', 'Admissions']];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--cobalt-900)',
      borderBottom: '1px solid var(--border-on-dark)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 28px',
      height: 70,
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('home'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Seal, {
    size: 42,
    src: A.LOGO,
    shadow: false
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'left',
      lineHeight: 1.05
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      fontSize: 16,
      color: 'var(--cream-50)'
    }
  }, "Missions & Leadership"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--cobalt-300)'
    }
  }, "Academy"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, links.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => go(id),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      fontWeight: 600,
      fontSize: 14,
      padding: '8px 14px',
      borderRadius: 'var(--radius-sm)',
      color: screen === id ? 'var(--cream-50)' : 'var(--cobalt-200)',
      borderBottom: screen === id ? '2px solid var(--brick-600)' : '2px solid transparent'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "sm",
    onClick: () => go('apply')
  }, "Enlist Now")))));
}
function Footer({
  go
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--ink-950)',
      color: 'var(--cobalt-200)',
      padding: '52px 28px 36px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 40,
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Seal, {
    size: 48,
    src: A.LOGO
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      textTransform: 'uppercase',
      color: 'var(--cream-50)',
      fontSize: 17,
      lineHeight: 1.05
    }
  }, "Missions &", /*#__PURE__*/React.createElement("br", null), "Leadership Academy")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.6,
      margin: 0,
      color: 'var(--cobalt-300)'
    }
  }, "The training arm of ", A.org, ". Get trained. Get sent.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--brick-400)',
      marginBottom: 14
    }
  }, "Mission Center"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.7,
      margin: 0,
      color: 'var(--cream-50)',
      maxWidth: 240
    }
  }, A.address)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--brick-400)',
      marginBottom: 14
    }
  }, "Admissions Line"), A.phones.map(p => /*#__PURE__*/React.createElement("div", {
    key: p,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      color: 'var(--cream-50)',
      fontSize: 15,
      fontFamily: 'var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 15,
    color: "var(--brick-400)"
  }), p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '32px auto 0',
      paddingTop: 22,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--ink-400)',
      letterSpacing: '0.04em'
    }
  }, "\xA9 2026 ", A.org), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--ink-400)',
      letterSpacing: '0.06em'
    }
  }, "NO ARMY PARADES AN UNTRAINED SOLDIER")));
}
function App() {
  const [screen, setScreen] = React.useState('home');
  const go = s => {
    setScreen(s);
    window.scrollTo({
      top: 0
    });
  };
  const Screen = {
    home: window.HomeScreen,
    programmes: window.ProgrammesScreen,
    apply: window.ApplyScreen
  }[screen];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-canvas)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(Header, {
    screen: screen,
    go: go
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, Screen ? /*#__PURE__*/React.createElement(Screen, {
    go: go
  }) : null), /*#__PURE__*/React.createElement(Footer, {
    go: go
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/ApplyScreen.jsx
try { (() => {
/* ApplyScreen — enlistment form + contact panel, with a submitted state. */
(function () {
  const {
    Button,
    Badge,
    Eyebrow,
    Stamp,
    Seal,
    Icon,
    Card,
    Input,
    Select,
    Checkbox
  } = window.DesignSystem_7fce0a;
  const A = window.ACADEMY;
  const {
    Section,
    Heading
  } = window.KitParts;
  function InfoPanel() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }
    }, /*#__PURE__*/React.createElement(Card, {
      variant: "night",
      padding: "28px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      tone: "cream"
    }, "Report For Duty"), /*#__PURE__*/React.createElement(Stamp, {
      tone: "cream",
      size: "sm"
    }, "Open")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map-pin",
      size: 20,
      color: "var(--brick-400)",
      style: {
        marginTop: 2
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        lineHeight: 1.6,
        color: 'var(--cream-50)'
      }
    }, A.address)), A.phones.map(p => /*#__PURE__*/React.createElement("div", {
      key: p,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 18,
      color: "var(--brick-400)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        color: 'var(--cream-50)'
      }
    }, p)))), /*#__PURE__*/React.createElement(Card, {
      variant: "sunk",
      padding: "26px"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "What to Expect"), /*#__PURE__*/React.createElement("ul", {
      style: {
        listStyle: 'none',
        padding: 0,
        margin: '16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 13
      }
    }, ['Classroom instruction & doctrine', 'Supervised field practicals', 'Real internship placement', 'Commissioning — get sent'].map((t, i) => /*#__PURE__*/React.createElement("li", {
      key: t,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 15,
        color: 'var(--text-body)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: 'var(--cobalt-600)',
        color: 'var(--cream-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        flex: 'none'
      }
    }, i + 1), t)))));
  }
  function EnlistForm() {
    const [done, setDone] = React.useState(false);
    if (done) {
      return /*#__PURE__*/React.createElement(Card, {
        accent: true,
        padding: "44px 32px",
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: 420,
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--cobalt-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 22
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 38,
        color: "var(--cream-50)",
        strokeWidth: 2.4
      })), /*#__PURE__*/React.createElement("h3", {
        style: {
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase',
          fontWeight: 700,
          fontSize: 28,
          margin: '0 0 10px',
          color: 'var(--text-strong)'
        }
      }, "Application Received"), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--text-body)',
          maxWidth: 360,
          margin: '0 0 24px'
        }
      }, "Welcome, soldier. The admissions office will reach you on the line you provided. Get ready to be trained and sent."), /*#__PURE__*/React.createElement(Button, {
        variant: "outline",
        onClick: () => setDone(false)
      }, "Submit Another"));
    }
    return /*#__PURE__*/React.createElement(Card, {
      padding: "32px",
      style: {
        boxShadow: 'var(--shadow-md)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Enlistment Form"), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 700,
        fontSize: 26,
        margin: '10px 0 0',
        color: 'var(--text-strong)'
      }
    }, "Say Yes")), /*#__PURE__*/React.createElement("form", {
      onSubmit: e => {
        e.preventDefault();
        setDone(true);
      },
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Full name",
      placeholder: "Soldier's name",
      required: true
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Phone",
      type: "tel",
      placeholder: "+234 ...",
      required: true,
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "phone",
        size: 16
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1'
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Email",
      type: "email",
      placeholder: "you@email.com",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "mail",
        size: 16
      })
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Programme of training",
      required: true,
      defaultValue: ""
    }, /*#__PURE__*/React.createElement("option", {
      value: "",
      disabled: true
    }, "Choose your path\u2026"), A.programmes.map(p => /*#__PURE__*/React.createElement("option", {
      key: p.code
    }, p.name, " \u2014 ", p.duration)))), /*#__PURE__*/React.createElement(Select, {
      label: "Preferred mode",
      defaultValue: "On-site"
    }, /*#__PURE__*/React.createElement("option", null, "On-site"), /*#__PURE__*/React.createElement("option", null, "Online")), /*#__PURE__*/React.createElement(Input, {
      label: "Local assembly / church",
      placeholder: "Optional"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1',
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "I am ready to be trained, and to be sent.",
      defaultChecked: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: '1 / -1',
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "accent",
      size: "lg",
      fullWidth: true,
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 18
      })
    }, "Submit Application"))));
  }
  window.ApplyScreen = function ApplyScreen() {
    return /*#__PURE__*/React.createElement(Section, {
      pad: "60px 28px 88px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 40
      }
    }, /*#__PURE__*/React.createElement(Heading, {
      eyebrow: "Admission Now Open",
      title: "Enlist for 2026 / 2027",
      sub: "No army parades an untrained soldier. Fill the form below and the admissions office will make contact."
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 32,
        alignItems: 'start'
      },
      className: "apply-grid"
    }, /*#__PURE__*/React.createElement(EnlistForm, null), /*#__PURE__*/React.createElement(InfoPanel, null)));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/ApplyScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/HomeScreen.jsx
try { (() => {
/* HomeScreen — hero, challenge, programmes preview, services, CTA. */
(function () {
  const {
    Button,
    Badge,
    Eyebrow,
    Stamp,
    Seal,
    Icon,
    Card
  } = window.DesignSystem_7fce0a;
  const A = window.ACADEMY;
  const {
    Section,
    Heading,
    ProgrammeCard
  } = window.KitParts;
  function Hero({
    go
  }) {
    return /*#__PURE__*/React.createElement("section", {
      style: {
        position: 'relative',
        background: 'var(--cobalt-900)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
        maskImage: 'radial-gradient(120% 100% at 70% 0%, #000 30%, transparent 75%)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: '-12%',
        right: '-6%',
        width: 560,
        height: 560,
        opacity: 0.10,
        filter: 'grayscale(0.2)',
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: A.LOGO,
      alt: "",
      style: {
        width: '100%',
        height: '100%'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        background: 'var(--brick-600)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '92px 28px 96px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 760
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 26
      }
    }, /*#__PURE__*/React.createElement(Seal, {
      size: 56,
      src: A.LOGO
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--cobalt-200)',
        lineHeight: 1.5
      }
    }, "The Training Arm of", /*#__PURE__*/React.createElement("br", null), A.org)), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '-0.015em',
        lineHeight: 0.98,
        margin: 0,
        fontSize: 'clamp(44px, 7vw, 92px)',
        color: 'var(--cream-50)'
      }
    }, "No Army Parades an", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--cobalt-300)'
      }
    }, "Untrained"), " Soldier"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 24,
        fontSize: 19,
        lineHeight: 1.55,
        color: 'var(--cobalt-100)',
        maxWidth: 560
      }
    }, "Global Missions & Ministry Training for the ", A.session, ". Choose your path, get trained on the field, and get sent."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        marginTop: 34,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "accent",
      size: "lg",
      onClick: () => go('apply'),
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 18
      })
    }, "Enlist Now"), /*#__PURE__*/React.createElement(Button, {
      variant: "onDark",
      size: "lg",
      onClick: () => go('programmes')
    }, "Explore Programmes"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 6
      }
    }, /*#__PURE__*/React.createElement(Stamp, {
      tone: "cream"
    }, "Admission Open"))))));
  }
  function Challenge() {
    return /*#__PURE__*/React.createElement(Section, {
      bg: "var(--brick-800)",
      pad: "60px 28px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 26,
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "crosshair",
      size: 40,
      color: "var(--brick-200)"
    }), /*#__PURE__*/React.createElement("blockquote", {
      style: {
        margin: 0,
        flex: 1,
        minWidth: 280
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 600,
        fontSize: 'clamp(22px, 3vw, 34px)',
        lineHeight: 1.1,
        color: 'var(--cream-50)',
        margin: 0,
        letterSpacing: '-0.01em'
      }
    }, "\u201CEvery great move of God started with a soldier who said yes.\u201D"))));
  }
  function Programmes({
    go
  }) {
    return /*#__PURE__*/React.createElement(Section, {
      pad: "88px 28px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        flexWrap: 'wrap',
        marginBottom: 44
      }
    }, /*#__PURE__*/React.createElement(Heading, {
      eyebrow: "Four Paths of Training",
      title: "Choose Your Path",
      sub: "No two callings are the same. Every programme pairs instruction with real field practicals."
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      onClick: () => go('programmes'),
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 16
      })
    }, "All Programmes")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))',
        gap: 22
      }
    }, A.programmes.map(p => /*#__PURE__*/React.createElement(ProgrammeCard, {
      key: p.code,
      p: p,
      onSelect: () => go('apply')
    }))));
  }
  function Services() {
    return /*#__PURE__*/React.createElement(Section, {
      bg: "var(--cream-100)",
      pad: "84px 28px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
        gap: 48,
        alignItems: 'center'
      },
      className: "svc-grid"
    }, /*#__PURE__*/React.createElement(Heading, {
      eyebrow: "The Extra Edge",
      title: "Specialized Mission Consultation",
      sub: "Beyond the classroom, the Academy advises ministries and teams on the work of the field."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14
      }
    }, A.services.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--brick-600)',
        padding: '16px 16px',
        borderRadius: 'var(--radius-sm)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ['target', 'flag', 'users', 'shield'][i],
      size: 22,
      color: "var(--cobalt-700)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '0.01em',
        color: 'var(--text-strong)',
        lineHeight: 1.1
      }
    }, s))))));
  }
  function CTA({
    go
  }) {
    return /*#__PURE__*/React.createElement(Section, {
      bg: "var(--cobalt-900)",
      pad: "78px 28px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 40,
        flexWrap: 'wrap',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 560
      }
    }, /*#__PURE__*/React.createElement(Heading, {
      light: true,
      eyebrow: "Admission Now Open",
      title: "Get Trained. Get Sent.",
      sub: A.address
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 24,
        marginTop: 22,
        flexWrap: 'wrap'
      }
    }, A.phones.map(p => /*#__PURE__*/React.createElement("span", {
      key: p,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        color: 'var(--cream-50)',
        fontFamily: 'var(--font-mono)',
        fontSize: 16
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 16,
      color: "var(--brick-400)"
    }), p)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "accent",
      size: "lg",
      onClick: () => go('apply'),
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 18
      })
    }, "Apply for 2026/2027"), /*#__PURE__*/React.createElement(Button, {
      variant: "onDark",
      size: "lg",
      onClick: () => go('programmes')
    }, "Compare Programmes"))));
  }
  window.HomeScreen = function HomeScreen({
    go
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, {
      go: go
    }), /*#__PURE__*/React.createElement(Challenge, null), /*#__PURE__*/React.createElement(Programmes, {
      go: go
    }), /*#__PURE__*/React.createElement(Services, null), /*#__PURE__*/React.createElement(CTA, {
      go: go
    }));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/Parts.jsx
try { (() => {
/* Shared presentational parts for the Academy UI kit. Exposes on window. */
const {
  Card,
  Badge,
  Eyebrow,
  Icon,
  Button
} = window.DesignSystem_7fce0a;

/* Section wrapper with consistent max-width + vertical rhythm */
function Section({
  children,
  bg = 'transparent',
  pad = '88px 28px',
  style = {}
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      padding: pad,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, children));
}

/* Eyebrow + big display heading block */
function Heading({
  eyebrow,
  title,
  sub,
  align = 'left',
  light = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      maxWidth: align === 'center' ? 760 : 720,
      marginInline: align === 'center' ? 'auto' : 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: light ? 'cream' : 'brick',
    align: align
  }, eyebrow)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.04,
      margin: 0,
      fontSize: 'clamp(30px, 4vw, 48px)',
      color: light ? 'var(--cream-50)' : 'var(--text-strong)'
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 17,
      lineHeight: 1.6,
      color: light ? 'var(--cobalt-200)' : 'var(--text-body)',
      maxWidth: 620,
      marginInline: align === 'center' ? 'auto' : 0
    }
  }, sub));
}

/* Programme card used on home + programmes screens */
function ProgrammeCard({
  p,
  onSelect,
  detailed = false
}) {
  return /*#__PURE__*/React.createElement(Card, {
    accent: true,
    interactive: true,
    padding: "26px",
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 'var(--radius-md)',
      background: 'var(--cobalt-50)',
      border: '1.5px solid var(--cobalt-100)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 26,
    color: "var(--cobalt-700)"
  })), /*#__PURE__*/React.createElement(Badge, {
    tone: "brick",
    variant: "soft"
  }, p.duration)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, p.code), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 1.05,
      margin: '0 0 10px',
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: 'var(--text-body)',
      margin: '0 0 18px'
    }
  }, p.blurb), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: '0 0 20px',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, p.points.map(pt => /*#__PURE__*/React.createElement("li", {
    key: pt,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "var(--brick-600)"
  }), pt))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 14,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, p.mode), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onSelect,
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, "Enlist")));
}
window.KitParts = {
  Section,
  Heading,
  ProgrammeCard
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/Parts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/ProgrammesScreen.jsx
try { (() => {
/* ProgrammesScreen — detailed listing + comparison. */
(function () {
  const {
    Button,
    Badge,
    Eyebrow,
    Icon,
    Card
  } = window.DesignSystem_7fce0a;
  const A = window.ACADEMY;
  const {
    Section,
    Heading,
    ProgrammeCard
  } = window.KitParts;
  function Banner() {
    return /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--cobalt-800)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(120% 120% at 20% 0%, #000 40%, transparent 80%)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '70px 28px 64px'
      }
    }, /*#__PURE__*/React.createElement(Heading, {
      light: true,
      eyebrow: "2026 / 2027 Enrolment",
      title: "Programmes of Training",
      sub: "From a full diploma year to a six-week intensive \u2014 every path ends on the field, not in a lecture hall."
    })));
  }
  function Grid({
    go
  }) {
    return /*#__PURE__*/React.createElement(Section, {
      pad: "64px 28px 40px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: 22
      }
    }, A.programmes.map(p => /*#__PURE__*/React.createElement(ProgrammeCard, {
      key: p.code,
      p: p,
      onSelect: () => go('apply')
    }))));
  }
  function Compare() {
    const rows = [['Duration', p => p.duration], ['Mode', p => p.mode], ['Field experience', () => 'Included']];
    return /*#__PURE__*/React.createElement(Section, {
      pad: "20px 28px 88px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement(Heading, {
      eyebrow: "At a Glance",
      title: "Compare the Paths"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)'
      }
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: 640
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
      style: {
        background: 'var(--cobalt-900)'
      }
    }, /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'left',
        padding: '16px 20px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--cobalt-200)',
        fontWeight: 500
      }
    }, "Programme"), A.programmes.map(p => /*#__PURE__*/React.createElement("th", {
      key: p.code,
      style: {
        textAlign: 'left',
        padding: '16px 18px',
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 700,
        fontSize: 15,
        color: 'var(--cream-50)',
        lineHeight: 1.1
      }
    }, p.name.replace(' Course', ''))))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([label, val], ri) => /*#__PURE__*/React.createElement("tr", {
      key: label,
      style: {
        borderTop: '1px solid var(--border)',
        background: ri % 2 ? 'var(--cream-50)' : 'var(--white)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '15px 20px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)'
      }
    }, label), A.programmes.map(p => /*#__PURE__*/React.createElement("td", {
      key: p.code,
      style: {
        padding: '15px 18px',
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--text-strong)'
      }
    }, val(p))))), /*#__PURE__*/React.createElement("tr", {
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '16px 20px'
      }
    }), A.programmes.map(p => /*#__PURE__*/React.createElement("td", {
      key: p.code,
      style: {
        padding: '16px 18px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm",
      onClick: () => {}
    }, "Enlist"))))))));
  }
  window.ProgrammesScreen = function ProgrammesScreen({
    go
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Banner, null), /*#__PURE__*/React.createElement(Grid, {
      go: go
    }), /*#__PURE__*/React.createElement(Compare, null));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/ProgrammesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/academy-site/academy-data.js
try { (() => {
/* Shared content for the Academy marketing-site UI kit. Plain global — no
   modules. Loaded before the screen scripts. */
window.ACADEMY = {
  org: 'The Men of Issachar Vision Inc.',
  academy: 'Missions & Leadership Academy',
  session: '2026 / 2027 Academic Session',
  address: 'Leadership & Mission Center, Olororo, Ojo, Ibadan, Nigeria',
  phones: ['+234 706 845 2308', '+234 808 085 4818'],
  programmes: [{
    code: 'Programme 01',
    name: 'Guerrilla Diploma Course',
    icon: 'compass',
    duration: '1 Year',
    blurb: 'A full year of formation — the complete path from classroom to commissioned field worker.',
    points: ['Classroom instruction', 'Field practicals', 'Supervised internship'],
    mode: 'On-site'
  }, {
    code: 'Programme 02',
    name: 'Guerrilla Certificate Course',
    icon: 'clock',
    duration: '6 Weeks',
    blurb: 'Intensive, fast-track training with real field experience — study where you are.',
    points: ['On-site or online', 'Six-week intensive', 'Live field experience'],
    mode: 'On-site / Online'
  }, {
    code: 'Programme 03',
    name: 'Mobile Special Courses',
    icon: 'users',
    duration: 'Flexible',
    blurb: 'Training brought to your group — churches, fellowships and corps members.',
    points: ['Churches & ministries', 'Campus fellowships', 'NYSC corps members'],
    mode: 'On location'
  }, {
    code: 'Programme 04',
    name: 'En Route Volunteer Courses',
    icon: 'route',
    duration: 'Holidays',
    blurb: 'For working hands who want to serve God on their break — leave periods put to mission.',
    points: ['For working individuals', 'Holidays & leave periods', 'Serve while you rest'],
    mode: 'Seasonal'
  }],
  services: ['Outreach Consultation', 'Crusade Planning & Execution', 'Cross-Cultural Soul-Winning', 'Discipleship Strategy'],
  LOGO: '../../assets/logo/issachar-patch.png'
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/academy-site/academy-data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Seal = __ds_scope.Seal;

__ds_ns.Stamp = __ds_scope.Stamp;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

})();
