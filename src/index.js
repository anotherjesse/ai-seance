import index from "./index.html";
import Replicate from "replicate";
import * as fal from "@fal-ai/serverless-client";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === '/api/generate-image' && request.method === 'POST') {
			try {

				const replicate = new Replicate({
					auth: env.REPLICATE_API_TOKEN
				});

				fal.config({
					credentials: env.FAL_KEY


				});


				const sd3 = ({ seed, prompt }) =>
					replicate.run("stability-ai/stable-diffusion-3", {
						input: {
							cfg: 4.5,
							seed,
							prompt,
							aspect_ratio: "1:1",
							output_format: "webp",
							output_quality: 79,
							negative_prompt: ""
						}
					}).then(output => output[0]);

				const sdxl_replicate = ({ seed, prompt }) => replicate.run(
					"stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
					{
						input: {
							width: 1024,
							height: 1024,
							prompt,
							seed,
							scheduler: "K_EULER",
							num_outputs: 1,
							guidance_scale: 7.5,
							apply_watermark: false,
							negative_prompt: "",
							prompt_strength: 0.8,
							num_inference_steps: 25,
							disable_safety_checker: true
						}
					}
				);

				const sdxl_fal = ({ seed, prompt }) =>
					fal.subscribe("fal-ai/fast-sdxl", {
						input: {
							prompt, seed, enable_safety_checker: false, image_size: "square_hd",

						},
						logs: false,
					}).then(result => result.images[0].url);

				const { prompt, seed, event, secret, model } = await request.json();

				if (secret !== env.SECRET) {
					return new Response(JSON.stringify({ error: 'Invalid secret' }), {
						status: 401,
						headers: { 'Content-Type': 'application/json' }
					});
				}

				const imageUrl = await (model === 'sdxl' ? sdxl_fal({ seed, prompt }) : sd3({ seed, prompt }));

				let key = new URL(imageUrl).pathname.slice(1);
				let ourURL = `${env.ASSETS_URL}/${key}`

				await fetch(imageUrl).then(request => env.ASSETS.put(key, request.body))


				await env.DB.prepare(
					"INSERT INTO Runs (Event, Prompt, URL, Seed) VALUES (?, ?, ?, ?)"
				)
					.bind(event || "unknown", prompt, ourURL, seed)
					.all();

				return new Response(JSON.stringify({ imageUrl: ourURL }), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.log({ error })
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