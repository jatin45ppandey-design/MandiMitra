export type Language = 'hi' | 'en'

export const copy = {
  hi: {
    tagline: 'सही भाव, बेहतर फैसला',
    headline: 'अपनी फसल का सही मंडी भाव जानें',
    subheading: 'भरोसेमंद दरें, स्पष्ट तारीख और मंडियों की आसान तुलना।',
    crop: 'फसल',
    district: 'जिला',
    chooseCrop: 'फसल चुनें',
    chooseDistrict: 'जिला चुनें',
    price: 'आखिरी रिपोर्ट किया गया भाव',
    emptyPrice: 'अभी मंडी का भाव उपलब्ध नहीं है',
    dataMissing: 'असली सरकारी डेटा जुड़ने के बाद दर दिखाई जाएगी।',
    trend: 'हाल के दिनों का भाव',
    trendEmpty: 'इतिहास के सत्यापित रिकॉर्ड उपलब्ध नहीं हैं।',
    comparison: 'मंडियों की तुलना',
    compareEmpty: 'फसल और जिला चुनने पर तुलना दिखाई जाएगी।',
    transport: 'भाड़ा घटाकर कमाई',
    transportEmpty: 'दरें उपलब्ध होने के बाद अनुमानित कमाई देखें।',
    notice: 'रिपोर्ट किया गया मंडी भाव बिक्री की गारंटी नहीं है।',
    demo: 'प्रोटोटाइप का शुरुआती संस्करण',
    source: 'स्रोत: AGMARKNET · रिपोर्ट की तारीख हमेशा जांचें',
    apiConnected: 'API जुड़ा है',
    apiOffline: 'API उपलब्ध नहीं · स्थानीय डेटा इस्तेमाल करें',
    apiChecking: 'API जांच रहे हैं'
  },
  en: {
    tagline: 'Know the rate. Make a better choice.',
    headline: 'Check the right mandi price for your crop',
    subheading: 'Reported prices, clear dates and simple market comparisons.',
    crop: 'Commodity',
    district: 'District',
    chooseCrop: 'Choose commodity',
    chooseDistrict: 'Choose district',
    price: 'Latest reported mandi rate',
    emptyPrice: 'No mandi rate is available yet',
    dataMissing: 'Verified government records will appear here after import.',
    trend: 'Recent reported trend',
    trendEmpty: 'No verified historical observations available.',
    comparison: 'Compare markets',
    compareEmpty: 'Comparison appears after selecting a crop and district.',
    transport: 'Earnings after transport',
    transportEmpty: 'Compare estimated net earnings once rates are available.',
    notice: 'A reported mandi rate is not a guaranteed selling price.',
    demo: 'Early prototype',
    source: 'Source: AGMARKNET · Always check reporting dates',
    apiConnected: 'API connected',
    apiOffline: 'API unavailable · use local records',
    apiChecking: 'Checking API'
  }
} as const

