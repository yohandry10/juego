import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { portraitAsset } from "./portrait-assets.js";
import { Asset } from "./Asset.js";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  return <button type="button" className={`game-button game-button--${variant} ${className}`} {...props}>{children}</button>;
}
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "agency" | "crisis" | "gold" }) { return <span className={`game-chip game-chip--${tone}`}>{children}</span>; }
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <article className={`game-card ${className}`}>{children}</article>; }
export function Notice({ children }: { children: ReactNode }) { return <p className="game-notice" role="status">{children}</p>; }
export function Tooltip({ children, text }: { children: ReactNode; text: string }) { const id = useId(); return <span className="game-tooltip" tabIndex={0} aria-describedby={id}>{children}<span role="tooltip" id={id}>{text}</span></span>; }
export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <button className="game-switch" type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span className="switch-track"><i/></span>{label}</button>; }
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: readonly { id: T; label: string }[]; onChange: (value: T) => void }) { return <div className="game-tabs" role="group" aria-label="Elegir vista">{options.map((option) => <Button key={option.id} variant="quiet" aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.label}</Button>)}</div>; }
export function Figure({ value, suffix = "" }: { value: number; suffix?: string }) { const previous = useRef(value); const [delta, setDelta] = useState(0); useEffect(() => { setDelta(value - previous.current); previous.current = value; const timer = setTimeout(() => setDelta(0), 2400); return () => clearTimeout(timer); }, [value]); return <span className="game-figure">{Math.round(value)}{suffix}{delta !== 0 && <span className="figure-delta" aria-label={`Cambio ${delta > 0 ? '+' : ''}${Math.round(delta)}`}>{delta > 0 ? '+' : ''}{Math.round(delta)}</span>}</span>; }
export function Portrait({ identity, name, size = "regular" }: { identity: string; name: string; age?: number; accent?: string; size?: "small" | "regular" | "large" }) { return <span className={`game-portrait game-portrait--${size}`}><Asset src={portraitAsset(identity)} alt={`Retrato ficticio de ${name}`} fallback={<span>Retrato no disponible</span>}/></span>; }

export function Modal({ title, children, onClose, drawer = false }: { title: string; children: ReactNode; onClose: () => void; drawer?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const node = dialog.current; if (!node) return; const previous = document.activeElement as HTMLElement | null; node.showModal(); return () => { node.close(); previous?.focus(); }; }, []);
  return <dialog ref={dialog} className={`game-modal ${drawer ? 'game-modal--drawer' : ''}`} aria-labelledby={id} onKeyDown={(event) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); } }} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><header><h2 id={id}>{title}</h2><Button variant="quiet" aria-label="Cerrar expediente" onClick={onClose}><X size={22}/></Button></header><div className="game-modal-body">{children}</div></dialog>;
}
export function Drawer(props: { title: string; children: ReactNode; onClose: () => void }) { return <Modal {...props} drawer/>; }

type SelectOption = { value: string; label: ReactNode; text: string; disabled: boolean };
function textOf(node: ReactNode): string { if (typeof node === "string" || typeof node === "number") return String(node); if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children); return Children.toArray(node).map(textOf).join(""); }
function optionsOf(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    if (child.type !== 'option') return optionsOf(child.props.children);
    return [{ value: String(child.props.value ?? textOf(child.props.children)), label: child.props.children, text: textOf(child.props.children), disabled: !!child.props.disabled }];
  });
}

/** A controlled listbox. Keeps existing command handlers without rendering native selects. */
export function Selector({ value, children, onChange, disabled = false, className = "", "aria-label": label, id }: { value: string | number; children: ReactNode; onChange: (event: { target: { value: string } }) => void; disabled?: boolean; className?: string; "aria-label"?: string; id?: string }) {
  const options = optionsOf(children);
  const selected = options.find((option) => option.value === String(value));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [position, setPosition] = useState<CSSProperties>({});
  const filtered = options.filter((option) => option.text.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const choose = (option: SelectOption | undefined) => { if (!option || option.disabled) return; onChange({ target: { value: option.value } }); setOpen(false); setQuery(""); button.current?.focus(); };
  useLayoutEffect(() => { if (!open || !button.current) return; const rect = button.current.getBoundingClientRect(); const above = innerHeight-rect.bottom<180 && rect.top>180; setPosition({ left: Math.max(8, Math.min(rect.left, innerWidth-rect.width-8)), width: Math.min(rect.width, innerWidth-16), top: above ? Math.max(8,rect.top-308) : rect.bottom+4, maxHeight: above ? Math.min(300,rect.top-12) : Math.max(100,innerHeight-rect.bottom-12) }); panel.current?.focus(); }, [open]);
  useLayoutEffect(() => { if (open) panel.current?.querySelector<HTMLElement>('[role="option"].focused')?.scrollIntoView({ block: 'nearest' }); }, [open, active, query]);
  useEffect(() => { if (!open) return; const outside = (event: PointerEvent) => { if (!panel.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) setOpen(false); }; const reposition = () => setOpen(false); document.addEventListener('pointerdown', outside); window.addEventListener('resize', reposition); return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', reposition); }; }, [open]);
  return <span className={`game-selector ${className}`}><button id={id} ref={button} className="selector-trigger" type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={uid} aria-haspopup="listbox" disabled={disabled} onClick={() => { setActive(Math.max(0, options.findIndex((option) => option.value === String(value)))); setOpen(!open); }} onKeyDown={(event) => { if (['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) { event.preventDefault(); setOpen(true); setActive(Math.max(0, options.findIndex((option) => option.value === String(value)))); } }}><span>{selected?.label ?? 'Elige una opción'}</span><ChevronDown size={18}/></button>{open && createPortal(<div ref={panel} className="selector-panel" style={position} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); button.current?.focus(); if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); } } else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); setActive(event.key === 'Home' ? 0 : event.key === 'End' ? filtered.length-1 : Math.max(0, Math.min(filtered.length-1, active+(event.key === 'ArrowDown' ? 1 : -1)))); } else if (event.key === 'Enter') { event.preventDefault(); choose(filtered[active]); } }}>
    {options.length > 7 && <input aria-label={`Buscar ${label ?? 'opción'}`} type="search" autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }}/>}<div role="listbox" id={uid} aria-label={label ?? 'Opciones'} aria-activedescendant={`${uid}-${active}`} tabIndex={0}>{filtered.map((option, index) => <div key={option.value} id={`${uid}-${index}`} role="option" aria-selected={option.value === String(value)} aria-disabled={option.disabled} className={index === active ? 'focused' : ''} onPointerMove={() => setActive(index)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); choose(option); }}>{option.label}</div>)}</div>{!filtered.length && <Notice>Sin coincidencias.</Notice>}</div>, button.current?.closest("dialog") ?? document.body)}</span>;
}
