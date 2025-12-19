# chessboard-sense

A TypeScript library compatible with both Node.js and Browser environments.

## Installation

```bash
npm install chessboard-sense
```

## Usage

### Node.js (CommonJS)

```javascript
const { greet, add } = require('chessboard-sense');

console.log(greet('World')); // Hello, World!
console.log(add(2, 3)); // 5
```

### Node.js (ES Modules)

```javascript
import { greet, add } from 'chessboard-sense';

console.log(greet('World')); // Hello, World!
console.log(add(2, 3)); // 5
```

### Browser

```html
<script type="module">
  import { greet, add } from './node_modules/chessboard-sense/dist/index.js';

  console.log(greet('World')); // Hello, World!
  console.log(add(2, 3)); // 5
</script>
```

## Development

### Install dependencies

```bash
npm install
```

### Build the library

```bash
npm run build
```

### Watch mode for development

```bash
npm run dev
```

### Type checking

```bash
npm run typecheck
```

## License

MIT
