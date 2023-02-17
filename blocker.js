// Your API access key -- update this to match your account, or override it with your API token! (see post for details)
// const X_FORM_KEY = "YOUR API TOKEN HERE";

/* ---- do not modify below this line! but feel free to take a look :-) ---- */

// Get your blog's URL from the page URL -- i.e., https://www.tumblr.com/blog/<YOUR URL>/followers
const href = window.location.href.split('/');
const yourURL = href[href.length - 2]; 

// Create a reuseable set of request headers we'll use later on
const headers = {
	"Accept": "*/*",
	"Accept-Language": "en-US,en;q=0.5",
	"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
	"X-tumblr-form-key": X_FORM_KEY,
	"X-Requested-With": "XMLHttpRequest",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "same-origin",
	"Sec-GPC": "1"
}

// Create a button that will instantly block all untitled blogs currently visible in the list
const blockAllBtn = document.createElement("button");
blockAllBtn.innerText = "Block suspicious accounts";
blockAllBtn.style = `
	color: red;
	border: 1px solid red;
	padding: 10px;
	border-radius: 5px;
	margin-left: 10px;
`

// The 'Block all suspicious blogs' feature is pretty glitchy, but useful if you wait to press it until after loading all the blogs you want blocked.
// Comment out this line to disable it.
document.querySelector('div.qF_aN').appendChild(blockAllBtn);

let _blockAllConfirmed = false;
blockAllBtn.addEventListener("click", async () => {
	if (_blockAllConfirmed || confirm("Warning: this feature is pretty glitchy! If something breaks, reload the page and paste the code again.")) {
		_blockAllConfirmed = true;

		/* Click every "Block and Report" button on the page */
		for (let i of document.getElementsByClassName("block-and-report")) {
			i.click();
		}
	}
});

// Helper function to parse query parameters from URL strings. Returns a JSON dict with the query parameters.
function getQuery(urlString) {
	let query = {};
	let href = urlString || window.location.href; // default to window url if none specified
		
	href.replace(/[?&](.+?)=([^&#]*)/g, function (_, key, value) {
		query[key] = decodeURI(value).replace(/\+/g, ' ');
	});

	return query;
}

// Constant reference to the blog container and report menu popup window
const glassContainer = document.getElementById("glass-container");
const blogContainer = document.querySelector("section.hwT33");

// Create a callback that will trigger every 2 seconds (hacky workaround instead of waiting for API requests or
// all blogs to load, useful for blogs with any large number of followers)
const interval = setInterval(() => {
	
	// Get a list of blogs currently visible on the page
	let blogs = document.getElementsByClassName("Ut4iZ eXQ6G veU9u");

	// Hide popup menu for duration of iterations
	glassContainer.style.display = "none";

	// Add instant block buttons to the side of blogs with bad vibes
	for (let i of blogs) {
		// Check if this blog has already been spamchecked
		if (i.dataset.spamChecked) {
			continue; // if it has, skip and move onto the next blog
		} else {
			// Indicate that this blog has now been checked
			i.dataset.spamChecked = true;
		}

		// Get URL and title of each blog on the list
		const url = i.querySelector("span.UulOO");
		const title = i.querySelector("div.fTJAC");

		// Check if the vibes are bad (aka, if the blog is 'Untitled' and you are not following them)
		let following = i.querySelector("div.xWjHY").firstChild.nodeName !== "BUTTON";
		let badVibes = (title.innerText === "Untitled") && (! following);

		// If the vibes are in fact rancid:
		if (badVibes) {
			// Change link color to red
			url.style.color = "red";
			title.style.color = "red";

			// Create a button on the side of the blog that will allow for quick blocking
			const btn = document.createElement("button");
			btn.innerText = "Block and Report";
			btn.style.border = "1px solid red";
			btn.style.color = "red";
			btn.style.padding = "5px";
			btn.style.borderRadius = "5px";
			btn.classList.add("block-and-report")

			// Remove the 'Follow' button on suspicious blogs
			const btnContainer = i.querySelector("div.xWjHY");
			const followBtn = btnContainer.querySelector("button");
			btnContainer.removeChild(followBtn);

			// Fetch the prefill URL key for report submission
			btnContainer.querySelector("span.BPf9u").querySelector("button.TRX6J").click(); // Click the hamburger menu to update the report prefill URL
			const prefill = document.querySelector("a.X1uIE.XLZRW.v_1X3").href;

			// Replace the "Follow" button with an instant block button
			btnContainer.prepend(btn);

			// Core block and reporting functionality (sending the request to Tumblr's servers)
			btn.addEventListener("click", async () => {
				console.log("Blocking & reporting", url.innerText);

				// Report spam
				await fetch("https://www.tumblr.com/svc/flag", {
					"credentials": "include",
					"headers": headers,
					"referrer": prefill,
					"body": `context=blog&source=&flag=spam&block=on&tumblelog_name=${url.innerText}`,
					"method": "POST",
					"mode": "cors"
				});

				// Block blog on this account
				await fetch("https://www.tumblr.com/svc/block/add", {
					"credentials": "include",
					"headers": headers,
					"referrer": prefill,
					"body": `tumblelog=${yourURL}&blocked_tumblelog=${url.innerText}`,
					"method": "POST",
					"mode": "cors"
				});

				// Remove element from page
				blogContainer.removeChild(i);
			});
		}

	}

	// After looping through all blogs, close the popup window and re-enable its visibility
	if (glassContainer.querySelector("div.iaJAj"))
		glassContainer.querySelector("div.iaJAj").lastChild.click();
	glassContainer.style.display = "unset";

}, 2000);

console.log("Tumblocker loaded");
