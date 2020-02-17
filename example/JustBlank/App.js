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
