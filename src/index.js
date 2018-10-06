import React from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'react-dropzone'
import 'github-fork-ribbon-css/gh-fork-ribbon.css'
import './index.css'

class LatteClassifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      imageUrl: ''
    }
  }

  onImageDrop (acceptedFiles, rejectedFiles) {
    const imageFile = acceptedFiles[0]
    const reader = new window.FileReader()

    reader.onloadend = () => {
      this.setState({
        imageUrl: reader.result
      })

      console.log(this.state.imageUrl)
    }

    reader.readAsDataURL(imageFile)
  }

  render () {
    const { imageUrl } = this.state
    let image = null

    if (imageUrl) {
      image = (<img className='target-image' src={imageUrl} alt='' />)
    } else {
      image = (<div />)
    }

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
        {image}
        <Dropzone
          className='dropzone'
          accept='image/*'
          onDrop={this.onImageDrop.bind(this)}>
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
