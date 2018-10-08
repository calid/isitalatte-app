/* global Image, FileReader, btoa */

import React from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'react-dropzone'
import SockJS from 'sockjs-client'
import 'github-fork-ribbon-css/gh-fork-ribbon.css'
import './index.css'
import './spinner.css'

const CONNECTED = 'connected'
const DISCONNECTED = 'disconnected'
const WAITING = 'waiting'

class LatteClassifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      imageUrl: '',
      imagePreview: (<div />),
      predictionResult: (<div />),
      resultConfidence: (<div />),
      apiUrl: 'http://localhost:8081/sockjs',
      sock: null,
      sockState: DISCONNECTED,
      msgQueue: []
    }
  }

  connect () {
    const apiUrl = this.state.apiUrl

    console.log('Connecting to', apiUrl)
    const sock = new SockJS(apiUrl)

    this.setState({
      sock: sock
    })

    sock.onopen = () => {
      console.log('Established connection to', apiUrl)
      this.setState({
        sockState: CONNECTED
      })

      this.flushMsgQueue()
    }

    sock.onmessage = (e) => {
      this.setState({
        sockState: CONNECTED
      })

      const result = e.data
      this.displayResult(result)
    }

    sock.onclose = () => {
      console.log(apiUrl, 'disconnected')

      if (this.state.sockState === WAITING) {
        // message dropped, possibly related to large file uploads
        this.displayError()
      }

      this.setState({
        sockState: DISCONNECTED
      })

      if (this.state.msgQueue.length) {
        console.log('Server unavailable, retrying to send image data in 5s')
        setTimeout(this.flushMsgQueue.bind(this), 5000)
      }
    }
  }

  displayError () {
    const resultMsg = 'Something went wrong, please try a different file'

    this.setState({
      imagePreview: (<img className='target-image' src='./fail.svg' alt='' />),
      predictionResult: (
        <div className='result-box'>
          <p className='result-msg-error'>{resultMsg} </p>
        </div>
      )
    })
  }

  displayResult (r) {
    console.log('Prediction result:', r)

    const result = JSON.parse(r)

    if (result.error) {
      this.displayError()
      return
    }

    let resultMsg = ''
    let resultEmoji = ''

    if (result.image_class === 'latte') {
      resultMsg = "It's a latte!"
      resultEmoji = './Noto_Emoji_Oreo_1f600.svg'
    } else if (result.image_class === 'not-latte') {
      resultMsg = 'Not a latte'
      resultEmoji = './Noto_Emoji_Oreo_1f61e.svg'
    } else {
      resultMsg = 'Not sure if latte?'
      resultEmoji = './Noto_Emoji_Oreo_1f914.svg'
    }

    const latteProbability = result.latte_prob
    const notLatteProbability = result.not_latte_prob

    this.setState({
      predictionResult: (
        <div className='result-box'>
          <p className='result-msg'>{resultMsg} </p>
          <img className='result-emoji' src={resultEmoji} />
          <div className='result-confidence'>
            <p className='result-p'>Latte: {latteProbability}</p>
            <p className='result-p'>Not-Latte: {notLatteProbability}</p>
          </div>
        </div>
      )
    })
  }

  flushMsgQueue () {
    if (this.state.sockState === DISCONNECTED) {
      this.connect()
    } else {
      const q = this.state.msgQueue
      const [image, data] = q[q.length - 1]

      this.state.sock.send(data)
      console.log('Image data for', image.name, 'sent')
      q.pop()
      this.setState({
        sockState: WAITING
      })
    }
  }

  handleFileUpload (imageFile) {
    const r = new FileReader()
    r.onload = () => {
      const buffer = r.result
      const bytes = new Uint8Array(buffer)

      let bytestr = ''
      let len = bytes.byteLength

      for (let i = 0; i < len; i++) {
        bytestr += String.fromCharCode(bytes[i])
      }

      const b64Data = btoa(bytestr)
      this.state.msgQueue.push([imageFile, b64Data])

      console.log('Sending imageFile data for', imageFile.name)
      this.flushMsgQueue()
    }

    r.readAsArrayBuffer(imageFile)
  }

  onImageDrop (acceptedFiles, rejectedFiles) {
    const imageFile = acceptedFiles[0]
    const reader = new FileReader()

    reader.onloadend = () => {
      let imageUrl = reader.result
      let imagePreview = (<img className='target-image' src={imageUrl} alt='' />)
      let image = new Image()

      image.onloadend = () => this.handleFileUpload(imageFile)
      image.src = imageUrl

      this.setState({
        imageUrl: imageUrl,
        imagePreview: imagePreview,
        image: image,
        predictionResult: (
          <div className='result-box'>
            <div className='lds-ring'><div /><div /><div /><div /></div>
          </div>
        )
      })
    }

    reader.readAsDataURL(imageFile)
  }

  render () {
    return (
      <div className='latte-classifier'>
        <a
          className='github-fork-ribbon right-top'
          data-ribbon='Fork me on GitHub'
          title='Fork me on GitHub'
          onClick={
            function () {
              window.open('https://github.com/calid/isitalatte-app')
            }
          }>
          Fork me on GitHub
        </a>
        <h1 className='title-banner'>Is it a latte?</h1>
        {this.state.imagePreview}
        {this.state.predictionResult}
        <Dropzone
          className='dropzone'
          accept='image/*'
          onDrop={this.onImageDrop.bind(this)}
          disablePreview>
          <p>Drop an image to classify or click to upload</p>
        </Dropzone>
      </div>
    )
  }
}

ReactDOM.render(
  <LatteClassifier />,
  document.getElementById('root')
)
