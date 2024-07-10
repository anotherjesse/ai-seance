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

				const { prompt, seed, event, secret } = await request.json();

				if (secret !== env.SECRET) {
					return new Response(JSON.stringify({ error: 'Invalid secret' }), {
						status: 401,
						headers: { 'Content-Type': 'application/json' }
					});
				}

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

				await env.DB.prepare(
					"INSERT INTO Runs (Event, Prompt, URL, Seed) VALUES (?, ?, ?, ?)"
				)
					.bind(event || "unknown", prompt, imageUrl, seed)
					.all();

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

		if (url.pathname == '/log') {
			const { results } = await env.DB.prepare(
				"SELECT * FROM Runs"
			).all();
			return Response.json(results);
		}

		// Serve the HTML for any other request
		return new Response(index, {
			headers: { 'Content-Type': 'text/html' }
		});
	},
};