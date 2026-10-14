type DropdownProps = {
  items: string[];
  onSelect: (value: string) => void;
  className?: string;
  itemClassName?: string;
};

export default function SelectMenu({
  items,
  onSelect,
  className = '',
  itemClassName = '',
}: DropdownProps) {
  return (
    <ul
      className={`absolute top-full w-full bg-mt-white border border-mt-border rounded-xl shadow-sm z-10 ${className}`}
    >
      {items.map((item) => (
        <li
          key={item}
          className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-normal hover:bg-mt-bg-soft ${itemClassName}`}
          onClick={() => onSelect(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
