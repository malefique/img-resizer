const config = {};

config.mimeTypes = {
    'jpg': [
        'image/jpeg',
        'image/pjpeg'
    ],
    'jpeg': [
        'image/jpeg',
        'image/pjpeg'
    ],
    'png':[
        'image/png'
    ]
};

config.imagesPath = 'uploads/';

config.sizes = {
    'similar': {'width': 280, 'height': 172},
    'views': {'width': 180, 'height': 110},
    'list': {'width': 270, 'height': 195},
    'main': {'width': 900, 'height': 462},
    'progress': {'width': 738, 'height': 372},
    'map': {'width': 280, 'height': 173},
    'criteo': {'width': 600, 'height': 500},
    'block_progress': {'width': 400, 'height': 300},
    'block_main_520': {'width': 520, 'height': 500},
    'block_main_800': {'width': 800, 'height': 500},
    'block_main_1200': {'width': 1200, 'height': 700},
    'assignment_block_655': {'width': 655, 'height': 460}
};

config.quality = 83;
config.path = 'images/';

config.rabbitServerAddr = 'amqp://localhost';

config.imageQueueName = 'image-resize';

module.exports = config;