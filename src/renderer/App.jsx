import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Plus, Trash2, ChevronRight, ChevronDown, Save, Copy, Check, Package,
    Layers, Box, Database, FileText, X, FileJson, FolderOpen, Download,
    ArrowLeft, GripVertical, MoreHorizontal, Upload, ClipboardCheck,
    AlertCircle, FileCode, AlertTriangle, RefreshCw, FileSignature, Sun, Moon, Search, Home,
    Eye, EyeOff, LayoutGrid, Settings, Info, Menu, ChevronLeft, Maximize2, Minimize2, ExternalLink,
    Code, Hammer
} from 'lucide-react';

// --- Constants & Defaults ---
const SLOTS_LIST = ["GhilliHead", "GhilliSuit", "smershvest", "BeltLeft", "BeltRight", "Shoulder", "Melee", "Head", "Headgear", "Mask", "Eyewear", "Hands", "LeftHand", "Gloves", "Armband", "Vest", "SideBag", "Body", "Back", "Hips", "Legs", "Feet", "Splint_Right"];

const createDefaultItem = () => ({
    ClassName: "New_Item",
    Include: "",
    Chance: 1.0,
    Quantity: { Min: 1, Max: 1 },
    Health: [{ Min: 1.0, Max: 1.0, Zone: "" }],
    InventoryAttachments: [],
    InventoryCargo: [],
    ConstructionPartsBuilt: [],
    Sets: []
});

const createDefaultSet = () => ({
    ClassName: "New_Set",
    Include: "",
    Chance: 1.0,
    Quantity: { Min: 1, Max: 1 },
    Health: [{ Min: 1.0, Max: 1.0, Zone: "" }],
    InventoryAttachments: [],
    InventoryCargo: [],
    ConstructionPartsBuilt: [],
    Sets: []
});

const createDefaultSlot = () => ({
    SlotName: "New_Slot",
    Items: []
});

// --- Helpers ---
const getNested = (obj, path) => path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
const setNested = (obj, path, value) => {
    if (path.length === 0) return value;
    const [head, ...tail] = path;
    const nextObj = Array.isArray(obj) ? [...obj] : { ...obj };
    if (tail.length === 0) {
        if (Array.isArray(nextObj) && typeof head === 'number' && value === undefined) nextObj.splice(head, 1);
        else nextObj[head] = value;
        return nextObj;
    }
    nextObj[head] = setNested(nextObj[head], tail, value);
    return nextObj;
};
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// --- Components ---

const GlassButton = ({ onClick, children, variant = 'primary', size = 'md', className = '', title, disabled }) => {
    const variants = {
        primary: 'bg-blue-600/80 hover:bg-blue-500 text-white border-blue-400/30',
        secondary: 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10',
        danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30',
        ghost: 'hover:bg-white/5 text-slate-400 border-transparent',
        success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
        indigo: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/30',
    };
    const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`rounded-xl border flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-sm shadow-lg ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
};

const InputField = ({ label, value, onChange, type = "text", step = "any", className = "", placeholder }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">{label}</label>}
        <input
            type={type}
            step={step}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-200 w-full transition-all placeholder:text-slate-600"
        />
    </div>
);

const AutoCompleteField = ({ label, value, onChange, options = [], className = "" }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [show, setShow] = useState(false);
    const ref = useRef(null);
    const hasDB = options.length > 0;

    useEffect(() => {
        const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`flex flex-col gap-1.5 relative ${className}`} ref={ref}>
            <div className="flex justify-between items-center px-1">
                {label && <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</label>}
                {hasDB && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded-full flex items-center gap-1"><Database size={8} /> DB active</span>}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val);
                        if (hasDB && val.length > 0) {
                            setSuggestions(options.filter(i => i.toLowerCase().includes(val.toLowerCase())).slice(0, 50));
                            setShow(true);
                        } else setShow(false);
                    }}
                    onFocus={() => hasDB && value.length > 0 && setShow(true)}
                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-200 w-full transition-all"
                    placeholder="Type ClassName..."
                />
                {show && suggestions.length > 0 && (
                    <div className="absolute z-[100] w-full bg-[#1e293b] border border-white/10 mt-2 rounded-xl shadow-2xl overflow-hidden animate-slide-up max-h-60 overflow-y-auto custom-scrollbar">
                        {suggestions.map((s, i) => (
                            <div key={i} className="px-4 py-2.5 text-sm hover:bg-blue-500/20 cursor-pointer text-slate-300 transition-colors border-b border-white/5 last:border-0"
                                onClick={() => { onChange(s); setShow(false); }}>
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const BreadcrumbNav = ({ path, rootData, onNavigate }) => {
    const crumbs = useMemo(() => {
        const list = [{ label: "Root", path: [] }];
        let currPath = [];
        let curr = rootData;
        for (let key of path) {
            currPath = [...currPath, key];
            let label = key;
            if (typeof key === 'number') {
                if (curr && Array.isArray(curr)) {
                    const itm = curr[key];
                    label = itm ? (itm.ClassName || itm.SlotName || `#${key}`) : `#${key}`;
                }
            } else {
                if (key === 'InventoryAttachments') label = 'Slots';
                else if (key === 'InventoryCargo') label = 'Cargo';
                else if (key === 'Sets') label = 'Sets';
                else if (key === 'Items') label = 'Items';
            }
            list.push({ label, path: currPath });
            if (curr) curr = curr[key];
        }
        return list;
    }, [path, rootData]);

    return (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-[#1e293b]/30 backdrop-blur-md sticky top-0 z-40 overflow-x-auto no-scrollbar">
            <button onClick={() => onNavigate([])} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"><Home size={18} /></button>
            {crumbs.slice(1).map((c, i) => (
                <React.Fragment key={i}>
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                    <button
                        onClick={() => onNavigate(c.path)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap max-w-[200px] truncate ${i === crumbs.length - 2 ? 'bg-blue-500/20 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                        {c.label}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

const SearchSystem = ({ data, onNavigate }) => {
    const [q, setQ] = useState("");
    const [res, setRes] = useState([]);
    const [show, setShow] = useState(false);

    const performSearch = (val) => {
        setQ(val);
        if (val.length < 2) { setRes([]); return; }
        const flatten = (node, path = []) => {
            let l = [];
            if (!node) return l;
            const name = node.ClassName || node.SlotName;
            if (name) l.push({ name, path, type: node.ClassName ? 'Item' : 'Slot' });
            const keys = ['Items', 'InventoryAttachments', 'InventoryCargo', 'Sets'];
            for (let k of keys) if (node[k]) node[k].forEach((c, i) => l = l.concat(flatten(c, [...path, k, i])));
            return l;
        };
        const flat = flatten(data);
        setRes(flat.filter(i => i.name.toLowerCase().includes(val.toLowerCase())).slice(0, 20));
        setShow(true);
    };

    return (
        <div className="relative w-full max-w-sm">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                <input
                    type="text" value={q} onChange={e => performSearch(e.target.value)}
                    placeholder="Quick Search..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-500/50 text-slate-200 transition-all placeholder:text-slate-600"
                />
            </div>
            {show && q.length > 1 && (
                <div className="absolute top-full left-0 w-full bg-[#1e293b] mt-2 rounded-xl shadow-2xl border border-white/10 max-h-80 overflow-y-auto z-[60] custom-scrollbar animate-slide-up">
                    {res.length > 0 ? res.map((r, i) => (
                        <div key={i} onClick={() => { onNavigate(r.path); setShow(false); setQ(""); }}
                            className="px-4 py-3 hover:bg-blue-500/10 cursor-pointer flex items-center justify-between group border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded ${r.type === 'Slot' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {r.type === 'Slot' ? <Layers size={14} /> : <Package size={14} />}
                                </div>
                                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{r.name}</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    )) : <div className="p-6 text-center text-xs text-slate-500 italic">No results found</div>}
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ node, label, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown }) => {
    const countDetails = [];
    if (node.InventoryAttachments?.length) countDetails.push(`${node.InventoryAttachments.length} Slots`);
    if (node.InventoryCargo?.length) countDetails.push(`${node.InventoryCargo.length} Cargo`);
    if (node.Sets?.length) countDetails.push(`${node.Sets.length} Sets`);
    if (node.Items?.length) countDetails.push(`${node.Items.length} Items`);

    return (
        <div className="group glass-card hover:bg-white/[0.08] p-3 rounded-2xl flex items-center gap-4 transition-all duration-200 shadow-sm relative overflow-hidden animate-slide-up border border-white/5 hover:border-white/20">
            <div className="flex flex-col gap-1 text-slate-600 hover:text-slate-400">
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="hover:text-blue-400 active:scale-125"><ChevronDown size={14} className="rotate-180" /></button>
                <GripVertical size={16} className="mx-auto" />
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="hover:text-blue-400 active:scale-125"><ChevronDown size={14} /></button>
            </div>

            <div className={`p-3 rounded-xl ${label === 'Slot' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]'}`} onClick={onEdit}>
                {label === 'Slot' ? <Layers size={22} /> : <Package size={22} />}
            </div>

            <div className="flex-1 cursor-pointer min-w-0" onClick={onEdit}>
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-slate-100 group-hover:text-white transition-colors truncate">{node.ClassName || node.SlotName || "Unnamed"}</span>
                    {node.Chance !== undefined && (
                        <span className="text-[9px] bg-slate-900/50 text-slate-400 px-2 py-0.5 rounded-full border border-white/10 font-mono tracking-tighter">
                            {(node.Chance * 100).toFixed(0)}%
                        </span>
                    )}
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {countDetails.map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 tracking-wider uppercase font-bold">{d}</span>
                    ))}
                    {!countDetails.length && <span className="text-[9px] text-slate-600 italic">No Nested Elements</span>}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all absolute right-4 bg-[#1e293b]/90 p-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl scale-90 group-hover:scale-100">
                <GlassButton variant="secondary" size="sm" onClick={onDuplicate} title="Duplicate"><Copy size={14} /></GlassButton>
                <GlassButton variant="primary" size="sm" onClick={onEdit} className="text-xs">Configure <ChevronRight size={14} /></GlassButton>
                <GlassButton variant="danger" size="sm" onClick={onDelete}><Trash2 size={14} /></GlassButton>
            </div>
        </div>
    );
};

const DetailPane = ({ data, path, updateNode, navigate, itemDb, attDb, slotDb, isHeaderExpanded, setIsHeaderExpanded }) => {
    const node = useMemo(() => getNested(data, path), [data, path]);
    if (!node) return <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500"><AlertCircle size={48} /><p>Selection not found.</p><GlassButton onClick={() => navigate([])}>Back to Root</GlassButton></div>;

    const isSlot = node.SlotName !== undefined && node.ClassName === undefined;
    const setField = (f, v) => updateNode([...path, f], v);

    const handleAddItem = (key, def) => setField(key, [...(node[key] || []), def]);
    const handleDelete = (key, idx) => { if (confirm('Delete this?')) { const l = [...node[key]]; l.splice(idx, 1); setField(key, l); } };
    const handleDup = (key, idx) => { const l = [...node[key]]; l.splice(idx + 1, 0, deepClone(l[idx])); setField(key, l); };
    const handleMove = (key, from, to) => {
        if (to < 0 || to >= node[key].length) return;
        const l = [...node[key]];
        const [m] = l.splice(from, 1);
        l.splice(to, 0, m);
        setField(key, l);
    };

    return (
        <div className="space-y-10 pb-20 w-full px-4 animate-slide-up">
            {/* Header Config */}
            <section className="glass rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500 ease-in-out">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className={`p-8 ${!isHeaderExpanded ? 'pb-8' : 'pb-4'} flex justify-between items-center transition-all cursor-pointer hover:bg-white/[0.02]`}
                    onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl transition-all duration-300 ${isSlot ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'} ${!isHeaderExpanded ? 'scale-75' : 'scale-100'}`}>
                            {isSlot ? <Layers size={isHeaderExpanded ? 28 : 20} /> : <Package size={isHeaderExpanded ? 28 : 20} />}
                        </div>
                        <div>
                            <h2 className={`font-black text-white tracking-tight transition-all duration-300 ${isHeaderExpanded ? 'text-2xl' : 'text-lg'}`}>{isSlot ? "Slot Settings" : "Item Settings"}</h2>
                            <p className="text-slate-400 text-sm italic">{path.length === 0 ? "Global Loadout Root" : `Object Hierarchy: Level ${Math.floor(path.length / 2)}`}</p>
                        </div>
                    </div>
                    <GlassButton variant="ghost" size="sm" className={`rounded-full transition-transform duration-500 ${isHeaderExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </GlassButton>
                </div>

                <div className={`px-8 pb-8 transition-all duration-500 ease-in-out overflow-hidden ${isHeaderExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pt-4 border-t border-white/5">
                        {isSlot ? (
                            <AutoCompleteField label="Slot Name" value={node.SlotName} onChange={v => setField('SlotName', v)} options={slotDb} className="md:col-span-2" />
                        ) : (
                            <>
                                <AutoCompleteField label="ClassName" value={node.ClassName} options={itemDb} className="lg:col-span-2"
                                    onChange={v => {
                                        setField('ClassName', v);
                                        if (attDb[v] && (!node.InventoryAttachments || node.InventoryAttachments.length === 0)) {
                                            if (confirm(`Auto-create slots for ${v}?`)) {
                                                const nSlots = attDb[v].map(a => ({ SlotName: "Att_" + a, Items: [{ ...createDefaultItem(), ClassName: a }] }));
                                                setField('InventoryAttachments', nSlots);
                                            }
                                        }
                                    }}
                                />
                                <InputField label="Spawn Chance (0.0 - 1.0)" type="number" step="0.1" value={node.Chance} onChange={v => setField('Chance', v)} />
                                <InputField label="Include Header (Optional)" value={node.Include} onChange={v => setField('Include', v)} placeholder="Default" />
                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
                                    <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Advanced Stats</h4></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Min Quantity" type="number" value={node.Quantity?.Min} onChange={v => updateNode([...path, 'Quantity', 'Min'], v)} />
                                        <InputField label="Max Quantity" type="number" value={node.Quantity?.Max} onChange={v => updateNode([...path, 'Quantity', 'Max'], v)} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Inventory Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Slots Section */}
                {!isSlot && (
                    <section className="space-y-4 flex flex-col h-full bg-[#1e293b]/20 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-center px-4 mb-2">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><Layers className="text-indigo-400" size={20} /> Attachments</h3>
                            <GlassButton variant="indigo" size="sm" onClick={() => handleAddItem('InventoryAttachments', createDefaultSlot())}><Plus size={16} /> New Slot</GlassButton>
                        </div>
                        <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px] pr-2 flex-1">
                            {node.InventoryAttachments?.map((s, i) => (
                                <SummaryCard key={i} label="Slot" node={s} index={i}
                                    onEdit={() => navigate([...path, 'InventoryAttachments', i])}
                                    onDelete={() => handleDelete('InventoryAttachments', i)}
                                    onDuplicate={() => handleDup('InventoryAttachments', i)}
                                    onMoveUp={() => handleMove('InventoryAttachments', i, i - 1)}
                                    onMoveDown={() => handleMove('InventoryAttachments', i, i + 1)}
                                />
                            ))}
                            {(!node.InventoryAttachments?.length) && <div className="py-12 text-center text-slate-600 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">No slots defined</div>}
                        </div>
                    </section>
                )}

                {/* Cargo Section */}
                {!isSlot && (
                    <section className="space-y-4 flex flex-col h-full bg-[#1e293b]/20 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-center px-4 mb-2">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><Box className="text-amber-400" size={20} /> Cargo Inventory</h3>
                            <GlassButton variant="secondary" size="sm" onClick={() => handleAddItem('InventoryCargo', createDefaultItem())}><Plus size={16} /> New Cargo</GlassButton>
                        </div>
                        <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px] pr-2 flex-1">
                            {node.InventoryCargo?.map((c, i) => (
                                <SummaryCard key={i} node={c} index={i}
                                    onEdit={() => navigate([...path, 'InventoryCargo', i])}
                                    onDelete={() => handleDelete('InventoryCargo', i)}
                                    onDuplicate={() => handleDup('InventoryCargo', i)}
                                    onMoveUp={() => handleMove('InventoryCargo', i, i - 1)}
                                    onMoveDown={() => handleMove('InventoryCargo', i, i + 1)}
                                />
                            ))}
                            {(!node.InventoryCargo?.length) && <div className="py-12 text-center text-slate-600 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">Cargo space is empty</div>}
                        </div>
                    </section>
                )}

                {!isSlot && (
                    <section className="space-y-4 flex flex-col h-full bg-[#1e293b]/20 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-center px-4 mb-2">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><LayoutGrid className="text-emerald-400" size={20} /> Randomized Sets</h3>
                            <GlassButton variant="success" size="sm" onClick={() => handleAddItem('Sets', createDefaultSet())}><Plus size={16} /> New Set</GlassButton>
                        </div>
                        <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px] pr-2 flex-1">
                            {node.Sets?.map((s, i) => (
                                <SummaryCard key={i} node={s} index={i}
                                    onEdit={() => navigate([...path, 'Sets', i])}
                                    onDelete={() => handleDelete('Sets', i)}
                                    onDuplicate={() => handleDup('Sets', i)}
                                    onMoveUp={() => handleMove('Sets', i, i - 1)}
                                    onMoveDown={() => handleMove('Sets', i, i + 1)}
                                />
                            ))}
                            {(!node.Sets?.length) && <div className="py-12 text-center text-slate-600 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">No sets defined</div>}
                        </div>
                    </section>
                )}

                {/* Constructed Parts (Base building / advanced) */}
                {!isSlot && (
                    <section className="space-y-4 flex flex-col h-full bg-[#1e293b]/20 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-center px-4 mb-2">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><Hammer className="text-slate-400" size={20} /> Constructed Parts</h3>
                            <GlassButton variant="secondary" size="sm" onClick={() => handleAddItem('ConstructionPartsBuilt', { PartName: "New_Part" })}><Plus size={16} /> Add Part</GlassButton>
                        </div>
                        <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px] pr-2 flex-1 font-mono text-xs">
                            {node.ConstructionPartsBuilt?.map((p, i) => (
                                <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl group">
                                    <input
                                        className="bg-transparent border-none focus:ring-0 flex-1 text-slate-300"
                                        value={p.PartName || ""}
                                        onChange={e => {
                                            const l = [...node.ConstructionPartsBuilt];
                                            l[i] = { ...l[i], PartName: e.target.value };
                                            setField('ConstructionPartsBuilt', l);
                                        }}
                                    />
                                    <button onClick={() => handleDelete('ConstructionPartsBuilt', i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {(!node.ConstructionPartsBuilt?.length) && <div className="py-8 text-center text-slate-600 italic border-2 border-dashed border-white/5 rounded-3xl">No parts built</div>}
                        </div>
                    </section>
                )}

                {/* Slot Items Section (For Slots ONLY) */}
                {isSlot && (
                    <section className="xl:col-span-2 space-y-4 bg-[#1e293b]/20 p-8 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-center mb-6 px-4">
                            <h3 className="text-2xl font-black text-white tracking-tight">Possible Spawns ({node.Items?.length || 0})</h3>
                            <GlassButton size="lg" onClick={() => handleAddItem('Items', createDefaultItem())}><Plus size={20} /> Add Randomized Item</GlassButton>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {node.Items?.map((itm, i) => (
                                <SummaryCard key={i} node={itm} index={i}
                                    onEdit={() => navigate([...path, 'Items', i])}
                                    onDelete={() => handleDelete('Items', i)}
                                    onDuplicate={() => handleDup('Items', i)}
                                    onMoveUp={() => handleMove('Items', i, i - 1)}
                                    onMoveDown={() => handleMove('Items', i, i + 1)}
                                />
                            ))}
                            {(!node.Items?.length) && <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-[2rem] bg-black/10">No items configured for this slot</div>}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

// --- Main App Logic ---

function App() {
    const [data, setData] = useState(createDefaultItem());
    const [path, setPath] = useState([]);
    const [itemDb, setItemDb] = useState([]);
    const [attDb, setAttDb] = useState({});
    const [slotDb, setSlotDb] = useState(SLOTS_LIST);
    const [dbStats, setDbStats] = useState({ typesFiles: 0, typesItems: 0, spawnableFiles: 0, spawnableRules: 0 });
    const [showImport, setShowImport] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [fileHandle, setFileHandle] = useState(null);
    const [showPreview, setShowPreview] = useState(true);
    const [showJsonPanel, setShowJsonPanel] = useState(() => {
        const saved = localStorage.getItem('exp_show_json_panel');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(() => {
        const saved = localStorage.getItem('exp_header_expanded');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Persist UI states
    useEffect(() => {
        localStorage.setItem('exp_show_json_panel', JSON.stringify(showJsonPanel));
        localStorage.setItem('exp_header_expanded', JSON.stringify(isHeaderExpanded));
    }, [showJsonPanel, isHeaderExpanded]);

    // Toast System
    const addToast = useCallback((msg, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // LocalStorage Load (Shared with Electron later via IPC if needed)
    const refreshDatabase = useCallback(async () => {
        if (!window.electronAPI?.loadDatabase) return;
        setIsLoading(true);
        console.log("[App] 🚀 Syncing with File Database...");

        try {
            const res = await window.electronAPI.loadDatabase();
            if (res) {
                setItemDb(res.typesItems || []);
                setAttDb(res.spawnableRules || {});
                setDbStats(res.stats || { typesFiles: 0, spawnableFiles: 0, typesItems: 0, spawnableRules: 0 });
                addToast(`Sync Successful! ${res.stats?.typesItems || 0} items imported.`, 'success');
            }
        } catch (err) {
            console.error("[App] ❌ Sync Failed:", err);
            addToast("Failed to sync database", "danger");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        // Load initial data from File Cache (Electron)
        if (window.electronAPI?.getCachedDatabase) {
            window.electronAPI.getCachedDatabase().then(cache => {
                if (cache) {
                    console.log("[App] 📦 Loaded from File Cache:", cache.stats);
                    setItemDb(cache.typesItems || []);
                    setAttDb(cache.spawnableRules || {});
                    setDbStats(cache.stats || { typesFiles: 0, spawnableFiles: 0, typesItems: 0, spawnableRules: 0 });
                } else {
                    // Fallback to auto-sync if no cache exists
                    refreshDatabase();
                }
            }).catch(e => console.error("[App] Cache Load Error:", e));
        }
    }, [refreshDatabase]);

    const updateNode = useCallback((targetPath, value) => {
        setData(prev => setNested(prev, targetPath, value));
    }, []);

    // File Handlers (Using Native Electron API)
    const handleOpen = async () => {
        try {
            if (!window.electronAPI) return addToast("Electron API not found", "danger");
            const result = await window.electronAPI.selectFile();
            if (result) {
                setData(result.content);
                setFileHandle(result.path); // Store path string instead of handle
                setPath([]);
                setShowImport(false);
                addToast(`Loaded ${result.path.split(/[\\/]/).pop()}`, 'success');
            }
        } catch (e) {
            addToast("Open error: " + e.message, 'danger');
        }
    };

    const handleSave = async () => {
        if (!window.electronAPI) return addToast("Electron API not found", "danger");
        if (fileHandle && typeof fileHandle === 'string') {
            try {
                await window.electronAPI.saveFile({ filePath: fileHandle, content: data });
                addToast("Saved successfully", 'success');
            } catch (e) { addToast("Save failed: " + e.message, 'danger'); }
        } else handleSaveAs();
    };

    const handleSaveAs = async () => {
        try {
            if (!window.electronAPI) return addToast("Electron API not found", "danger");
            const newPath = await window.electronAPI.saveFileAs(data);
            if (newPath) {
                setFileHandle(newPath);
                addToast("File saved", 'success');
            }
        } catch (e) { addToast(e.message, 'danger'); }
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setData(parsed);
            setPath([]);
            setShowImport(false);
            addToast("Imported successfully", 'success');
        } catch (e) { addToast("Invalid JSON format", 'danger'); }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 4));
        setCopied(true);
        addToast("Copied to clipboard", 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    // Database Loaders
    const loadTypes = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsLoading(true);
        file.text().then(txt => {
            const p = new DOMParser();
            const xml = p.parseFromString(txt, "text/xml");
            const types = Array.from(xml.getElementsByTagName("type")).map(n => n.getAttribute("name")).filter(n => n);
            const unique = [...new Set(types)].sort();
            setItemDb(unique);
            localStorage.setItem('exp_db_items', JSON.stringify(unique));
            addToast(`Loaded ${unique.length} item types`, 'success');
            setIsLoading(false);
        }).catch(err => {
            addToast("Error parsing XML", 'danger');
            setIsLoading(false);
        });
    };

    const loadSpawnable = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsLoading(true);
        file.text().then(txt => {
            const p = new DOMParser();
            const xml = p.parseFromString(txt, "text/xml");
            const db = {};
            for (let t of xml.getElementsByTagName("type")) {
                const n = t.getAttribute("name");
                const atts = Array.from(t.getElementsByTagName("attachments")).flatMap(a => Array.from(a.getElementsByTagName("item")).map(i => i.getAttribute("name")));
                if (n && atts.length) db[n] = atts;
            }
            setAttDb(db);
            localStorage.setItem('exp_db_atts', JSON.stringify(db));
            addToast(`Loaded attachment rules for ${Object.keys(db).length} items`, 'success');
            setIsLoading(false);
        });
    };

    return (
        <div className="h-screen flex flex-col relative bg-slate-900 text-slate-200">
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map(t => (
                    <div key={t.id} className={`glass px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border-white/10 ${t.type === 'danger' ? 'bg-red-500/20 text-red-300 border-red-500/20' : 'bg-blue-500/20 text-blue-300 border-blue-500/20'}`}>
                        {t.type === 'danger' ? <AlertCircle size={18} /> : <Check size={18} />}
                        <span className="text-sm font-bold tracking-wide">{t.msg}</span>
                    </div>
                ))}
            </div>

            <header className="h-20 glass flex justify-between items-center px-8 shrink-0 z-50 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                        <FileSignature size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-lg text-white leading-tight tracking-tight">Loadout Manager</h1>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Portable Desktop v1.0</p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center px-8">
                    <SearchSystem data={data} onNavigate={setPath} />
                </div>

                <div className="flex items-center gap-3">
                    <GlassButton variant="secondary" onClick={() => setShowSettings(true)} title="Database Management"><Settings size={18} /></GlassButton>
                    <div className="h-8 w-px bg-white/10 mx-1"></div>
                    <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5">
                        <GlassButton variant="ghost" size="sm" onClick={() => setShowJsonPanel(!showJsonPanel)} title={showJsonPanel ? "Hide JSON Output" : "Show JSON Output"}>
                            {showJsonPanel ? <Eye size={18} /> : <EyeOff size={18} />}
                        </GlassButton>
                        <div className="h-4 w-px bg-white/10 mx-1 my-auto"></div>
                        <GlassButton variant="ghost" size="sm" onClick={handleOpen} title="Open File"><FolderOpen size={18} /></GlassButton>
                        <GlassButton variant="ghost" size="sm" onClick={handleSave} title="Quick Save"><Save size={18} /></GlassButton>
                        <GlassButton variant="ghost" size="sm" onClick={handleSaveAs} title="Save As New File"><Download size={18} /></GlassButton>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-1"></div>
                    <GlassButton variant="primary" onClick={() => setShowImport(true)}><LayoutGrid size={18} /> Import / View JSON</GlassButton>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showJsonPanel ? 'flex-[0.6] min-w-[60%]' : 'flex-1'}`}>
                    <BreadcrumbNav path={path} rootData={data} onNavigate={setPath} />
                    <main className="flex-1 overflow-y-auto p-10 custom-scrollbar scroll-smooth">
                        <DetailPane
                            data={data}
                            path={path}
                            updateNode={updateNode}
                            navigate={setPath}
                            itemDb={itemDb}
                            attDb={attDb}
                            slotDb={slotDb}
                            isHeaderExpanded={isHeaderExpanded}
                            setIsHeaderExpanded={setIsHeaderExpanded}
                        />
                    </main>
                </div>

                {showJsonPanel && (
                    <aside className="w-[40%] border-l border-white/5 flex flex-col bg-black/20 backdrop-blur-sm animate-slide-up">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-2">
                                <Code size={16} className="text-blue-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">JSON Output</h3>
                            </div>
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500 font-mono">READ ONLY</span>
                        </div>
                        <div className="flex-1 overflow-auto p-6 custom-scrollbar text-[11px] font-mono leading-relaxed selection:bg-blue-500/30">
                            <pre className="text-blue-300/90 whitespace-pre-wrap">
                                {JSON.stringify(data, null, 4)}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black/20">
                            <GlassButton className="w-full text-xs" onClick={handleCopy}>
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copied ? "Copied!" : "Export / Copy JSON"}
                            </GlassButton>
                        </div>
                    </aside>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="glass p-10 rounded-[3rem] w-full max-w-4xl shadow-2xl relative overflow-hidden animate-slide-up border-blue-500/20">
                        <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"><X size={32} /></button>
                        <div className="flex justify-between items-end mb-12">
                            <div className="max-w-xl">
                                <h2 className="text-4xl font-black text-white mb-2 leading-tight">Database Center</h2>
                                <p className="text-slate-500 font-medium">Link your server files to enable smart features and precise autocomplete.</p>
                            </div>
                            <GlassButton variant="primary" size="lg" onClick={refreshDatabase} disabled={isLoading} className="shadow-blue-500/20 px-8">
                                {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <><RefreshCw size={20} /> Sync Database Folders</>}
                            </GlassButton>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group">
                                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-blue-500/30"><Database size={28} /></div>
                                <h3 className="text-xl font-bold text-white mb-2">Item Database</h3>
                                <p className="text-slate-500 text-sm mb-4 leading-relaxed">Upload <code>types.xml</code> to populate autocomplete.</p>
                                <div className="space-y-2 mb-6">
                                    {itemDb.length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{itemDb.length} Items Loaded</span>
                                        </div>
                                    )}
                                    {dbStats.typesFiles > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg w-fit">
                                            <FileText size={10} className="text-blue-400" />
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{dbStats.typesFiles} Files in Database folder</span>
                                        </div>
                                    )}
                                </div>
                                <label className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-xl shadow-blue-500/10 active:scale-95">
                                    {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <><Upload size={16} className="inline mr-2" /> Select types.xml</>}
                                    <input type="file" className="hidden" accept=".xml" onChange={loadTypes} />
                                </label>
                            </div>
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group">
                                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-blue-500/30"><FileCode size={28} /></div>
                                <h3 className="text-xl font-bold text-white mb-2">Spawn Rules</h3>
                                <p className="text-slate-500 text-sm mb-4 leading-relaxed">Upload <code>cfgspawnabletypes.xml</code> for attachments.</p>
                                <div className="space-y-2 mb-6">
                                    {Object.keys(attDb).length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{Object.keys(attDb).length} Rules Loaded</span>
                                        </div>
                                    )}
                                    {dbStats.spawnableFiles > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg w-fit">
                                            <FileCode size={10} className="text-blue-400" />
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{dbStats.spawnableFiles} Files in Database folder</span>
                                        </div>
                                    )}
                                </div>
                                <label className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-xl shadow-blue-500/10 active:scale-95">
                                    {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <><Upload size={16} className="inline mr-2" /> Select spawnable.xml</>}
                                    <input type="file" className="hidden" accept=".xml" onChange={loadSpawnable} />
                                </label>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-600 uppercase font-black tracking-widest">Database is saved in local application storage</p>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="glass p-10 rounded-[3rem] w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-slide-up border-white/10">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <h2 className="text-3xl font-black text-white tracking-tight">JSON Interface</h2>
                            <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white transition-colors"><X size={32} /></button>
                        </div>
                        <textarea
                            className="flex-1 bg-black/30 border border-white/5 rounded-3xl p-8 font-mono text-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 custom-scrollbar resize-none mb-8"
                            value={jsonInput || JSON.stringify(data, null, 4)}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder="Paste your Expansion Loadout JSON here..."
                        />
                        <div className="flex justify-end gap-4 shrink-0">
                            <GlassButton variant="secondary" size="lg" onClick={() => { setJsonInput(""); setShowImport(false); }} className="px-10">Cancel</GlassButton>
                            <GlassButton size="lg" onClick={handleImport} className="px-10 font-black">Apply Configuration</GlassButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
