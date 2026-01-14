import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Ellipsis } from "lucide-react";

interface DropdownItem {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
}

function Dropdown({ items, trigger }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160, // 160px = w-40
      });
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
      >
        {trigger || <Ellipsis className="w-5 h-5" />}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-40 bg-neutral-50 border border-neutral-200 rounded-xl shadow-lg z-50"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="p-1 gap-px flex flex-col">
              {items.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-md text-left px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export { Dropdown, type DropdownProps, type DropdownItem };
