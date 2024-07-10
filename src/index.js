import index from "./index.html";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === '/api/generate-image' && request.method === 'POST') {
			try {
				const { prompt } = await request.json();

				// Simulate image generation based on prompt (replace with actual image generation logic)
				await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
				const size = 1024; // Random size between 500 and 999
				const imageUrl = `https://picsum.photos/${size}?random=${encodeURIComponent(prompt)}`;

				return new Response(JSON.stringify({ imageUrl }), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				return new Response(JSON.stringify({ error: 'Invalid request' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// Serve the HTML for any other request
		return new Response(index, {
			headers: { 'Content-Type': 'text/html' }
		});
	},
};