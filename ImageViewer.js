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

const zoomToggleWidth = (containerWidth, nowWidth, realWidth) => {
  if(nowWidth > containerWidth){
    return containerWidth //Will always be bigger than or equal to the container width
  }else{
    const twoTimesContainerWidth = containerWidth * 2;
    return realWidth < twoTimesContainerWidth ? twoTimesContainerWidth : realWidth
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
      imgIndex: (this.props.index != null && this.props.imgs[this.props.index] != null) ? this.props.index : 0,
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
        const nextWidth = zoomToggleWidth(this.state.width, this.state.imgWidth, width)
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
          const isMoreThanOneImg = this.props.imgs.length > 1;
          if(imgX > 0){
            if(isMoreThanOneImg && imgX > this.threshold ){
              this.prevImg()
            }else{
              this.setState({ imgX: 0 })
            }
          }
          if(imgX +imgWidth < width){
            if(isMoreThanOneImg && width - (imgX + imgWidth) > this.threshold){
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
      <View style={styles.rootContainer}>
        <View onLayout={event => {
            const {width,height} = event.nativeEvent.layout;
            this.setState({height})
            this.setState({width})
          }} 
          style={{backgroundColor: this.props.bgColor || 'black', position: 'absolute', left: 0, right: 0, top: 0, bottom: this.props.footer || 0}} 
          {...responder.panHandlers}>
          <Image style={{
              position: 'absolute', 
              width: this.state.imgWidth, 
              height: this.state.imgHeight, 
              top: this.state.imgY, 
              left: this.state.imgX,
              resizeMode: 'contain',
            }}  source={isRemoteImg(uri) ? {uri} : String(uri)} />
        </View>
        {this.props.footer && this.props.footer > 0 ? 
          <Paginator 
            footerColor={this.props.footerColor}  
            height={this.props.footer}  
            footerTextColor={this.props.footerTextColor}
            index={this.state.imgIndex}
            length={this.props.imgs.length}
          /> : 
          null }
      </View>
    )
  
    return (
      <Modal component={component} />
    )
  }
}

const styles = {
  rootContainer: {width:"100%", height: '100%'},
}

const Paginator = React.memo(({footerColor, height, footerTextColor, index, length}) => {
  return <View style={{
      backgroundColor: footerColor || 'white', 
      height: height, 
      width: '100%', 
      position: 'absolute', 
      left: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'
    }}>
    <Text style={{color: footerTextColor || 'black'}}>{index + 1} / {length}</Text>
  </View>
})