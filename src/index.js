import React from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'react-dropzone'
import 'github-fork-ribbon-css/gh-fork-ribbon.css'
import './index.css'

class LatteClassifier extends React.Component {
  onImageDrop (acceptedFiles, rejectedFiles) {
  }

  render () {
    return (
      <div className='latte-classifier'>
        <a
          className='github-fork-ribbon right-top'
          href='https://github.com/calid/isitalatte'
          data-ribbon='Fork me on GitHub'
          title='Fork me on GitHub'>
          Fork me on GitHub
        </a>
        <h1 className='title-banner'>Is it a latte?</h1>
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
