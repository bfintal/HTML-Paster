import HTMLSanitizer from './html-sanitizer'

class HTMLPaster {
	constructor(
		element,
		callbacks = {},
		sanitizer = new HTMLSanitizer() ) {

		this.element = element
		this.sanitizer = sanitizer
		this.callbacks = {
			prePasteCallback: (ev) => {},
			pasteCallback: (html) => { console.log('pasted:', html) },
			...callbacks,
		}
	}

	start() {
		if ( ! this.element ) {
			return this
		}

		this._onBeforePasteBound = this._onBeforePaste.bind( this )
		this.element.addEventListener( 'beforepaste', this._onBeforePasteBound )
		this._onPasteBound = this._onPaste.bind( this )
		this.element.addEventListener( 'paste', this._onPasteBound )

		return this
	}

	stop() {
		if ( ! this.element ) {
			return this
		}

		this.element.removeEventListener( 'beforepaste', this._onBeforePasteBound )
		this.element.removeEventListener( 'paste', this._onPasteBound )

		return this
	}

	_isIE11() {
		return /Trident\/|MSIE/.test(window.navigator.userAgent)
	}

	_isEdge() {
		return /Edge\//.test(window.navigator.userAgent)
	}

	/**
	* Fix for IE11 / Edge for getting the pasted HTML:
	* Let the browser paste first in another contenteditable, get the html from there,
	* then manually enter it in the contenteditable.
	* @from https://stackoverflow.com/questions/2787669/get-html-from-clipboard-in-javascript
	*/
	_onBeforePaste(ev) {

		if ( this.sanitizer.settings.forcePlainText ) {
			return;
		}

		const isIE11 = this._isIE11()
		const isEdge = this._isEdge()
		if ( ! isIE11 && ! isEdge ) {
			return;
		}

		// Create a dummy contenteditable to put the pasted text in.
		this._pasteOriginalRange = window.getSelection().getRangeAt(0)
		this.callbacks.prePasteCallback(ev)
		// this._pasteOriginalRange.deleteContents(); // For highlighted.

		this._dummyPasteArea = document.createElement('div');
		this._dummyPasteArea.setAttribute('contenteditable', 'true')

		// Hide the dummy, but keep interactivity.
		this._dummyPasteArea.style.position = 'absolute'
		this._dummyPasteArea.style.height = '1px'
		this._dummyPasteArea.style.width = '1px'
		this._dummyPasteArea.style.display = 'block'
		this._dummyPasteArea.style.overflow = 'hidden'
		this._dummyPasteArea.style.opacity = 0

		// We need to set the Y position so that the screen will not jump
		// because this will have focus for a brief moment.
		this._dummyPasteArea.style.top = (window.scrollY || window.pageYOffset) + 'px'
		document.body.appendChild( this._dummyPasteArea )

		// Select the dummy, this will move the screen!
		const range = document.createRange();
		range.selectNodeContents( this._dummyPasteArea )
		const sel = window.getSelection()
		sel.removeAllRanges()
		sel.addRange( range )

		// Wait for the default paste method to fire.
		setTimeout( () => {

			// Reselect previous area.
			// Don't do a focus here, or the screen will move!
			let newRange = this._pasteOriginalRange.cloneRange();
			const sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange( newRange )

			// Get the pasted HTML from the dummy element.
			const html = this.sanitizer.sanitize( this._dummyPasteArea.innerHTML )
			this.callbacks.pasteCallback( html )

			this._dummyPasteArea.parentNode.removeChild( this._dummyPasteArea )
			this._dummyPasteArea = null
		}, 0 )
	}

	_onPaste(ev) {

		// Plaintext is easy
		if ( this.sanitizer.settings.forcePlainText ) {
			let html = '';
			if ( this._isIE11() ) {
				html = ( ev.clipboardData || window.clipboardData ).getData( 'Text' )
			} else {
				html = ( ev.clipboardData || window.clipboardData ).getData( 'text/plain' )
			}

			ev.preventDefault()
			ev.stopPropagation()

			html = this.sanitizer.sanitize( html )
			this.callbacks.prePasteCallback(ev)
			this.callbacks.pasteCallback( html )

		// For modern browsers only. IE11 & Edge are handled in the _onBeforePaste event.
		} else if ( ! this._isIE11() && ! this._isEdge() ) {
			let html = ( ev.clipboardData || window.clipboardData ).getData( 'text/html' )
			if ( ! html ) {
				html = ( ev.clipboardData || window.clipboardData ).getData( 'Text' )
			}

			ev.preventDefault()
			ev.stopPropagation()

			html = this.sanitizer.sanitize( html )
			this.callbacks.prePasteCallback(ev)
			this.callbacks.pasteCallback( html )
		} else {
			this.callbacks.prePasteCallback(ev)
		}
	}
}

export default HTMLPaster
