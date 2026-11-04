/* Beyond Brisbane 2027 — transparent, non-live ground budget model.
 * USD planning assumptions researched 2026-11-04. These are NOT 2027 quotes.
 * One party of six adults; three hotel rooms (two adults each) versus one
 * verified six-person / three-bedroom whole-home rental, where legal.
 * Nightly hotel benchmarks exclude an assumed 12% tax/fee allowance.
 * Rental nightly target includes recurring fees; one-time cleaning is extra.
 * Flights are NOT included here: live Google Flights prices come separately.
 */
(()=>{
'use strict';
const MEMBERS=6, HOTEL_ROOMS=3, HOTEL_FEES=1.12;
const EXTRAS={insurance:150,baggage:140,travelMeals:90,entryAustralia:25};
const COMMON=['brisbane','sydney'];
const ROUTES={
 fiji:['fiji'],
 queenstown:['queenstown','auckland'],
 bali:['bali','singapore'],
 cairns:['cairns'],
 japan:['tokyo','hakone','tokyoLast'],
 darwin:['darwin','singapore'],
 vietnam:['saigon','singapore'],
 melbourne:['melbourne','singapore']
};
// All nightly quotes in USD, for the ENTIRE hotel room or whole 3-bedroom rental.
// homeNight is a modeled shopping target, not a date-specific property quote.
// hotelNight is a room rate benchmark, not a booked group rate.
const STOPS={
 brisbane:{
  place:'Brisbane · convention hotel',dates:'Jun 27–Jul 6',nights:9,
  hotelNight:185,homeNight:null,homeFee:0,
  foodDaily:50,localDaily:14,activities:55,transfers:45,
  source:'https://www.budgetyourtrip.com/australia/brisbane/',
  note:'Convention hotel is a fixed stop. Three shared rooms are a placeholder until the actual delegate rate is known.',
  legal:'Hotel allocation retained; an alternative rental is not assumed.'
 },
 sydney:{
  place:'Sydney',dates:'Jul 6–10',nights:4,
  hotelNight:220,homeNight:435,homeFee:180,
  foodDaily:65,localDaily:20,activities:115,transfers:35,
  source:'https://www.budgetyourtrip.com/Australia/Sydney',
  note:'Compare a properly licensed three-bedroom apartment with three twin/double hotel rooms.',
  legal:'Only use legal short-stay rentals that explicitly sleep six adults.'
 },
 fiji:{
  place:'Nadi / Fiji',dates:'Jul 10–17',nights:7,
  hotelNight:205,homeNight:465,homeFee:170,
  foodDaily:61,localDaily:19,activities:235,transfers:75,
  source:'https://www.budgetyourtrip.com/fiji',
  note:'Three-bedroom villa/condo near Nadi is a modeled target; resort meal packages and transport can change the economics.',
  legal:'Check six-adult capacity, beach access and transport before treating a rental as interchangeable with a resort.'
 },
 queenstown:{
  place:'Queenstown',dates:'Jul 10–15',nights:5,
  hotelNight:260,homeNight:550,homeFee:175,
  foodDaily:56,localDaily:23,activities:275,transfers:45,
  source:'https://www.queenstownnz.co.nz/stories/post/queenstown-accommodation-faqs/',
  note:'July is ski season: allow higher winter accommodation prices than off-season averages.',
  legal:'Apartment requires three real bedrooms and six approved sleeping spaces.'
 },
 auckland:{
  place:'Auckland',dates:'Jul 15–17',nights:2,
  hotelNight:175,homeNight:530,homeFee:145,
  foodDaily:46,localDaily:20,activities:55,transfers:35,
  source:'https://www.budgetyourtrip.com/new-zealand/auckland',
  note:'For two nights, cleaning fees can outweigh savings from a whole-home booking.',
  legal:'Check total including one-time fees before booking a short apartment stay.'
 },
 bali:{
  place:'Bali / Ubud',dates:'Jul 10–15',nights:5,
  hotelNight:100,homeNight:250,homeFee:120,
  foodDaily:37,localDaily:18,activities:115,transfers:50,
  source:'https://balinsky.info/en/knowledge/bali-villa-rental-rates-by-area-2026',
  note:'An entire three-bedroom villa can be cost-effective for six; July is busy, so a conservative villa target is used.',
  legal:'Check whether the listing is licensed, has three real bedrooms, and includes taxes and service.'
 },
 singapore:{
  place:'Singapore',dates:'Jul 15–17',nights:2,
  hotelNight:205,homeNight:null,homeFee:0,
  foodDaily:48,localDaily:13,activities:65,transfers:35,
  source:'https://www.budgetyourtrip.com/Singapore',
  note:'Three shared hotel rooms are the practical compliant short-stay choice.',
  legal:'Singapore bans residential rentals under three months; serviced apartments normally require at least seven days. Use hotels for two nights.'
 },
 cairns:{
  place:'Cairns / Port Douglas',dates:'Jul 10–17',nights:7,
  hotelNight:160,homeNight:335,homeFee:145,
  foodDaily:51,localDaily:22,activities:375,transfers:65,
  source:'https://www.budgetyourtrip.com/australia/cairns',
  note:'Reef cruise and Daintree excursion are included in the activity allowance; these are not cheap free-day activities.',
  legal:'Compare licensed three-bedroom units that sleep six with three hotel rooms near tour pickup points.'
 },
 tokyo:{
  place:'Tokyo · first stay',dates:'Jul 10–14',nights:4,
  hotelNight:175,homeNight:425,homeFee:150,
  foodDaily:53,localDaily:22,activities:125,transfers:40,
  source:'https://www.budgetyourtrip.com/Japan/tokyo',
  note:'A legal six-adult apartment may beat three rooms over four nights.',
  legal:'For rentals, verify required lodging registration and advertised six-adult occupancy.'
 },
 hakone:{
  place:'Hakone',dates:'Jul 14–16',nights:2,
  hotelNight:245,homeNight:790,homeFee:145,
  foodDaily:65,localDaily:40,activities:110,transfers:85,
  source:'https://www.budgetyourtrip.com/Japan/tokyo',
  note:'Ryokan pricing is highly variable; budget three shared rooms and verify meal inclusions.',
  legal:'Two nights favor hotel/ryokan options once group-home cleaning fees are considered.'
 },
 tokyoLast:{
  place:'Tokyo · final night',dates:'Jul 16–17',nights:1,
  hotelNight:175,homeNight:425,homeFee:150,
  foodDaily:53,localDaily:22,activities:0,transfers:30,
  source:'https://www.budgetyourtrip.com/Japan/tokyo',
  note:'Short final stop: hotel rooms avoid a second vacation-rental cleaning charge.',
  legal:'Book convenient train access or airport connection.'
 },
 darwin:{
  place:'Darwin / Kakadu',dates:'Jul 10–15',nights:5,
  hotelNight:190,homeNight:425,homeFee:160,
  foodDaily:61,localDaily:25,activities:365,transfers:60,
  source:'https://www.budgetyourtrip.com/australia/darwin/',
  note:'Kakadu guided touring is in the activity allowance; a rental must offer practical tour pickups.',
  legal:'Check tour pickups and whether a two-day Kakadu tour includes an overnight stay before booking all five nights.'
 },
 saigon:{
  place:'Ho Chi Minh City',dates:'Jul 10–15',nights:5,
  hotelNight:80,homeNight:215,homeFee:110,
  foodDaily:29,localDaily:13,activities:90,transfers:40,
  source:'https://www.budgetyourtrip.com/Vietnam',
  note:'Prices favor inexpensive hotels or a serviced three-bedroom apartment; assumptions are based on Vietnam-wide and city budgets.',
  legal:'Check local permitted short-stay rules and that the unit genuinely accommodates six.'
 },
 melbourne:{
  place:'Melbourne / Great Ocean Road',dates:'Jul 10–15',nights:5,
  hotelNight:210,homeNight:405,homeFee:165,
  foodDaily:54,localDaily:25,activities:160,transfers:65,
  source:'https://www.budgetyourtrip.com/australia/melbourne',
  note:'A shared apartment is modeled for the five-night city base; a Great Ocean Road overnight would change lodging splits.',
  legal:'Choose an apartment suitable for six adult guests, with a reasonable city/road-trip pickup location.'
 }
};
const ENTRY={fiji:0,queenstown:70,bali:40,cairns:0,japan:0,darwin:0,vietnam:25,melbourne:0};
const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const rateKey='beyondbrisbane-convention-room-night';
let conventionHotel=185;
try{const val=localStorage.getItem(rateKey);if(val!==null){
 const n=Number(val);if(Number.isFinite(n)&&n>=0&&n<=2500)conventionHotel=n;
}}catch{}
function setConventionRate(n){
 n=Number(n);if(!Number.isFinite(n)||n<0||n>2500)return false;
 conventionHotel=n;try{localStorage.setItem(rateKey,String(n));}catch{}return true;
}
function lodging(id){
 const o=STOPS[id];if(!o)throw Error('Invalid stop '+id);
 const roomNight=id==='brisbane'?conventionHotel:o.hotelNight;
 const hotel=roomNight*HOTEL_ROOMS*o.nights*HOTEL_FEES;
 const home=o.homeNight===null?null:o.homeNight*o.nights+o.homeFee;
 // For marginal savings under 5%, favor hotels over cleaning and turnover risk.
 const mode=home!==null&&home<hotel*.95?'home':'hotel';
 const selected=mode==='home'?home:hotel;
 return {id,place:o.place,dates:o.dates,nights:o.nights,mode,selected,hotel,home,
  hotelNight:roomNight,homeNight:o.homeNight,homeFee:o.homeFee,
  perPerson:selected/MEMBERS,note:o.note,legal:o.legal,source:o.source,
  alternative:mode==='home'?hotel:home};
}
function forTrip(id){
 if(!Object.prototype.hasOwnProperty.call(ROUTES,id))return null;
 const stays=COMMON.concat(ROUTES[id]).map(lodging);
 const ids=COMMON.concat(ROUTES[id]);
 const lodgingSum=stays.reduce((sum,s)=>sum+s.perPerson,0);
 const food=ids.reduce((sum,s)=>sum+STOPS[s].foodDaily*STOPS[s].nights,0);
 const local=ids.reduce((sum,s)=>sum+STOPS[s].localDaily*STOPS[s].nights+STOPS[s].transfers,0);
 const activities=ids.reduce((sum,s)=>sum+STOPS[s].activities,0);
 const insurance=EXTRAS.insurance, baggage=EXTRAS.baggage,
  travelMeals=EXTRAS.travelMeals,entry=EXTRAS.entryAustralia+(ENTRY[id]||0);
 const contingency=Math.round((lodgingSum+food+local+activities)*.10);
 const nonAirfare=lodgingSum+food+local+activities+insurance+baggage+travelMeals+entry+contingency;
 return {id,stays,lodging:lodgingSum,food,local,activities,insurance,baggage,
  travelMeals,entry,contingency,nonAirfare,
  travelNights:stays.reduce((a,s)=>a+s.nights,0),
  assumptions:'Six adults, three hotel rooms (two per room) or one licensed six-guest three-bedroom rental, whichever has the lower modeled all-in cost.',
  sourceDate:'November 4, 2026'};
}
window.BeyondGroundBudget={
 MEMBERS,HOTEL_ROOMS,HOTEL_FEES,STOPS,ROUTES,ENTRY,forTrip,lodging,fmt,
 conventionRate:()=>conventionHotel,setConventionRate
};
})();