/* global FileReader, btoa */
import SockJS from 'sockjs-client'
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'

const CONNECTED = 'connected'
const DISCONNECTED = 'disconnected'

class ImageTester extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
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

  handleFileUpload (e) {
    const image = e.target.files[0]
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
      this.state.msgQueue.push([image, b64Data])

      console.log('Sending image data for', image.name)
      this.flushMsgQueue()
    }

    r.readAsArrayBuffer(image)
  }

  render () {
    return (
      <input className='file-upload'
        type='file'
        onChange={this.handleFileUpload.bind(this)} />
    )
  }
}

ReactDOM.render(
  <ImageTester />,
  document.getElementById('root')
)
