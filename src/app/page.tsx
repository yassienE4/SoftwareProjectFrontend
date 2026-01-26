
import { fetchHomeMessage } from '../lib/api';

export default async function Page() {
  // Fetch data on the server
  let data;
  try {
    data = await fetchHomeMessage();
  } catch (err) {
    console.error(err);
    data = { message: 'Failed to load message.' };
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p className="mt-4">{data.message}</p>
    </main>
  );
}
