const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Seance</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body, html {
            height: 100%;
            margin: 0;
            overflow: hidden;
        }
		.image-text {
			position: absolute;
			font-size: 16px;
			font-weight: bold;
			text-align: center;
			width: 90%;
			max-width: 300px;
			padding: 5px;
			background-color: rgba(255, 255, 255, 0.7);
		}
		.top { top: 10px; left: 50%; transform: translate(-50%, 0) rotate(180deg); }
		.bottom { bottom: 10px; left: 50%; transform: translateX(-50%); }
		.left { top: 50%; left: 10px; transform: translate(0, -50%) rotate(90deg); transform-origin: left center; }
		.right { top: 50%; right: 10px; transform: translate(0, -50%) rotate(-90deg); transform-origin: right center; }
        #mainImage {
            transition: opacity 0.5s ease-in-out;
        }
    </style>
</head>
<body class="bg-black flex flex-col">
    <div id="imageContainer" class="flex-grow flex items-center justify-center p-4">
        <div class="relative max-w-full max-h-full">
            <img id="mainImage" src="https://picsum.photos/seed/logo/1000" alt="Main Image" class="max-w-full max-h-[90vh] object-contain">
            <input id="topText" class="image-text top" placeholder="Top text">
            <input id="bottomText" class="image-text bottom" placeholder="Enter prompt here">
            <input id="leftText" class="image-text left" placeholder="Left text">
            <input id="rightText" class="image-text right" placeholder="Right text">
        </div>
    </div>

    <script>
        const mainImage = document.getElementById('mainImage');
        const bottomText = document.getElementById('bottomText');
        const textInputs = ['topText', 'bottomText', 'leftText', 'rightText'].map(id => document.getElementById(id));

        async function updateImage() {
            const prompt = bottomText.value.trim();

            if (!prompt) {
                return;
            }

            try {
                // Fade out the current image
                mainImage.style.opacity = '0';

                const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt }),
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                
                // Set the new image source and fade it in
                mainImage.onload = () => {
                    mainImage.style.opacity = '1';
                };
                mainImage.src = data.imageUrl;
            } catch (error) {
                console.error('Error updating image:', error);
                // Fade the image back in if there's an error
                mainImage.style.opacity = '1';
                // You might want to show an error message to the user here
            }
        }

        textInputs.forEach(input => {
            input.addEventListener('input', () => {
                textInputs.forEach(el => {
                    if (el !== input) {
                        el.value = input.value;
                    }
                });
            });
        });

        bottomText.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                updateImage();
            }
        });

        // Initial update
        updateImage();

        // Update on window resize to maintain aspect ratio
        window.addEventListener('resize', () => {
            const size = Math.min(window.innerWidth, window.innerHeight);
            mainImage.style.width = size + 'px';
            mainImage.style.height = size + 'px';
        });
    </script>
</body>
</html>
`;

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
		return new Response(HTML, {
			headers: { 'Content-Type': 'text/html' }
		});
	},
};