import { ShieldCheck, Cpu, Database, Zap } from 'lucide-react';

export default function About() {
  const highlights = [
    {
      icon: Zap,
      title: 'Unified Indian Retailer Search',
      text: 'Compares listings across Amazon India, Flipkart, Croma, Reliance Digital, and Vijay Sales in one unified view.',
    },
    {
      icon: Cpu,
      title: 'Smart Model & Accessory Filtering',
      text: 'Token matching keeps iPhone 15 separate from 15 Pro/Plus and filters out phone cases, screen guards, and chargers unless requested.',
    },
    {
      icon: Database,
      title: 'Intelligent Caching & Zero-Setup Storage',
      text: 'Caches recent price lookups for 3 hours to reduce redundant calls and runs seamlessly on local JSON storage or MongoDB.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Data Provenance',
      text: 'Every price card clearly indicates whether prices are Live, Cached, or Sample data so shoppers always know what they are looking at.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 to-blue-800 p-8 text-white sm:p-12">
        <h1 className="text-3xl font-extrabold sm:text-4xl">About SmartDeal AI</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-indigo-100">
          SmartDeal AI is an automated gadget price comparison platform built for Indian
          shoppers. Instead of opening five browser tabs and manually filtering out cases
          or mismatched models, you get a clean Low-to-High breakdown in seconds.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

