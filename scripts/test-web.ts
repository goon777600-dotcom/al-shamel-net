import axios from 'axios';

async function testWeb() {
  try {
    const res = await axios.get('https://shaml.wifimanage.co', { timeout: 7000 });
    console.log('TITLE:', res.data.match(/<title>(.*?)<\/title>/)?.[1]);
    const bodyText = res.data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500);
    console.log('TEXT:', bodyText);
  } catch (err: any) {
    console.error('HTTP ERR:', err.message);
  }
}

testWeb();
