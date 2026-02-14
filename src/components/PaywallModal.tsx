
import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Icons from './Icon';
import { getTexts } from '../constants';
import { Language } from '../types';

// Lazy-load Stripe only when needed to prevent the floating badge from overlapping mobile UI
let stripePromiseCache: ReturnType<typeof loadStripe> | null = null;
const getStripePromise = () => {
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromiseCache;
};

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number, isSub: boolean) => void;
  onStartTrial?: () => void;
  reason: string;
  language?: Language;
  userId?: string;
}

type ProductKey = 'vip' | 'starter' | 'popular' | 'intense' | 'elite';

interface CheckoutFormProps {
  productKey: ProductKey;
  onSuccess: (credits: number, isSub: boolean) => void;
  onBack: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ productKey, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const isSub = productKey === 'vip';
  const creditsMap: Record<ProductKey, number> = { vip: 400, starter: 80, popular: 250, intense: 600, elite: 1500 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Validatiefout');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Betaling mislukt');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        setTimeout(() => {
          onSuccess(creditsMap[productKey], isSub);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis');
    } finally {
      if (!succeeded) setIsProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
          <Icons.Check className="text-emerald-400" size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Betaling Geslaagd!</h2>
        <p className="text-zinc-400 text-sm">+{creditsMap[productKey]} credits worden toegevoegd...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
          <Icons.ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Betaling Afronden</h2>
          <p className="text-xs text-zinc-500">{isSub ? 'VIP Membership · €17,99/mnd' : `${creditsMap[productKey]} credits`}</p>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 -mr-1 pb-4">
          <PaymentElement
            options={{
              layout: 'accordion',
            }}
          />
        </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="mt-6 w-full py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Verwerken...
          </span>
        ) : 'Betaal Nu'}
      </button>

      <p className="text-[9px] text-zinc-600 text-center mt-3 uppercase font-bold tracking-wider">
        Veilig verwerkt door Stripe · Discreet
      </p>
    </form>
  );
};

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onPurchase, onStartTrial, reason, language = 'nl', userId }) => {
  const t = getTexts(language as string).paywall;
  const [selectedProduct, setSelectedProduct] = useState<ProductKey | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setClientSecret(null);
    }
  }, [isOpen]);

  const handleSelectProduct = useCallback(async (productKey: ProductKey) => {
    setSelectedProduct(productKey);
    setIsLoadingIntent(true);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productKey, userId: userId || 'local_user' }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Failed to create payment intent:', err);
      setSelectedProduct(null);
    } finally {
      setIsLoadingIntent(false);
    }
  }, []);

  const handlePaymentSuccess = useCallback((credits: number, isSub: boolean) => {
    onPurchase(credits, isSub);
  }, [onPurchase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
        <div className="relative w-full max-w-5xl bg-[#0b0b0c] border border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row max-h-[90vh] md:h-auto overflow-y-auto no-scrollbar pb-safe">
          
          <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-zinc-500 hover:text-white transition-colors bg-black/50 rounded-full touch-manipulation sticky">
              <Icons.X size={20} />
          </button>

        {selectedProduct && clientSecret ? (
          <div className="w-full p-6 pb-10 md:p-10">
              <Elements
                stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#f5c542',
                    colorBackground: '#151518',
                    colorText: '#ffffff',
                    colorDanger: '#ef4444',
                    fontFamily: 'inherit',
                    borderRadius: '12px',
                    spacingUnit: '4px',
                  },
                  rules: {
                    '.Input': { backgroundColor: '#1a1a1f', border: '1px solid #333', color: '#fff' },
                    '.Input:focus': { border: '1px solid #f5c542', boxShadow: '0 0 0 1px #f5c542' },
                    '.Label': { color: '#a1a1aa' },
                    '.Tab': { backgroundColor: '#1a1a1f', border: '1px solid #333', color: '#a1a1aa' },
                    '.Tab--selected': { backgroundColor: '#f5c542', border: '1px solid #f5c542', color: '#000' },
                  },
                },
                locale: 'nl',
              }}
            >
              <CheckoutForm
                productKey={selectedProduct}
                onSuccess={handlePaymentSuccess}
                onBack={() => { setSelectedProduct(null); setClientSecret(null); }}
              />
            </Elements>
          </div>
        ) : selectedProduct && isLoadingIntent ? (
          <div className="w-full p-8 md:p-10 flex flex-col items-center justify-center min-h-[300px]">
            <svg className="animate-spin h-8 w-8 text-gold-500 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <p className="text-zinc-400 text-sm">Betaling voorbereiden...</p>
          </div>
        ) : (
          <>
            {/* LEFT SIDE: Context & VIP */}
            <div className="w-full md:w-[45%] bg-[#151518] p-8 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 relative overflow-hidden shrink-0">
               <div className="absolute inset-0 z-0 opacity-20">
                   <img src="https://storage.googleapis.com/foto1982/claudia.jpg" className="w-full h-full object-cover grayscale" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-[#151518]/80 to-transparent" />
               </div>

               <div className="relative z-10">
                   <div className="inline-block px-3 py-1 rounded-full bg-gold-500 text-black text-[10px] font-black uppercase tracking-widest mb-6">Premium Toegang</div>
                   <h1 className="text-3xl md:text-4xl font-headline font-black text-white mb-4 leading-[1.1]">Ga dieper in je <span className="text-gold-500 text-shine">fantasie</span></h1>
                   <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                     "{reason || "Toegang tot exclusieve interactie, roleplay en digitale beleving. Discreet en veilig."}"
                   </p>

                   <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3 text-sm text-zinc-300"><Icons.Check className="text-gold-500 shrink-0" size={16} /> <span className="font-medium">Onbeperkt chatten & roleplay</span></li>
                      <li className="flex items-center gap-3 text-sm text-zinc-300"><Icons.Check className="text-gold-500 shrink-0" size={16} /> <span className="font-medium">Exclusieve premium interacties</span></li>
                      <li className="flex items-center gap-3 text-sm text-zinc-300"><Icons.Check className="text-gold-500 shrink-0" size={16} /> <span className="font-medium">Real-time Live Video Calls</span></li>
                      <li className="flex items-center gap-3 text-sm text-zinc-300"><Icons.Check className="text-gold-500 shrink-0" size={16} /> <span className="font-medium">Elk moment opzegbaar</span></li>
                   </ul>

                    {/* VIP CARD */}
                     <div className="mt-auto bg-black/40 border-2 border-gold-500 rounded-2xl p-6 relative overflow-hidden group hover:bg-black/60 transition-colors">
                         <div className="absolute top-0 right-0 bg-gold-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">{t.most_popular}</div>
                         <h2 className="text-xl font-bold text-white mb-1">{t.vip_sub}</h2>
                         <div className="flex items-baseline gap-2 mb-2">
                             <span className="text-3xl font-black text-white">€17,99</span>
                             <span className="text-sm text-zinc-500">{t.per_month}</span>
                         </div>
                         <p className="text-xs text-zinc-400 mb-4">{t.vip_desc}</p>
                         
                         {onStartTrial && (
                           <button 
                             onClick={() => { onStartTrial(); onClose(); }}
                             className="relative z-20 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] touch-manipulation mb-3"
                           >
                             {t.start_trial}
                           </button>
                         )}
                         
                         <button onClick={() => handleSelectProduct('vip')} className="relative z-20 w-full py-4 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)] touch-manipulation">
                             {t.vip_sub} · €17,99{t.per_month}
                         </button>
                         <p className="text-[9px] text-zinc-600 text-center mt-3 uppercase font-bold tracking-wider">Geen verplichtingen · Discreet</p>
                     </div>
               </div>
            </div>

            {/* RIGHT SIDE: Credits */}
            <div className="flex-1 p-8 md:p-10 bg-[#0b0b0c] flex flex-col">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">Meer intensiteit, meer controle</h2>
                    <p className="text-zinc-500 text-sm">Credits gebruik je voor premium interacties, image generation en exclusieve content.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => handleSelectProduct('starter')} className="bg-[#151518] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all active:scale-95 group touch-manipulation">
                        <h3 className="text-white font-bold mb-1 group-hover:text-gold-500 transition-colors">Starter</h3>
                        <div className="text-2xl font-black text-white mb-1">80 <span className="text-sm font-normal text-zinc-500">credits</span></div>
                        <p className="text-xs text-zinc-500 mb-4">€4,99 · Perfect om te beginnen</p>
                        <div className="w-full py-2 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest text-center rounded-lg group-hover:bg-zinc-700">Kies Starter</div>
                    </button>

                    <button onClick={() => handleSelectProduct('popular')} className="bg-[#151518] border border-gold-500/50 rounded-2xl p-5 text-left relative transition-all active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.5)] group touch-manipulation">
                        <div className="absolute top-0 right-0 bg-gold-500/20 text-gold-500 text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest">Populair</div>
                        <h3 className="text-white font-bold mb-1 group-hover:text-gold-500 transition-colors">Popular</h3>
                        <div className="text-2xl font-black text-white mb-1">250 <span className="text-sm font-normal text-zinc-500">credits</span></div>
                        <p className="text-xs text-zinc-500 mb-4">€9,99 · Beste balans</p>
                        <div className="w-full py-2 bg-gold-500 text-black text-[10px] font-black uppercase tracking-widest text-center rounded-lg hover:bg-gold-400">Meest Gekozen</div>
                    </button>

                    <button onClick={() => handleSelectProduct('intense')} className="bg-[#151518] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all active:scale-95 group touch-manipulation">
                        <h3 className="text-white font-bold mb-1 group-hover:text-gold-500 transition-colors">Intense</h3>
                        <div className="text-2xl font-black text-white mb-1">600 <span className="text-sm font-normal text-zinc-500">credits</span></div>
                        <p className="text-xs text-zinc-500 mb-4">€19,99 · Voor langere sessies</p>
                        <div className="w-full py-2 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest text-center rounded-lg group-hover:bg-zinc-700">Ga Dieper</div>
                    </button>

                    <button onClick={() => handleSelectProduct('elite')} className="bg-[#151518] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all active:scale-95 group touch-manipulation">
                        <h3 className="text-white font-bold mb-1 group-hover:text-gold-500 transition-colors">Elite</h3>
                        <div className="text-2xl font-black text-white mb-1">1.500 <span className="text-sm font-normal text-zinc-500">credits</span></div>
                        <p className="text-xs text-zinc-500 mb-4">€39,99 · Maximale vrijheid</p>
                        <div className="w-full py-2 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest text-center rounded-lg group-hover:bg-zinc-700">Unlock Elite</div>
                    </button>
                </div>

                <div className="mt-auto pt-8 text-center">
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                        Discreet gefactureerd · Digitale service · 18+ Only<br/>
                        <span className="opacity-50 font-normal normal-case">Door verder te gaan ga je akkoord met onze voorwaarden.</span>
                    </p>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaywallModal;
