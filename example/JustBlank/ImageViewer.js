import React from 'react'
import {View, Text, PanResponder, Image} from 'react-native';
import Modal from './Modal'

const isRemoteImg = (uri) => {
  return /^http/.test(uri)
}

const getImgSize = (uri, fallback={width: 200, height: 200}) => {
  uri = String(uri)
  return new Promise((resolve, reject) => {
    //TODO: distinguish remote & local image
    if(isRemoteImg(uri)){
      Image.getSize(uri, (originWidth, orginHeight) => {
        resolve({
          width: originWidth, height: orginHeight
        })
      })
    }else{
      resolve(fallback)
    }
  })
}

const doubleClickHandlerCreate = (
  doSomeThing = () => {console.warn('Double clicked but nothing will happen!')}, 
  threshold = 200,
) => {
  let lastPressTime = 0
  return () => {
    const now = new Date().getTime()
    if(now - lastPressTime < threshold){
      doSomeThing();
      return true
    }else{
      lastPressTime = now;
      return false
    }
  }
}

let responder = {} ;

const zoomToggle = (containerWidth, imgWidth, zoomInSize) => {
  if(imgWidth > containerWidth){
    return containerWidth
  }else{
    return zoomInSize < containerWidth * 2 ? containerWidth * 2 : zoomInSize
  }
}

function getHeightByWidth(uri,width){
  return getImgSize(uri).then((size) => {
    const ratio = parseFloat(size.height) / parseFloat(size.width);
    const height  = Math.floor(parseFloat(width) * ratio)
    return height
  })
}

function centerPos(width, height, imgWidth, imgHeight){
  return {x: (width -imgWidth) / 2, y: (height -imgHeight) / 2}
}

const nextOrFirstImg = (srcs, index) => {
  const next = index + 1
  return next > srcs.length - 1 ? 0 : next
}

const previousOrFinal = (srcs, index) => {
  const prev = index - 1
  return prev < 0 ? srcs.length - 1 : prev
}

export default class ImageViewer extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      imgIndex: 0,
      width: 0,
      height: 0,
      imgWidth: 0,
      imgHeight: 0,
      imgX: 0,
      imgY: 0,
    }
    this.threshold = props.threshold || 100;
  }

  nextImg = () => {
    this.setState({
      imgIndex: nextOrFirstImg(this.props.imgs, this.state.imgIndex)
    })
  }

  prevImg = () => {
    this.setState({
      imgIndex: previousOrFinal(this.props.imgs, this.state.imgIndex)
    })
  }


  placeImageCenterByWidth = (nextWidth) => {
    const uri = this.props.imgs[this.state.imgIndex]
    getHeightByWidth(uri, nextWidth).then(nextHeight => {
      //Calculate the x and y to place center
      const {x,y} = centerPos(this.state.width, this.state.height, nextWidth, nextHeight);
      this.setState({imgWidth: nextWidth, imgHeight: nextHeight, imgX: x, imgY: y})
    })
  }




  componentDidMount = () => {
    let startPoint = {x: 0, y: 0}
    const doubleClickHandler = doubleClickHandlerCreate(() => {
      getImgSize(this.props.imgs[this.state.imgIndex]).then(({width}) => {
        const nextWidth = zoomToggle(this.state.width, this.state.imgWidth, width)
        this.placeImageCenterByWidth(nextWidth)
      })
    })
    responder = PanResponder.create({
        onStartShouldSetPanResponder: () => {return true },
        onMoveShouldSetPanResponder: () => {return true},
        onPanResponderGrant: ( event, gestureState,) => {
          startPoint.x = this.state.imgX
          startPoint.y = this.state.imgY
          doubleClickHandler();
        },
        onPanResponderMove: (_, gestureState) => {
          const moveX = gestureState.moveX - gestureState.x0;
          const moveY = gestureState.moveY - gestureState.y0;
          this.setState({
            imgX: startPoint.x + moveX,
            imgY: startPoint.y + moveY
          })
        },
        onPanResponderRelease: () => {
          //Ajust the position
          const {imgX, imgY, imgWidth, imgHeight, width, height} = this.state
          if(imgX > 0){
            if(imgX > this.threshold){
              this.prevImg()
            }else{
              this.setState({ imgX: 0 })
            }
          }
          if(imgX +imgWidth < width){
            if(width - (imgX + imgWidth) > this.threshold){
              this.nextImg()
            }else{
              this.setState({ imgX: width - imgWidth })
            }
          }


          if(imgHeight > height){
            if(imgY > 0){
              this.setState({imgY: 0})
            }
            if(imgY + imgHeight < height){
              this.setState({imgY: height - imgHeight})
            }
          }else{
            if(imgY < 0){
              this.setState({imgY: 0})
            }
            if(imgY + imgHeight > height){
              this.setState({imgY: height - imgHeight})
            }
          }
        },
        // onPanResponderTerminate: this._handlePanResponderEnd,
    })
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if(prevState.width != this.state.width || prevState.height != this.state.height){
    //   //Do not depend on screen but use layout listener instead.
      if(this.state.width == 0 || this.state.height == 0){
        return
      }else{
        this.placeImageCenterByWidth(this.state.width)
      }
    }
    // //If imgIndex changed, reset imgX/Y imgWidth/Height and place centre.
    if(prevState.imgIndex != this.state.imgIndex){
      this.placeImageCenterByWidth(this.state.width)
    }
  }

  render = () => {
    const uri = this.props.imgs[this.state.imgIndex];
    const component = (
      //Add layout listener
      <View style={{width:"100%", height: '100%'}}>
        <View onLayout={event => {
            const {width,height} = event.nativeEvent.layout;
            this.setState({height})
            this.setState({width})
          }} style={{backgroundColor:'black', position: 'absolute', left: 0, right: 0, top: 0, bottom: 32}} {...responder.panHandlers}>
          <Image style={{width: this.state.imgWidth, height: this.state.imgHeight, position: 'absolute', top: this.state.imgY, left: this.state.imgX}}  source={isRemoteImg(uri) ? {uri} : String(uri)} />
        </View>
        <View style={{backgroundColor: 'white', height: 32, width: '100%', position: 'absolute', left: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
          <Text>{this.state.imgIndex + 1} / {this.props.imgs.length}</Text>
        </View>
      </View>
    )
  
    return (
      <Modal component={component} />
    )
  }
}