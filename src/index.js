import React from 'react'
import ReactDOM from 'react-dom'
import Dropzone from 'react-dropzone'
import * as tf from '@tensorflow/tfjs'
import 'github-fork-ribbon-css/gh-fork-ribbon.css'
import './index.css'

const MODEL_PATH = 'http://127.0.0.1:8080/model.json'
const IMAGE_SIZE = 150

class LatteClassifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      imageUrl: '',
      imagePreview: (<div />),
      latteProbability: (<div />),
      model: null
    }

    this.loadModel()
  }

  async loadModel () {
    console.log('loading model...')
    const model = await tf.loadModel(MODEL_PATH)
    this.setState({
      model: model
    })

    // model.summary()
    model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose()
  }

  displayResult (result) {
    // result is probability image is not a latte,
    // so subtract from one to get latte probability
    const probability = 1.0 - result
    const latteProbability = (
      <p className='latte-probability'>Latte: {probability.toFixed(3)}</p>
    )
    this.setState({
      latteProbability: latteProbability
    })
  }

  async predictIsLatte (img) {
    const prediction = tf.tidy(() => {
      let imgTensor = tf.fromPixels(img).toFloat()

      // scale values between 0 and 1
      imgTensor = imgTensor.div(tf.scalar(255))

      imgTensor = imgTensor.expandDims(0)
      imgTensor = tf.image.resizeBilinear(imgTensor, [150, 150])

      return this.state.model.predict(imgTensor)
    })

    const result = await prediction.data()
    this.displayResult(result[0])
  }

  onImageDrop (acceptedFiles, rejectedFiles) {
    const imageFile = acceptedFiles[0]
    const reader = new window.FileReader()

    reader.onloadend = () => {
      let imageUrl = reader.result
      let imagePreview = (<img className='target-image' src={imageUrl} alt='' />)
      let image = new window.Image()

      image.onloadend = () => this.predictIsLatte(image)
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
