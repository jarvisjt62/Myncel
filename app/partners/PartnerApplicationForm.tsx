'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const partnershipTypes = ['Referral Partner', 'Reseller Partner', 'Technology Partner'];

const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'American Samoa',
  'Andorra',
  'Angola',
  'Anguilla',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bermuda',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'British Virgin Islands',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cayman Islands',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Cook Islands',
  'Costa Rica',
  'Côte d’Ivoire',
  'Croatia',
  'Cuba',
  'Curaçao',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Falkland Islands',
  'Faroe Islands',
  'Fiji',
  'Finland',
  'France',
  'French Guiana',
  'French Polynesia',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Gibraltar',
  'Greece',
  'Greenland',
  'Grenada',
  'Guadeloupe',
  'Guam',
  'Guatemala',
  'Guernsey',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Isle of Man',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jersey',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Macau',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Martinique',
  'Mauritania',
  'Mauritius',
  'Mayotte',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Montserrat',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Caledonia',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'Niue',
  'North Korea',
  'North Macedonia',
  'Northern Mariana Islands',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Réunion',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Barthélemy',
  'Saint Helena',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Martin',
  'Saint Pierre and Miquelon',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'São Tomé and Príncipe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Sint Maarten',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tokelau',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Turks and Caicos Islands',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'U.S. Virgin Islands',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Wallis and Futuna',
  'Western Sahara',
  'Yemen',
  'Zambia',
  'Zimbabwe',
  'Other / Not listed',
];

const initialForm = {
  name: '',
  email: '',
  company: '',
  country: '',
  partnerType: '',
  message: '',
};

export default function PartnerApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    if (window.grecaptcha) {
      setCaptchaLoaded(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setCaptchaLoaded(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setCaptchaLoaded(true);
    document.head.appendChild(script);
  }, []);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const executeCaptcha = async () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !captchaLoaded || !window.grecaptcha) return '';

    return window.grecaptcha.execute(siteKey, { action: 'partner_application' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const captchaToken = await executeCaptcha();

      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit partner application');
        return;
      }

      setSent(true);
      setForm(initialForm);
    } catch (submitError) {
      console.error('Partner application submit error:', submitError);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#0a2540] mb-3">Partner application submitted</h3>
        <p className="text-[#425466] mb-6">
          Thanks for applying to the Myncel partner program. Our partner team will review your application and respond within 2 business days.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[#635bff] font-semibold hover:underline"
        >
          Submit another application →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#e6ebf1] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="partner-name" className="block text-sm font-medium text-[#0a2540] mb-2">Full name *</label>
            <input
              id="partner-name"
              type="text"
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Your full name"
              className="w-full border border-[#e6ebf1] rounded-xl px-4 py-3 text-[#0a2540] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="partner-email" className="block text-sm font-medium text-[#0a2540] mb-2">Business email *</label>
            <input
              id="partner-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@yourcompany.com"
              className="w-full border border-[#e6ebf1] rounded-xl px-4 py-3 text-[#0a2540] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="partner-company" className="block text-sm font-medium text-[#0a2540] mb-2">Company name *</label>
            <input
              id="partner-company"
              type="text"
              required
              value={form.company}
              onChange={(event) => updateField('company', event.target.value)}
              placeholder="Your company name"
              className="w-full border border-[#e6ebf1] rounded-xl px-4 py-3 text-[#0a2540] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="partner-country" className="block text-sm font-medium text-[#0a2540] mb-2">Country *</label>
            <select
              id="partner-country"
              required
              value={form.country}
              onChange={(event) => updateField('country', event.target.value)}
              className="w-full border border-[#e6ebf1] rounded-xl px-4 py-3 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent bg-white"
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-[#0a2540] mb-2">Partnership type *</legend>
          <div className="grid sm:grid-cols-3 gap-4">
            {partnershipTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 border border-[#e6ebf1] rounded-xl p-4 cursor-pointer hover:border-[#635bff] transition-colors">
                <input
                  type="radio"
                  name="partnerType"
                  value={type}
                  required
                  checked={form.partnerType === type}
                  onChange={(event) => updateField('partnerType', event.target.value)}
                  className="text-[#635bff]"
                />
                <span className="text-sm font-medium text-[#0a2540]">{type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="partner-message" className="block text-sm font-medium text-[#0a2540] mb-2">Tell us about your business and clients</label>
          <textarea
            id="partner-message"
            rows={4}
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            placeholder="Briefly describe what your business does, who your clients are, and how you see Myncel fitting into your offering..."
            className="w-full border border-[#e6ebf1] rounded-xl px-4 py-3 text-[#0a2540] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent resize-none"
          />
        </div>

        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <p className="text-xs text-[#8898aa]">
            This form is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#635bff] text-white font-semibold px-6 py-4 rounded-xl hover:bg-[#5a52e8] transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : 'Submit partner application →'}
        </button>

        <p className="text-center text-[#425466] text-sm">We respond to all partner applications within 2 business days.</p>
      </div>
    </form>
  );
}