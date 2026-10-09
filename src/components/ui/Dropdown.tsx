import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, POP } from '../../lib/motion.ts';
import { Icon, type IconName } from './Icon.tsx';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  /** Language of the label, so mixed-language lists are read and rendered correctly. */
  lang?: string;
}

interface DropdownProps {
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  /** Accessible name of the control, for example "Language". */
  label: string;
  icon?: IconName;
  variant?: 'pill' | 'field';
  /** Which edge of the trigger the list lines up with. */
  align?: 'start' | 'end';
}

const OPEN_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', ' ']);
const PAGE_STEP = 10;
const TYPE_AHEAD_RESET_MS = 700;

type RevealMode = 'center' | 'nearest';

/** A select built from divs: a button that opens a styled listbox panel. Keyboard, type-ahead and screen readers work like a native select. */
export function Dropdown({ value, options, onChange, label, icon, variant = 'pill', align = 'start' }: DropdownProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reveal = useRef<RevealMode | null>(null);
  const typed = useRef({ text: '', timer: 0 });
  const [open, setOpen] = useState(false);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [active, setActive] = useState(selectedIndex);
  const selected = options[selectedIndex];

  useGsap(
    rootRef,
    () => {
      if (!open || !listRef.current) return;
      gsap.from(listRef.current, {
        opacity: 0,
        y: -8,
        scale: 0.96,
        transformOrigin: `top ${align === 'end' ? 'right' : 'left'}`,
        duration: 0.22,
        ease: POP,
      });
    },
    [open],
  );

  // Keeps the highlighted option in view: centred when the list opens, the smallest scroll afterwards. Mouse hover never scrolls.
  useLayoutEffect(() => {
    const mode = reveal.current;
    reveal.current = null;
    const list = listRef.current;
    const option = list?.children[active];
    if (!mode || !list || !(option instanceof HTMLElement)) return;
    if (mode === 'nearest') return option.scrollIntoView({ block: 'nearest' });
    list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
  }, [open, active]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  const openList = () => {
    reveal.current = 'center';
    setActive(selectedIndex);
    setOpen(true);
  };

  const moveTo = (index: number) => {
    reveal.current = 'nearest';
    setActive(Math.min(options.length - 1, Math.max(0, index)));
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const typeAhead = (char: string) => {
    window.clearTimeout(typed.current.timer);
    typed.current.text += char.toLowerCase();
    typed.current.timer = window.setTimeout(() => {
      typed.current.text = '';
    }, TYPE_AHEAD_RESET_MS);

    // One letter jumps to the next match, so repeating it cycles; more letters narrow the current one.
    const { text } = typed.current;
    const start = text.length === 1 ? active + 1 : active;
    const ordered = options.map((_, offset) => (start + offset) % options.length);
    const find = (test: (text: string) => boolean) => ordered.find((index) => test(options[index]?.label.toLowerCase() ?? ''));
    const match = find((label) => label.startsWith(text)) ?? find((label) => label.includes(text));
    if (match === undefined) return;

    if (!open) openList();
    moveTo(match);
  };

  const handleToggle = () => (open ? setOpen(false) : openList());

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;
    if (key === 'Tab') return setOpen(false);

    if (!open && OPEN_KEYS.has(key)) {
      event.preventDefault();
      return openList();
    }

    if (key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) return typeAhead(key);
    if (!open) return;

    const moves: Record<string, () => void> = {
      ArrowDown: () => moveTo(active + 1),
      ArrowUp: () => moveTo(active - 1),
      PageDown: () => moveTo(active + PAGE_STEP),
      PageUp: () => moveTo(active - PAGE_STEP),
      Home: () => moveTo(0),
      End: () => moveTo(options.length - 1),
      Enter: () => choose(active),
      ' ': () => choose(active),
      // Stops here so a menu around the dropdown (the mobile menu) stays open.
      Escape: () => {
        event.stopPropagation();
        setOpen(false);
      },
    };

    const move = moves[key];
    if (!move) return;
    event.preventDefault();
    move();
  };

  return (
    <div ref={rootRef} className={styles.root} data-variant={variant} data-open={open}>
      <button
        type="button"
        role="combobox"
        className={styles.trigger}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {icon && <Icon name={icon} size={20} className={styles.fixed} />}
        <span className={styles.value} lang={selected?.lang}>
          {selected?.label}
        </span>
        <Icon name="chevron-down" size={18} className={`${styles.fixed} ${styles.chevron}`} />
      </button>

      {open && (
        // Keeping the mouse press off the list leaves focus on the trigger, so the keyboard keeps working after a click.
        <div ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className={styles.list} data-align={align} onMouseDown={(event) => event.preventDefault()}>
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              lang={option.lang}
              aria-selected={index === selectedIndex}
              data-active={index === active}
              className={styles.option}
              onClick={() => choose(index)}
              onMouseMove={() => setActive(index)}
            >
              <span>{option.label}</span>
              {index === selectedIndex && <Icon name="check" size={16} className={styles.fixed} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
