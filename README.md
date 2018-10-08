## Description

This is a web frontend for a latte image classifier written using React,
python 3, and websockets. A live version of this site is at
http://isitalatte.com. The image classifier code is at
https://github.com/calid/isitalatte.

## Install

You will need npm and python 3 installed first. Development was done using python 3.6.6 which you can install using [pyenv](https://github.com/pyenv/pyenv).

```
$ git clone https://github.com/calid/isitalatte-app.git
$ cd isitalatte-app
$ npm install
$ wget https://s3.amazonaws.com/isitalatte/isitalatte-app-resources.tar.gz
$ tar xvf isitalatte-app-resources.tar.gz
$ cd python
$ pip3 install -r requirements.txt
```

The resources tarball contains the actual image classifier model and a binary
tensorflow op used by the python backend.

## Run

To start a local development server run `npm start` at the repo root.  To start
the backend run `python3 model-server.py` in the `python/` subdirectory

## See Also

https://github.com/calid/isitalatte
