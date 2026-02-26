export default function TickerTape() {
  const items = [
    { label: "NIFTY 50", value: "22186.65", change: "+0.74%", dir: "up" },
    { label: "SENSEX", value: "73128.77", change: "+0.69%", dir: "up" },
    { label: "BANK NIFTY", value: "48432.30", change: "+0.52%", dir: "up" },
    { label: "INDIA VIX", value: "14.20", change: "-2.1%", dir: "down" },
    { label: "USD/INR", value: "83.42", change: "-0.12%", dir: "down" },
    { label: "GOLD (MCX)", value: "71840", change: "+0.25%", dir: "up" },
    { label: "10Y G-SEC", value: "7.04%", change: "-0.02", dir: "down" },
    { label: "CRUDE (MCX)", value: "46820", change: "-1.4%", dir: "down" },
    { label: "RELIANCE", value: "₹2,948.70", change: "+1.26%", dir: "up" },
    { label: "HDFCBANK", value: "₹1,432.50", change: "+0.85%", dir: "up" },
    { label: "TCS", value: "₹3,942.55", change: "+1.27%", dir: "up" },
    { label: "INFY", value: "₹1,474.20", change: "+1.04%", dir: "up" },
  ];

  return (
    <div className="bg-[#0b101e] border-b border-[#1f2937] h-8 flex items-center overflow-hidden text-xs font-mono select-none">
      <div className="flex animate-marquee whitespace-nowrap min-w-max">
        {/* Double the array for seamless infinite scrolling */}
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center mx-4 gap-2">
            <span className="text-[#8b98a5]">{item.label}</span>
            <span className="text-white">{item.value}</span>
            <span className={item.dir === "up" ? "text-emerald-400" : "text-red-400"}>
              {item.dir === "up" ? "▲" : "▼"}{item.change}
            </span>
            <span className="text-[#374151] ml-4">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
