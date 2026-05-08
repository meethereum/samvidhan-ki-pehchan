const https = require('https');

const queries = [
  'Constituent_Assembly_of_India',
  'Objectives_Resolution',
  'Drafting_Committee_of_the_Constituent_Assembly',
  'Constitution_of_India',
  'Republic_Day_(India)',
  'B._R._Ambedkar',
  'Jawaharlal_Nehru',
  'Vallabhbhai_Patel',
  'Rajendra_Prasad',
  'Sarojini_Naidu',
  'Hansa_Jivraj_Mehta',
  'Durgabai_Deshmukh',
  'Ammu_Swaminathan',
  'Dakshayani_Velayudhan',
  'Amrit_Kaur',
  'Sucheta_Kripalani',
  'Vijaya_Lakshmi_Pandit',
  'Begum_Aizaz_Rasul',
  'Purnima_Banerjee',
  'Annie_Mascarene',
  'Leela_Roy',
  'Malati_Choudhury',
  'Renuka_Ray',
  'Kamala_Chaudhry'
];

async function run() {
  for (const q of queries) {
    await new Promise(resolve => {
      https.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${q}`, { headers: { 'User-Agent': 'SamvidhanApp/1.0' } }, res => {
        let data = '';
        res.on('data', d => data+=d);
        res.on('end', () => {
          try {
             const json = JSON.parse(data);
             if (json.thumbnail) {
               console.log(`${q}: ${json.thumbnail.source}`);
             } else {
               console.log(`${q}: -- NO IMAGE --`);
             }
          } catch(e) { console.log(`${q}: err`); }
          resolve();
        });
      });
    });
  }
}
run();
