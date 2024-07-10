import index from "./index.html";
import Replicate from "replicate";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === '/api/generate-image' && request.method === 'POST') {
			try {
				const replicate = new Replicate({
					auth: env.REPLICATE_API_TOKEN
				});

				const { prompt, seed } = await request.json();

				const input = {
					cfg: 4.5,
					seed,
					prompt,
					aspect_ratio: "1:1",
					output_format: "webp",
					output_quality: 79,
					negative_prompt: ""
				};

				const output = await replicate.run("stability-ai/stable-diffusion-3", { input });

				let imageUrl = output[0];

				// // Simulate image generation based on prompt (replace with actual image generation logic)
				// await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
				// const size = 1024; // Random size between 500 and 999
				// const imageUrl = `https://picsum.photos/${size}?random=${encodeURIComponent(prompt)}`;

				return new Response(JSON.stringify({ imageUrl }), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.log(error)
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