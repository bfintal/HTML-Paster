# HTML-Paster
Get the HTML (or plaintext) being pasted on to cross-browser input or contenteditable elements, then sanitize it and do whatever to it.

Compatibility: IE11, Edge, Chrome, Firefox, Safari and Opera

# Usage

**Your HTML**

```
<div id="foo" contenteditable="true">Bar</div>
```
  
**Javascript**

```
import HTMLPaster from 'HTMLPaster'

const foo = document.querySelector('#foo')
const paster = new HTMLPaster( foo, {
  pasteCallback: (html) => { console.log('This was pasted:', html) }
} )
paster.start()
```
  
Copy some content from another site, then visit your page and paste it in your element. You'll see sanitized pasted HTML in the console.

# Libraries

* HTMLPaster
* HTMLSanitizer

## TODO
- [x] initial commit
- [ ] jest tests
- [ ] build script
- [ ] demo folder
- [ ] docs
- [ ] examples
- [ ] distribute as NPM
