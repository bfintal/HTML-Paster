class HTMLSanitizer {
	constructor(options = {}) {
		this.settings = {
			forcePlainText: false,
			allowOnly: [],
			cleanPastedHTML: true,
			cleanEmptyTags: false,
			allowedEmptyTags: ['br','hr'],
			cleanEdgeBrs: true,
        	cleanReplacements: [
				[new RegExp(/<b>/gi), '<strong>'],
				[new RegExp(/<b\s[^>]*>/gi), '<strong>'],
				[new RegExp(/<\/b>/gi), '</strong>'],
				[new RegExp(/<i>/gi), '<em>'],
				[new RegExp(/<i\s[^>]*>/gi), '<em>'],
				[new RegExp(/<\/i>/gi), '</em>'],
				[new RegExp(/<div/gi), '<p'],
				[new RegExp(/<\/div>/gi), '</p>'],
			],
        	cleanAttrs: ['class', 'style', 'id', 'dir', 'draggable'],
        	cleanTags: ['meta', 'script', 'style', 'iframe'],
			unwrapTags: [],
			...options
		}
	}

	_unwrapElement(element) {
		const frag = document.createDocumentFragment();
		while (element.firstChild) {
			const child = element.removeChild(element.firstChild)
			child.nodeValue = child.nodeValue
			frag.appendChild(child);
		}
		element.parentNode.replaceChild(frag, element)
	}

	sanitize(html) {

		const { cleanPastedHTML } = this.settings

		// Remove comments. Copies from Word or IE can have comments in them.
		html = html.replace( /<!--[\s\S]*?-->/gi, '' )

		// Plain text, convert < & > into entities un-HTML.
		const { forcePlainText } = this.settings
		if ( forcePlainText ) {
			html = html.replace( /(<|>)/gm, (c) => "&#" + c.charCodeAt(0) + ";" );
		}

		// Replace regex rules.
		if ( cleanPastedHTML ) {
			const { cleanReplacements } = this.settings
			for ( var i = 0; i < cleanReplacements.length; i++ ) {
				const [ regex, value ] = cleanReplacements[i]
				if ( html.match( regex ) ) {
					html = html.replace( regex, value )
				}
			}
		}

		// Dummy div that will hold our content.
		const dummy = document.createElement('DIV')
		dummy.innerHTML = html

		// Sometimes, pasting can produce <span>&nbsp;</span>, replace
		// those with an empty space.
		const spans = dummy.querySelectorAll('span')
		Array.prototype.forEach.call( spans, (el) => {
			if ( el.textContent === '\xa0' ) {
				el.parentNode.replaceChild(document.createTextNode(' '), el);
			} else if ( el.textContent.trim() === '' ) {
				el.parentNode.removeChild(el);
			}
		})

		// Remove tags for cleaning.
		const { cleanTags } = this.settings
		if ( cleanPastedHTML && cleanTags.length ) {
			const cleanTagSelector = cleanTags.join(',')
			const forRemoval = dummy.querySelectorAll( cleanTagSelector )
			Array.prototype.forEach.call( forRemoval, (el) => {
				el.parentNode.removeChild( el )
			} )
		}

		// If allowed tags are supplied, remove those not allowed.
		const { allowOnly } = this.settings
		if ( allowOnly.length ) {
			const notAllowedSelector = allowOnly.map((tag) => `:not(${tag})`).join('');
			const notAllowedMatches = dummy.querySelectorAll( notAllowedSelector );
			Array.prototype.forEach.call( notAllowedMatches, (el) => {
				if ( el.parentNode ) {
					if ( el.textContent.trim() === '' || el.textContent.trim() === '\xa0' ) {
						el.parentNode.removeChild(el);
					} else {
						this._unwrapElement(el)
					}
				}
			} )
		}

		if ( cleanPastedHTML ) {

			// Remove attributes.
			const { cleanAttrs } = this.settings
			for ( var i = 0; i < cleanAttrs.length; i++ ) {
				const forAttrCleaning = dummy.querySelectorAll(`[${cleanAttrs[i]}]`)
				Array.prototype.forEach.call( forAttrCleaning, (el) => {
					el.removeAttribute( cleanAttrs[i] )
				} )
			}

			// Unwrap tags.
			const { unwrapTags } = this.settings
			for ( var i = 0; i < unwrapTags.length; i++ ) {
				const forUnwrapping = dummy.querySelectorAll(unwrapTags[i])
				Array.prototype.forEach.call( forUnwrapping, (el) => {
					this._unwrapElement(el)
				} )
			}

			// Remove tags for cleaning.
			const { cleanEmptyTags, allowedEmptyTags } = this.settings
			if ( cleanEmptyTags ) {
				const forEmptyCleaning = dummy.querySelectorAll('*')
				Array.prototype.forEach.call( forEmptyCleaning, (el) => {
					if ( allowedEmptyTags.indexOf( el.tagName.toLowerCase() ) === -1 && el.textContent.trim() === '' ) {
						el.parentNode.removeChild(el)
					}
				} )
			}

			// Remove trailing BRs - these can be added by contenteditable.
			const { cleanEdgeBrs } = this.settings
			if ( cleanEdgeBrs ) {
				const brs = dummy.querySelectorAll('br')
				Array.prototype.forEach.call( brs, (el) => {

					// Starting BRs.
					if ( ! el.previousSibling ) {
						el.parentNode.removeChild(el)
						return
					}

					// Trailing BRs.
					let lastBr = true
					let curr = el
					while ( curr.nextSibling ) {
						if ( curr.nextSibling.nodeType === 1 ) {
							if ( curr.nextSibling.tagName === 'BR' ) {
								curr = curr.nextSibling
								continue
							}
						}
						lastBr = false
						break
					}
					if ( lastBr ) {
						el.parentNode.removeChild(el)
					}
				} )
			}
		}

		// Final trimming of content.
		// const forTrimCleaning = dummy.querySelectorAll('*')
		// Array.prototype.forEach.call( forTrimCleaning, (el) => {
		// 	const trimmed = el.innerHTML.trim()
		// 	if ( el.innerHTML !== trimmed ) {
		// 		el.innerHTML = trimmed
		// 	}
		// } )

		return dummy.innerHTML
	}
}

export default HTMLSanitizer
