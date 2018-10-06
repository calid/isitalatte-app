import asyncio
import os
from aiohttp import web
import sockjs
import base64

async def process_image(msg, session):
    if (msg.data):
        imgdata = base64.b64decode(msg.data)
        imgfile = open('/tmp/img.jpg', 'wb')
        imgfile.write(imgdata)
        print('wrote /tmp/img.jpg')

def index(request):
    return web.Response

if __name__ == '__main__':
    loop = asyncio.get_event_loop()

    app = web.Application(loop=loop)

    app.router.add_route('GET', '/', index)
    sockjs.add_endpoint(app, prefix='/sockjs', handler=process_image)

    handler = app.make_handler()
    server = loop.run_until_complete(
        loop.create_server(handler, '127.0.0.1', 8081))

    print('Server started at http://127.0.0.1:8081')

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        server.close()
        loop.run_until_complete(handler.finish_connections())
