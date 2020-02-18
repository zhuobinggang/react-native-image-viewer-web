## Introduction

Why modal and other image-viewer packages not compitable with WEB ???

![01.gif](docs/01.gif)

## Example

To see the example in example folder.

## Usage

### Install

Install it from npm `yarn add react-native-image-viewer-web` or just copy & paste `ImgViewer.js` and `Modal.js` to the same folder.

### How to import?
`import ImgViewer from 'react-native-image-viewer-web';`

Or you can import it from the pasted file: `import ImgViewer from './ImgViewer';`

### Example
```js
import React from 'react';
import ImgViewer from 'react-native-image-viewer-web';

export default function App() {
  console.log()
  return (
    <ImgViewer imgs={[
      require('./assets/icon.png'), 
      'https://avatars3.githubusercontent.com/u/20993661?s=460&v=4']
    } />
  );
}
```

### Options

1. imgs: `[require('./assets/icon.png'), 'https://avatars3.githubusercontent.com/u/20993661?s=460&v=4']`, It can be both static file required & remote url(must start with http or https).
2. threshold: `num`. How many pixels(default 200) will be the threshold that determines changing image to happen.
3. footer: `num`. Should the footer show or not(default).
4. bgColor: `black` by default.
5. footerColor: `white` by default.
6. footerTextColor: `black` by default.


## Or maybe you want a container to fullfill its parent?

`import {Modal} from 'react-native-image-viewer-web'`

You want not? OK.

That's all, good luck.
