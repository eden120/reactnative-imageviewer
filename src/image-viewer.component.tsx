import * as React from "react"
import {
  Animated,
  CameraRoll,
  Image,
  Platform,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import ImageZoom from "react-native-image-pan-zoom"
import styles from "./image-viewer.style"
import { IImageInfo, IImageSize, Props, State } from "./image-viewer.type"

export default class ImageViewer extends React.Component<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  private fadeAnim = new Animated.Value(0)

  private standardPositionX = 0

  private positionXNumber = 0
  private positionX = new Animated.Value(0)

  private width = 0
  private height = 0

  private styles = styles(0, 0, "transparent")

  private hasLayout = false

  private loadedIndex = new Map<number, boolean>()

  private handleLongPressWithIndex = new Map<number, any>()

  public componentWillMount() {
    this.init(this.props)
  }

  public componentWillReceiveProps(nextProps: Props) {
    if (nextProps.index !== this.state.currentShowIndex) {
      this.setState(
        {
          currentShowIndex: nextProps.index
        },
        () => {
          this.loadImage(nextProps.index || 0)

          this.jumpToCurrentImage()

          Animated.timing(this.fadeAnim, {
            toValue: 1,
            duration: 200
          }).start()
        }
      )
    }
  }

  public init(nextProps: Props) {
    if (nextProps.imageUrls.length === 0) {
      this.fadeAnim.setValue(0)
      return this.setState(new State())
    }

    const imageSizes: IImageSize[] = []
    nextProps.imageUrls.forEach(imageUrl => {
      imageSizes.push({
        width: imageUrl.width || 0,
        height: imageUrl.height || 0,
        status: "loading"
      })
    })

    this.setState(
      {
        currentShowIndex: nextProps.index,
        imageSizes
      },
      () => {
        this.loadImage(nextProps.index || 0)

        this.jumpToCurrentImage()

        Animated.timing(this.fadeAnim, {
          toValue: 1,
          duration: 200
        }).start()
      }
    )
  }

  public jumpToCurrentImage() {
    this.positionXNumber = -this.width * (this.state.currentShowIndex || 0)
    this.standardPositionX = this.positionXNumber
    this.positionX.setValue(this.positionXNumber)
  }

  public loadImage(index: number) {
    if (!this!.state!.imageSizes![index]) {
      return
    }

    if (this.loadedIndex.has(index)) {
      return
    }
    this.loadedIndex.set(index, true)

    const image = this.props.imageUrls[index]
    const imageStatus = { ...this!.state!.imageSizes![index] }

    const saveImageSize = () => {
      if (
        this!.state!.imageSizes![index] &&
        this!.state!.imageSizes![index].status !== "loading"
      ) {
        return
      }

      const imageSizes = this!.state!.imageSizes!.slice()
      imageSizes[index] = imageStatus
      this.setState({ imageSizes })
    }

    if (this!.state!.imageSizes![index].status === "success") {
      return
    }

    if (
      this!.state!.imageSizes![index].width > 0 &&
      this!.state!.imageSizes![index].height > 0
    ) {
      imageStatus.status = "success"
      saveImageSize()
      return
    }

    let sizeLoaded = false
    let imageLoaded = false

    if (image.url.startsWith(`file:`)) {
      imageLoaded = true
    }

    if (Platform.OS !== ("web" as any)) {
      const prefetchImagePromise = Image.prefetch(image.url)

      if (image.url.match(/^(http|https):\/\//)) {
        prefetchImagePromise.then(
          () => {
            imageLoaded = true
            if (sizeLoaded) {
              imageStatus.status = "success"
              saveImageSize()
            }
          },
          () => {
            imageStatus.status = "fail"
            saveImageSize()
          }
        )
      } else {
        imageLoaded = true
        prefetchImagePromise
          .then(() => {
            //
          })
          .catch(() => {
            //
          })
        if (sizeLoaded) {
          imageStatus.status = "success"
          saveImageSize()
        }
      }

      if (image.width && image.height) {
        sizeLoaded = true
        imageStatus.width = image.width
        imageStatus.height = image.height

        if (imageLoaded) {
          imageStatus.status = "success"
          saveImageSize()
        }
      } else {
        Image.getSize(
          image.url,
          (width, height) => {
            sizeLoaded = true
            imageStatus.width = width
            imageStatus.height = height

            if (imageLoaded) {
              imageStatus.status = "success"
              saveImageSize()
            }
          },
          error => {
            imageStatus.status = "fail"
            saveImageSize()
          }
        )
      }
    } else {
      const imageFetch = new (window as any).Image()
      imageFetch.src = image.url
      imageFetch.onload = () => {
        imageStatus.width = imageFetch.width
        imageStatus.height = imageFetch.height
        imageStatus.status = "success"
        saveImageSize()
      }
      imageFetch.onerror = () => {
        imageStatus.status = "fail"
        saveImageSize()
      }
    }
  }

  public handleHorizontalOuterRangeOffset = (offsetX: number) => {
    this.positionXNumber = this.standardPositionX + offsetX
    this.positionX.setValue(this.positionXNumber)

    if (offsetX < 0) {
      if (
        this!.state!.currentShowIndex ||
        0 < this.props.imageUrls.length - 1
      ) {
        this.loadImage((this!.state!.currentShowIndex || 0) + 1)
      }
    } else if (offsetX > 0) {
      if (this!.state!.currentShowIndex || 0 > 0) {
        this.loadImage((this!.state!.currentShowIndex || 0) - 1)
      }
    }
  }

  public handleResponderRelease = (vx: number) => {
    if (vx > 0.7) {
      this.goBack.call(this)

      if (this.state.currentShowIndex || 0 > 0) {
        this.loadImage((this.state.currentShowIndex || 0) - 1)
      }
    } else if (vx < -0.7) {
      this.goNext.call(this)
      if (this.state.currentShowIndex || 0 < this.props.imageUrls.length - 1) {
        this.loadImage((this.state.currentShowIndex || 0) + 1)
      }
    }

    if (
      this.positionXNumber - this.standardPositionX >
      (this.props.flipThreshold || 0)
    ) {
      this.goBack.call(this)
    } else if (
      this.positionXNumber - this.standardPositionX <
      -(this.props.flipThreshold || 0)
    ) {
      this.goNext.call(this)
    } else {
      this.resetPosition.call(this)
    }
  }

  public goBack = () => {
    if (this.state.currentShowIndex === 0) {
      this.resetPosition.call(this)
      return
    }

    this.positionXNumber = this.standardPositionX + this.width
    this.standardPositionX = this.positionXNumber
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: 100
    }).start()

    const nextIndex = (this.state.currentShowIndex || 0) - 1

    this.setState(
      {
        currentShowIndex: nextIndex
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex)
        }
      }
    )
  }

  public goNext() {
    if (this.state.currentShowIndex === this.props.imageUrls.length - 1) {
      this.resetPosition.call(this)
      return
    }

    this.positionXNumber = this.standardPositionX - this.width
    this.standardPositionX = this.positionXNumber
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: 100
    }).start()

    const nextIndex = (this.state.currentShowIndex || 0) + 1

    this.setState(
      {
        currentShowIndex: nextIndex
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex)
        }
      }
    )
  }

  public resetPosition() {
    this.positionXNumber = this.standardPositionX
    Animated.timing(this.positionX, {
      toValue: this.standardPositionX,
      duration: 150
    }).start()
  }

  public handleLongPress = (image: IImageInfo) => {
    if (this.props.saveToLocalByLongPress) {
      this.setState({ isShowMenu: true })
    }

    if (this.props.onLongPress) {
      this.props.onLongPress(image)
    }
  }

  public handleClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.handleCancel)
    }
  }

  public handleDoubleClick = () => {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this.handleCancel)
    }
  }

  public handleCancel = () => {
    this.hasLayout = false
    if (this.props.onCancel) {
      this.props.onCancel()
    }
  }

  public handleLayout = (event: any) => {
    if (this.hasLayout) {
      return
    }

    this.hasLayout = true

    this.width = event.nativeEvent.layout.width
    this.height = event.nativeEvent.layout.height
    this.styles = styles(
      this.width,
      this.height,
      this.props.backgroundColor || "transparent"
    )

    this.forceUpdate()
    this.jumpToCurrentImage()
  }

  public getContent() {
    const screenWidth = this.width
    const screenHeight = this.height

    const ImageElements = this.props.imageUrls.map((image, index) => {
      if (!this.handleLongPressWithIndex.has(index)) {
        this.handleLongPressWithIndex.set(
          index,
          this.handleLongPress.bind(this, image)
        )
      }

      let width =
        this!.state!.imageSizes![index] && this!.state!.imageSizes![index].width
      let height =
        this.state.imageSizes![index] && this.state.imageSizes![index].height
      const imageInfo = this.state.imageSizes![index]

      if (width > screenWidth) {
        const widthPixel = screenWidth / width
        width *= widthPixel
        height *= widthPixel
      }

      if (height > screenHeight) {
        const HeightPixel = screenHeight / height
        width *= HeightPixel
        height *= HeightPixel
      }

      const Wrapper = ({ children, ...others }: any) => (
        <ImageZoom
          cropWidth={this.width}
          cropHeight={this.height}
          maxOverflow={this.props.maxOverflow}
          horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
          responderRelease={this.handleResponderRelease}
          onLongPress={this.handleLongPressWithIndex.get(index)}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          {...others}
        >
          {children}
        </ImageZoom>
      )

      switch (imageInfo.status) {
        case "loading":
          return (
            <Wrapper
              key={index}
              style={{
                ...this.styles.modalContainer,
                ...this.styles.loadingContainer
              }}
              imageWidth={screenWidth}
              imageHeight={screenHeight}
            >
              <View style={this.styles.loadingContainer}>
                {this!.props!.loadingRender!()}
              </View>
            </Wrapper>
          )
        case "success":
          return (
            <ImageZoom
              key={index}
              cropWidth={this.width}
              cropHeight={this.height}
              maxOverflow={this.props.maxOverflow}
              horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
              responderRelease={this.handleResponderRelease}
              onLongPress={this.handleLongPressWithIndex.get(index)}
              onClick={this.handleClick}
              onDoubleClick={this.handleDoubleClick}
              imageWidth={width}
              imageHeight={height}
            >
              <Image
                style={{
                  ...this.styles.imageStyle,
                  width,
                  height
                }}
                source={{ uri: image.url }}
              />
            </ImageZoom>
          )
        case "fail":
          return (
            <Wrapper
              key={index}
              style={this.styles.modalContainer}
              imageWidth={
                this.props.failImageSource
                  ? this.props.failImageSource.width
                  : screenWidth
              }
              imageHeight={
                this.props.failImageSource
                  ? this.props.failImageSource.height
                  : screenHeight
              }
            >
              {this.props.failImageSource && (
                <Image
                  source={{
                    uri: this.props.failImageSource.url
                  }}
                  style={{
                    width: this.props.failImageSource.width,
                    height: this.props.failImageSource.height
                  }}
                />
              )}
            </Wrapper>
          )
      }
    })

    return (
      <Animated.View
        style={{ ...this.styles.container, opacity: this.fadeAnim }}
      >
        {this!.props!.renderHeader!(this.state.currentShowIndex)}

        <View style={this.styles.arrowLeftContainer}>
          <TouchableWithoutFeedback onPress={this.goBack}>
            <View>{this!.props!.renderArrowLeft!()}</View>
          </TouchableWithoutFeedback>
        </View>

        <View style={this.styles.arrowRightContainer}>
          <TouchableWithoutFeedback onPress={this.goNext}>
            <View>{this!.props!.renderArrowRight!()}</View>
          </TouchableWithoutFeedback>
        </View>

        <Animated.View
          style={{
            ...this.styles.moveBox,
            transform: [{ translateX: this.positionX }],
            width: this.width * this.props.imageUrls.length
          }}
        >
          {ImageElements}
        </Animated.View>

        {
          this!.props!.renderIndicator!(
            (this.state.currentShowIndex || 0) + 1,
            this.props.imageUrls.length
          )
        }

        {this.props.imageUrls[this.state.currentShowIndex || 0].originSizeKb &&
          this.props.imageUrls[this.state.currentShowIndex || 0].originUrl && (
            <View style={this.styles.watchOrigin}>
              <TouchableOpacity style={this.styles.watchOriginTouchable}>
                <Text style={this.styles.watchOriginText}>Original Photo(2M)</Text>
              </TouchableOpacity>
            </View>
          )}

        {this!.props!.renderFooter!(this.state.currentShowIndex)}
      </Animated.View>
    )
  }

  public saveToLocal = () => {
    if (!this.props.onSave) {
      CameraRoll.saveToCameraRoll(
        this.props.imageUrls[this.state.currentShowIndex || 0].url
      )
      this!.props!.onSaveToCamera!(this.state.currentShowIndex)
    } else {
      this.props.onSave(
        this.props.imageUrls[this.state.currentShowIndex || 0].url
      )
    }

    this.setState({ isShowMenu: false })
  }

  public getMenu() {
    if (!this.state.isShowMenu) {
      return null
    }

    return (
      <View style={this.styles.menuContainer}>
        <View style={this.styles.menuShadow} />
        <View style={this.styles.menuContent}>
          <TouchableHighlight
            underlayColor="#F2F2F2"
            onPress={this.saveToLocal}
            style={this.styles.operateContainer}
          >
            <Text style={this.styles.operateText}>
              {this.props.menuContext.saveToLocal}
            </Text>
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor="#F2F2F2"
            onPress={this.handleLeaveMenu}
            style={this.styles.operateContainer}
          >
            <Text style={this.styles.operateText}>
              {this.props.menuContext.cancel}
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    )
  }

  public handleLeaveMenu = () => {
    this.setState({ isShowMenu: false })
  }

  public render() {
    let childs: React.ReactElement<any> = null as any

    childs = (
      <View>
        {this.getContent()}
        {this.getMenu()}
      </View>
    )

    return (
      <View
        onLayout={this.handleLayout}
        style={{ flex: 1, overflow: "hidden", ...this.props.style }}
      >
        {childs}
      </View>
    )
  }
}
