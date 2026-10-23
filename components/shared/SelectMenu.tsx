type DropdownProps = {
  items: string[];
  onSelect: (value: string) => void;
  className?: string;
  itemClassName?: string;
  id?: string;
};

export default function SelectMenu({
  items,
  onSelect,
  className = '',
  itemClassName = '',
  id,
}: DropdownProps) {
  return (
    <ul
      id={id}
      className={`absolute top-full w-full bg-mt-white border border-mt-border rounded-xl shadow-sm z-10 ${className}`}
    >
      {items.map((item) => (
        <li key={item}>
          <button
            type="button"
            className={`w-full rounded-xl px-4 py-2 text-left text-sm font-normal hover:bg-mt-bg-soft focus-visible:outline-2 focus-visible:outline-mt-primary ${itemClassName}`}
            onClick={() => onSelect(item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(item);
              }
            }}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}
