import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '../lib/brand';

export function Contact() {
  const { navigate } = useNavigation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">Contact Us</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black mb-2">CONTACT US</h1>
          <p className="text-gray-400">We're here to help! Reach out anytime.</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <MessageCircle size={18} />
            WhatsApp Us Now
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-6">Get In Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50 text-orange-500">
                  <Phone size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Phone / WhatsApp</p>
                  <a href={`tel:+92${WHATSAPP_NUMBER.slice(1)}`} className="text-sm text-orange-500 font-semibold hover:underline">
                    +92 304 4454356
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Available 10:30 AM – 8:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500">
                  <Mail size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Email</p>
                  <a href="mailto:info@creatormart.pk" className="text-sm text-blue-500 hover:underline">info@creatormart.pk</a>
                  <br />
                  <a href="mailto:support@creatormart.pk" className="text-sm text-blue-500 hover:underline">support@creatormart.pk</a>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50 text-green-500">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Address</p>
                  <p className="text-sm text-gray-600">Plaza No. 145-B, Commercial</p>
                  <p className="text-sm text-gray-600">Jasmine Block, Bahria Town</p>
                  <p className="text-sm text-gray-600 font-semibold">Lahore, Pakistan</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-yellow-50 text-yellow-600">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Working Hours</p>
                  <p className="text-sm text-gray-600">Mon – Sat: 10:30 AM – 8:00 PM</p>
                  <p className="text-sm text-gray-600">Sunday: 12:00 PM – 6:00 PM</p>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-56">
              <iframe
                title="ABR Shop Location"
                src="https://maps.google.com/maps?q=Jasmine+Block+Commercial+Bahria+Town+Lahore+Pakistan&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://maps.google.com/maps?q=Jasmine+Block+Bahria+Town+Lahore"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 mt-2 text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
            >
              <MapPin size={12} />
              Open in Google Maps
            </a>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 mb-4">Thank you for reaching out. We'll get back to you shortly.</p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm mb-3"
                >
                  <MessageCircle size={16} />
                  Quick Reply on WhatsApp
                </a>
                <br />
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-orange-500 hover:text-orange-600 font-semibold mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name *</label>
                    <input type="text" required placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone *</label>
                    <input type="tel" required placeholder="03xx xxx xxxx" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={e => update('subject', e.target.value)} className={inputCls}>
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Information</option>
                    <option value="return">Return / Exchange</option>
                    <option value="delivery">Delivery Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Or{' '}
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="text-green-600 font-semibold hover:underline">
                    chat directly on WhatsApp
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
