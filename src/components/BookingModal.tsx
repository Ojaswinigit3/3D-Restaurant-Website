import React, { useState, useMemo } from 'react';
import { X, Check, Calendar, Users, Sparkles } from 'lucide-react';
import { SUITE_OPTIONS, CURATED_EXPERIENCES } from '../data/scenesData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSuiteId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialSuiteId = SUITE_OPTIONS[0].id,
}) => {
  const [selectedSuiteId, setSelectedSuiteId] = useState(initialSuiteId);
  const [checkIn, setCheckIn] = useState('2026-11-12');
  const [checkOut, setCheckOut] = useState('2026-11-16');
  const [guests, setGuests] = useState(2);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>(['yacht-charter']);
  const [guestName, setGuestName] = useState('Contessa Elena Vance');
  const [guestEmail, setGuestEmail] = useState('elena.vance@private-atelier.eu');
  const [specialRequests, setSpecialRequests] = useState('Private helicopter transfer from Naples Capodichino; vintage 2016 Franciacorta chilled upon arrival.');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const selectedSuite = useMemo(
    () => SUITE_OPTIONS.find((s) => s.id === selectedSuiteId) || SUITE_OPTIONS[0],
    [selectedSuiteId]
  );

  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 4 : diff);
  }, [checkIn, checkOut]);

  const experiencesTotal = useMemo(() => {
    return CURATED_EXPERIENCES.filter((e) => selectedExperiences.includes(e.id)).reduce(
      (sum, item) => sum + item.price,
      0
    );
  }, [selectedExperiences]);

  const accommodationTotal = selectedSuite.nightlyRate * nights;
  const grandTotal = accommodationTotal + experiencesTotal;

  if (!isOpen) return null;

  const toggleExperience = (id: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const randomCode = `VA-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmationCode(randomCode);
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#060E0B]/85 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0B1914] border border-[#C8A45D]/40 text-[#F7F3E8] shadow-2xl overflow-hidden my-auto">
        {/* Top Ornamental Hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#0B1914] via-[#C8A45D] to-[#0B1914]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6 border-b border-[#C8A45D]/20">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#C8A45D] mb-1">
              Villa Aurelia · Private Concierge Desk
            </p>
            <h2 id="booking-modal-title" className="font-display text-2xl sm:text-3xl font-normal text-[#F7F3E8]">
              {isConfirmed ? 'Your Sanctuary Awaits' : 'Reserve Your Coastal Sojourn'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-[#F7F3E8]/70 hover:text-[#C8A45D] border border-[#C8A45D]/25 hover:border-[#C8A45D] transition-colors cursor-pointer"
            aria-label="Close reservation dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isConfirmed ? (
          <div className="p-6 sm:p-10 space-y-8">
            <div className="p-6 bg-[#11241D] border border-[#C8A45D]/35 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C8A45D]/20 pb-4">
                <div>
                  <span className="text-xs text-[#C8A45D] tracking-widest block">
                    Confirmed Reservation Reference
                  </span>
                  <span className="font-mono-tabular text-2xl text-[#F7F3E8] font-medium">
                    {confirmationCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#C8A45D]">
                  <Check className="w-4 h-4" />
                  <span>Guaranteed by Private Maggiordomo</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-sm">
                <div>
                  <span className="text-xs text-[#F7F3E8]/60 block mb-1">Primary Guest</span>
                  <p className="font-medium text-[#F7F3E8]">{guestName}</p>
                  <p className="text-xs text-[#F7F3E8]/60 mt-0.5">{guestEmail}</p>
                </div>
                <div>
                  <span className="text-xs text-[#F7F3E8]/60 block mb-1">Selected Residence</span>
                  <p className="font-display text-base text-[#C8A45D]">{selectedSuite.name}</p>
                  <p className="text-xs text-[#F7F3E8]/70 mt-0.5">
                    {selectedSuite.size} · {guests} {guests === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#F7F3E8]/60 block mb-1">Dates & Total</span>
                  <p className="font-mono-tabular text-xs text-[#F7F3E8]">
                    {checkIn} → {checkOut} ({nights} {nights === 1 ? 'Night' : 'Nights'})
                  </p>
                  <p className="font-mono-tabular text-base text-[#C8A45D] font-medium mt-1">
                    €{grandTotal.toLocaleString()} Total
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[#F7F3E8]/65 max-w-lg">
                Our Head Concierge in Ravello has dispatched your formal dossier and private harbor mooring coordinates to {guestEmail}.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmed(false)}
                  className="px-5 py-2.5 text-xs font-medium text-[#F7F3E8] border border-[#C8A45D]/40 hover:border-[#C8A45D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Modify Itinerary
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 text-xs font-medium bg-[#C8A45D] text-[#0B1914] hover:bg-[#DFBE78] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Return to Villa Aurelia
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="p-6 sm:p-10 space-y-8 max-h-[78vh] overflow-y-auto">
            {/* Step 1: Select Residence */}
            <div className="space-y-3">
              <label className="block text-xs tracking-[0.18em] text-[#C8A45D]">
                01. Select Private Residence
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUITE_OPTIONS.map((suite) => {
                  const active = suite.id === selectedSuiteId;
                  return (
                    <button
                      key={suite.id}
                      type="button"
                      onClick={() => setSelectedSuiteId(suite.id)}
                      className={`text-left p-4 transition-colors border cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-[#142C23] border-[#C8A45D]'
                          : 'bg-[#0E2019] border-[#C8A45D]/20 hover:border-[#C8A45D]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h3 className="font-display text-lg text-[#F7F3E8]">{suite.name}</h3>
                        </div>
                        <p className="text-xs text-[#C8A45D] mb-2">
                          {suite.size} · {suite.view}
                        </p>
                        <p className="text-xs text-[#F7F3E8]/70 leading-relaxed mb-4">
                          {suite.tagline}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-[#C8A45D]/20 flex items-baseline justify-between">
                        <span className="text-[11px] text-[#F7F3E8]/60">Nightly Tariff</span>
                        <span className="font-mono-tabular text-sm font-medium text-[#C8A45D]">
                          €{suite.nightlyRate.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dates & Party Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>Check-In Date</span>
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] font-mono-tabular focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>Check-Out Date</span>
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] font-mono-tabular focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span>Guests</span>
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] focus:outline-none focus:border-[#C8A45D]"
                >
                  <option value={1}>1 Adult · Solo Sanctuary</option>
                  <option value={2}>2 Adults · Private Couple</option>
                  <option value={3}>3 Guests · Suite & Salon</option>
                  <option value={4}>4 Guests · Family Pavilion</option>
                </select>
              </div>
            </div>

            {/* Step 3: Bespoke Estate Experiences */}
            <div className="space-y-3">
              <label className="block text-xs tracking-[0.18em] text-[#C8A45D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>02. Curated Estate Experiences (Optional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CURATED_EXPERIENCES.map((exp) => {
                  const checked = selectedExperiences.includes(exp.id);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => toggleExperience(exp.id)}
                      className={`text-left p-4 border transition-colors cursor-pointer flex flex-col justify-between ${
                        checked
                          ? 'bg-[#142C23] border-[#C8A45D]'
                          : 'bg-[#0E2019] border-[#C8A45D]/20 hover:border-[#C8A45D]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-display text-base text-[#F7F3E8]">{exp.title}</span>
                          <span
                            className={`w-4 h-4 shrink-0 border flex items-center justify-center mt-0.5 ${
                              checked ? 'bg-[#C8A45D] border-[#C8A45D] text-[#0B1914]' : 'border-[#C8A45D]/40'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#C8A45D] mb-2">{exp.duration}</p>
                        <p className="text-xs text-[#F7F3E8]/70 leading-relaxed mb-3">{exp.summary}</p>
                      </div>
                      <div className="pt-2 border-t border-[#C8A45D]/15 flex items-center justify-between">
                        <span className="text-[11px] text-[#F7F3E8]/55">Supplement</span>
                        <span className="font-mono-tabular text-xs font-medium text-[#C8A45D]">
                          +€{exp.price.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Guest Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5">Full Name & Title</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5">Private Email for Dossier</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#F7F3E8]/75 mb-1.5">
                  Arrival Logistics & Maggiordomo Preferences
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E2019] border border-[#C8A45D]/35 text-sm text-[#F7F3E8] focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
            </div>

            {/* Footer Total & Submit */}
            <div className="pt-6 border-t border-[#C8A45D]/25 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs text-[#F7F3E8]/65 flex items-center gap-3 font-mono-tabular">
                  <span>
                    {nights} {nights === 1 ? 'Night' : 'Nights'} × €{selectedSuite.nightlyRate.toLocaleString()}
                  </span>
                  {experiencesTotal > 0 && (
                    <>
                      <span>·</span>
                      <span>Experiences €{experiencesTotal.toLocaleString()}</span>
                    </>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs uppercase tracking-widest text-[#C8A45D]">Estimated Total</span>
                  <span className="font-mono-tabular text-2xl font-medium text-[#F7F3E8]">
                    €{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 text-xs font-medium text-[#F7F3E8]/80 hover:text-[#F7F3E8] border border-[#C8A45D]/30 hover:border-[#C8A45D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 text-xs font-semibold tracking-wider bg-[#C8A45D] text-[#0B1914] hover:bg-[#DFBE78] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Confirm Reservation
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
