'use client';

import React, { memo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const TrackingSearch = memo(function TrackingSearch() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();

    if (!cleanId) {
      setError('Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ.');
      return;
    }

    if (!cleanId.startsWith('ET-') || cleanId.length !== 13) {
      setError('Ø±Ù‚Ù… ØªØªØ¨Ø¹ ØºÙŠØ± ØµØ­ÙŠØ­. ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¨Ø¯Ø£ Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹ Ø¨Ù€ "ET-" Ù…ØªØ¨ÙˆØ¹Ø§Ù‹ Ø¨Ù€ 10 Ø±Ù…ÙˆØ² (Ù…Ø«Ø§Ù„: ET-A1B2C3D4E5).');
      return;
    }

    setError('');
    router.push(`/track/${cleanId}`);
  }, [router, trackingId]);

  return (
    <section className="py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low min-h-[80vh] flex items-center font-poppins">
      <div className="max-w-max-width mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 text-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo with CSS blend mode */}
           <img
             alt="Ø´Ø¹Ø§Ø± Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨"
             className="h-12 md:h-16 w-auto object-contain mix-blend-multiply"
             src="/logo.jpg"
             width="64"
             height="64"
             style={{ width: 'auto' }}
           />
          <h1 className="font-display-lg text-display-lg leading-tight text-on-surface">
            ØªØªØ¨Ø¹ Ø´Ø­Ù†Ø© <br />
            <span className="text-primary">Ù…Ø³ØªÙ„Ø²Ù…Ø§ØªÙƒ Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ©.</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-md">
            Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹ Ø§Ù„ÙØ±ÙŠØ¯ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù„Ø´Ø­Ù†Ø© Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant/30 shadow-xl text-start">
          <h2 className="font-headline-md text-headline-md mb-8 text-on-surface">ØªØªØ¨Ø¹ Ø§Ù„Ø´Ø­Ù†Ø©</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">
                Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ (Ø§Ù„ØªØªØ¨Ø¹)
              </label>
              <input
                className={`w-full bg-white border rounded-lg p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline-variant uppercase tracking-widest text-center font-mono font-semibold text-on-surface ${
                  error ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                }`}
                placeholder="ET-A1B2C3D4E5"
                type="text"
                dir="ltr"
                value={trackingId}
                onChange={(e) => {
                  setTrackingId(e.target.value);
                  if (error) setError('');
                }}
              />
              {error && (
                <p className="text-xs text-error font-medium mt-1">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all uppercase tracking-widest cursor-pointer font-bold"
            >
              ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨
            </button>
          </form>
        </div>
      </div>
    </section>
  );
});

