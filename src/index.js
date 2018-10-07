/* global Image, FileReader, btoa */

import React from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'react-dropzone'
import SockJS from 'sockjs-client'
import 'github-fork-ribbon-css/gh-fork-ribbon.css'
import './index.css'

const CONNECTED = 'connected'
const DISCONNECTED = 'disconnected'

class LatteClassifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      imageUrl: '',
      imagePreview: (<div />),
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
      const result = e.data
      console.log('Prediction result:', result)
    }

    sock.onclose = () => {
      console.log(apiUrl, 'disconnected')
      this.setState({
        sockState: DISCONNECTED
      })

      if (this.state.msgQueue.length) {
        console.log('Server unavailable, retrying to send image data in 5s')
        setTimeout(this.flushMsgQueue.bind(this), 5000)
      }
    }
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
        image: image
      })
    }

    reader.readAsDataURL(imageFile)
  }

  render () {
    return (
      <div className='latte-classifier'>
        <a
          href='https://github.com/calid/isitalatte-app'
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
        {this.state.latteProbability}
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
