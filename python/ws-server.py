import asyncio
import os
import sockjs
import base64
import numpy as np
import imghdr
import struct
import json

from aiohttp import web
import tensorflow as tf

# suppress a warning about unused cpu instructions
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

model_file = '/home/calid/git/isitalatte/isitalatte.h5'

print(f"Loading model from {model_file}")
MODEL = tf.keras.models.load_model(model_file)
print('Done.')

def process_img(imgdata):
    decode_funcs = {
        'jpeg': tf.image.decode_jpeg,
        'png': tf.image.decode_png,
    }

    imgtype = imghdr.what(None, h=imgdata)
    if imgtype not in decode_funcs.keys():
        print(f"Unsupported file type {imgtype}")
        return

    print('New image received')

    img_tensor = decode_funcs[imgtype](imgdata, channels=3)
    img_tensor = tf.image.resize_images(img_tensor, [150, 150])
    img_array  = tf.Session().run(img_tensor)
    img_array /= 255.
    img_array = np.expand_dims(img_array, axis=0)

    print('Running model prediction')
    result = MODEL.predict(img_array)
    score = result[0][0]

    print(f"Score: {score}")
    return score

async def handle_msg(msg, session):
    if (msg.data):
        imgdata = base64.b64decode(msg.data)

        # result is probability image belongs to Class 1
        # Class 0: Latte
        # Class 1: Not-Latte
        # (determined during training)
        not_latte_prob = process_img(imgdata)
        latte_prob     = 1.0 - not_latte_prob

        if latte_prob >= 0.7:
            img_class = 'latte'
        elif not_latte_prob >= 0.7:
            img_class = 'not-latte'
        else:
            img_class = 'unsure'

        # format as json our client can easily consume
        session.send(
            json.dumps({
                'image_class': img_class,
                'latte_prob': "%0.3f" % latte_prob,
                'not_latte_prob': "%0.3f" % not_latte_prob
            })
        )

def index(request):
    return web.Response

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    app  = web.Application(loop=loop)

    app.router.add_route('GET', '/', index)
    sockjs.add_endpoint(app, prefix='/sockjs', handler=handle_msg)

    handler = app.make_handler()
    server = loop.run_until_complete(
        loop.create_server(handler, '127.0.0.1', 8081))

    print('Server started at http://127.0.0.1:8081')

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        server.close()
        loop.run_until_complete(handler.finish_connections())
