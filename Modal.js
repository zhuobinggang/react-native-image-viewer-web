import React from 'react'
import {View} from 'react-native';

export default ({component}) => {
  return (
    <View style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
      {component}
    </View>
  )
}