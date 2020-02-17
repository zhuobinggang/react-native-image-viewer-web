## Introduction

Why modal and other image-viewer packages not compitable with WEB ???

![01.gif](docs/01.gif)

## Usage

To see the example in example folder.

```js
import React from 'react';
import ImgViewer from './ImageViewer';

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