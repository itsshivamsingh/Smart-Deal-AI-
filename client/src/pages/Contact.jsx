import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, MapPin } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Contact Us</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Have a feature suggestion, spotted a pricing mismatch, or want to partner with
            SmartDeal AI? Send us a message and we&apos;ll get back to you.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Mail className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Support</p>
                <p className="text-sm text-slate-500">support@smartdeal.ai</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Location</p>
                <p className="text-sm text-slate-500">Bengaluru, Karnataka, India</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {submitted ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h2 className="mt-4 text-xl font-bold text-slate-900">Message Received</h2>
              <p className="mt-2 text-sm text-slate-600">
                Thanks for reaching out! Our team will review your note shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <span>Send a Message</span>
              </div>

              <div>
                <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="c-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="c-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="c-msg" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="c-msg"
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

