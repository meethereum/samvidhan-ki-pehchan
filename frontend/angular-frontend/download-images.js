const fs = require('fs');
const https = require('https');
const path = require('path');

const images = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Constituent_Assembly_of_India.jpg/400px-Constituent_Assembly_of_India.jpg', filename: 'event1.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Jawaharlal_Nehru.jpg/300px-Jawaharlal_Nehru.jpg', filename: 'event2.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Dr._Babasaheb_Ambedkar.jpg/300px-Dr._Babasaheb_Ambedkar.jpg', filename: 'event3.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Constitution_of_India_Preamble.jpg/400px-Constitution_of_India_Preamble.jpg', filename: 'event4.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Constitution_of_India.jpg/300px-Constitution_of_India.jpg', filename: 'event5.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/India_republic_day_parade_2004.jpg/400px-India_republic_day_parade_2004.jpg', filename: 'event6.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Sarojini_Naidu.jpg', filename: 'w1.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Hansa_Jivraj_Mehta.jpg', filename: 'w2.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Durgabai_deshmukh.jpg', filename: 'w3.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Ammu_Swaminathan.jpg', filename: 'w4.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Dakshayani_Velayudhan.jpg', filename: 'w5.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Rajkumari_Amrit_Kaur.jpg', filename: 'w6.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/g/g8/Sucheta_Kripalani_%28cropped%29.jpg', filename: 'w7.jpg' }, // fixed URL guess? the previous one had %28 %29 wait, I will use fetch to see what happens.
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Vijaya_Lakshmi_Pandit.jpg', filename: 'w8.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Begum_Qudsia_Aizaz_Rasul.jpg', filename: 'w9.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Purnima_Banerjee.jpg', filename: 'w10.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Annie_Mascarene.jpg', filename: 'w11.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Constituent_Assembly_of_India.jpg', filename: 'w12.jpg' }, // fallback group
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Constituent_Assembly_of_India.jpg', filename: 'w13.jpg' }, // fallback group
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Malati_Chaudhuri.jpg', filename: 'w14.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Renuka_Ray.jpg', filename: 'w15.jpg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Sardar_Patel.jpg/300px-Sardar_Patel.jpg', filename: 'arch_patel.jpg'},
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Rajendra_prasad.jpg/300px-Rajendra_prasad.jpg', filename: 'arch_prasad.jpg'}
];

const downloadDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function download(url, filename) {
  return new Promise((resolve, reject) => {
    // some wikimedia URLs might be slightly wrong (like w7), we'll try catching error.
    let targetUrl = url;
    if (filename === 'w7.jpg') targetUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/28/Sucheta_Kripalani_%28cropped%29.jpg';

    https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SamvidhanKiPehchan/1.0' } }, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Failed to download ${targetUrl}: ${res.statusCode}`);
        return resolve(false);
      }
      const file = fs.createWriteStream(path.join(downloadDir, filename));
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      console.error(`Error downloading ${targetUrl}: ${err.message}`);
      resolve(false);
    });
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  for (const img of images) {
    console.log(`Downloading ${img.filename}...`);
    await download(img.url, img.filename);
    await delay(1000);
  }
  console.log('Done.');
}

run();
