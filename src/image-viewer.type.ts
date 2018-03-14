import * as React from "react"
import { Text, View, ViewStyle } from "react-native"
import { simpleStyle } from "./image-viewer.style"

export class Props {

  public show?: boolean = false

  public imageUrls: IImageInfo[] = []

  public flipThreshold?: number = 80

  public maxOverflow?: number = 300

  public index?: number = 0

  public failImageSource?: IImageInfo = undefined

  public backgroundColor?: string = "black"

  public menuContext?: any = {
    saveToLocal: "save to the album",
    cancel: "cancel"
  }

  public saveToLocalByLongPress?: boolean = true

  public style?: ViewStyle = {}

  public onLongPress?: (image?: IImageInfo) => void = () => {
    //
  }

  public onClick?: (close?: () => any) => void = () => {
    //
  }

  public onDoubleClick?: (close?: () => any) => void = () => {
    //
  }

  public onSave?: (url: string) => void = () => {
    //
  }

  public renderHeader?: (
    currentIndex?: number
  ) => React.ReactElement<any> = () => {
    return null as any
  }

  public renderFooter?: (
    currentIndex?: number
  ) => React.ReactElement<any> = () => {
    return null as any
  }

  public renderIndicator?: (
    currentIndex?: number,
    allSize?: number
  ) => React.ReactElement<any> = (currentIndex: number, allSize: number) => {
    return React.createElement(
      View,
      { style: simpleStyle.count },
      React.createElement(
        Text,
        { style: simpleStyle.countText },
        currentIndex + "/" + allSize
      )
    )
  }

  public renderArrowLeft?: () => React.ReactElement<any> = () => {
    return null as any
  }

  public renderArrowRight?: () => React.ReactElement<any> = () => {
    return null as any
  }

  public onShowModal?: (content?: any) => void = () => {
    //
  }

  public onCancel?: () => void = () => {
    //
  }

  public loadingRender?: () => React.ReactElement<any> = () => {
    return null as any
  }

  public onSaveToCamera?: (index?: number) => void = () => {
    //
  }

  public onChange?: (index?: number) => void = () => {
    //
  }
}

export class State {

  public show?: boolean = false

  public currentShowIndex?: number = 0

  public imageLoaded?: boolean = false

  public imageSizes?: IImageSize[] = []

  public isShowMenu?: boolean = false
}

export interface IImageInfo {
  url: string

  width?: number

  height?: number

  sizeKb?: number

  originSizeKb?: number

  originUrl?: string
}

export interface IImageSize {
  width: number
  height: number
  status: "loading" | "success" | "fail"
}
