'use client';

interface SupportButtonsProps {
  items: {
    icon: string;
    title: string;
    desc: string;
    action: string;
    href?: string;
    onClick?: () => void;
    color: string;
  }[];
}

export default function SupportButtons({ items }: SupportButtonsProps) {
  const handleClick = (item: typeof items[0]) => {
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {items.map((item, i) => (
        item.onClick ? (
          <button
            key={i}
            onClick={() => handleClick(item)}
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-6 text-center block hover:shadow-md transition-shadow text-left"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-[#0a2540] mb-2">{item.title}</h3>
            <p className="text-sm text-[#425466] mb-4">{item.desc}</p>
            <span className={`text-sm font-semibold ${item.color}`}>{item.action} →</span>
          </button>
        ) : (
          <a
            key={i}
            href={item.href}
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-6 text-center block hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-[#0a2540] mb-2">{item.title}</h3>
            <p className="text-sm text-[#425466] mb-4">{item.desc}</p>
            <span className={`text-sm font-semibold ${item.color}`}>{item.action} →</span>
          </a>
        )
      ))}
    </div>
  );
}