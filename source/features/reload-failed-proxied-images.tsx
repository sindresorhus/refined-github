import features from '../libs/features';
import select from 'select-dom';

// This feature tries to fix the problem with the borken badges on github
// You can read more on a related issue here https://github.com/badges/shields/issues/1568

// Reload Constants
const ReloadTryInterval = 1000;
const ReloadMaxTries = 4;

// Check if image is from the github's proxy
function isGithubProxiedImg(image: HTMLImageElement): boolean {
	return (/^https:\/\/camo\.githubusercontent\.com\/.*/).test(image.src);
}

// Test if image loads correcty, and reload it if there is an error
function test(image: HTMLImageElement): void {
	// Check if image is on DOM
	if (!document.contains(image)) return;

	// Debug/Proof-of-work message
	//console.log('Testing proxied image', image.src, image.dataset.canonicalSrc, 'try ' + (image.dataset.brokenProxiedImage || '0'));

	// Set up an image object
	// to check if image loads with no problems
	let tester = new Image();

	// Handle successful loading
	tester.onload = () => {
		// If image don't have correct dimentions
		if (image.naturalHeight == 0 && image.naturalWidth == 0) {
			// Tested loaded the image so now the visual broken image can be updated
			// Update image
			image.src = image.src;
		}
	};

	// Handle failure of loading the image
	// (maybe, the original image source failed to provide the image to the proxy in the 4 seconds timeframe)
	tester.onerror = () => {
		let tries = parseInt(image.dataset.brokenProxiedImage || '0', 10);

		// Flag image (to limit max tries)
		if (tries == 0) image.dataset.brokenProxiedImage = '1';
		else if (tries > ReloadMaxTries) {
			// Here we could also try to directly load the image from the `image.dataset.canonicalSrc`
			// but this will expose the user to the server that hosts the image
			return;
		}
		else image.dataset.brokenProxiedImage = String(++tries);

		// Try again later
		setTimeout(() => {
			test(image);
		}, ReloadTryInterval);
	};

	// Start testing
	tester.src = image.src;
}

async function init(): Promise<false | void> {
	// Get each image on the page
	select.all('img').forEach(function (image) {
		// If it is a proxied image
		if (isGithubProxiedImg(image)) test(image);
	}); 
}

features.add({
	id: __featureName__,
	description: 'Auto reload failed github proxied images',
	screenshot : false,
	load: features.onAjaxedPages,
	init
});
