import axios from 'axios';

export const reFetch = async (sessionToken: string) => {
  const sleep = (ms = 1000) => new Promise(r => setTimeout(r, ms));
  await sleep(1000);
  const res = await axios.get('https://offline-pay.vercel.app/api/data', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  return res.data;
};
