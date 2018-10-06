/* global FileReader */
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

    sock.onmessage = this.handleMsgRcvd

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

  handleImgResult (e) {
    console.log('message', e.data)
  }

  handleFileUpload (e) {
    const image = e.target.files[0]
    const r = new FileReader()
    r.onload = () => {
      const data = r.result
      this.state.msgQueue.push([image, data])

      console.log('Sending image data for', image.name)
      this.flushMsgQueue()
    }

    r.readAsBinaryString(image)
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
