# IMG OFFLINE RESIZER
Приложение подключается к серверу RabbitMQ и перебирает очередь задач по обработке изображений из локальной папки.
### Установка
Нужно установить `imagemagick`, `rabbitmq` и само приложение
```sh
$ brew install rabbitmq
$ brew install imagemagick
$ npm install
```
###  Настройка
Конфигурационный файл: `./config.js`
##### MIME-типы
Объект-список доступных MIME-типов для обработки изображения. Указывается в качестве пары `key` - `array`, где `key` - расширение файла, `array` - массив возможных заголовков `ContentType`.
```js
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
```
##### Расположение файлов
Т.к. файлы изображений хранятся на локальном сервере - указываем относительный путь.
```js
config.imagesPath = 'uploads/';
```
##### Подборки
Объект-список подборок для обработки изображений.
```js
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
```
##### Качество изображений JPEG
Качество изображений типа JPEG, которое устанавливается для получаемого файла.
```js
config.quality = 83;
```
##### Настройка сервера очередей
Указываем адрес сервера и уникальное имя очереди, к которой будет обращаться приложение
```js
config.rabbitServerAddr = 'amqp://localhost';
config.imageQueueName = 'image-resize';
```
### Использование
Для использования приложения достаточно его настроить и добавить в очередь элемент:
##### Примеры добавления на JS с использованием модуля amqplib
В данном примере мы подключаемся к серверу очередей `rabbit.connect`, открываем канал `conn.createChannel`, выбираем очередь `ch.assertQueue` и забрасываем в очередь элемент следующей структуры:
 - Название очереди (`config.imageQueueName`) тип `string`
 - new Buffer('`image.jpg`') - генерация бинарного содержимого очереди, соответствуюет полю `payload` в очереди - является основным. В нем указан относительный путь до исходного файла, над которым будут проводиться манипуляции. Если файл находится в подпапке, то нужно указывать путь вместе с ней - `dir/dir/dir/dir/image.jpg`
 - 3м аргументом метода является объект с параметрами.
###### Список возможных параметров:
- `resizeType` (`string`) - идентификатор подборки (`main`, `progress`)
- `dimensions` (`string`) - параметры `width`x`height` изображения, если передается этот параметр - `resizeType` игнорируется.
- *`mimeType` (`string`) - ожидаемый тип изображения
- `blur` (`boolean`) - наличие параметра добавляет размытие
```js
let config = require('./config'),
    rabbit = require('amqplib/callback_api');


rabbit.connect(config.rabbitServerAddr, (err, conn) => {
    conn.createChannel( (err, ch) => {
        ch.assertQueue(config.imageQueueName, {}, (err, q) => {
            ch.sendToQueue(config.imageQueueName, new Buffer('image.jpg'), {
                headers:{
                    dimensions: '100x100',
                    mimeType: 'jpg',
                    blur: true
                }
            });
        });
    });
});
```
Результатом выполнения кода выше является созданный новый файл изображения с размытием `image_100_100.jpg` и из очереди удаляется соответствующий элемент.
```js
let config = require('./config'),
    rabbit = require('amqplib/callback_api');


rabbit.connect(config.rabbitServerAddr, (err, conn) => {
    conn.createChannel( (err, ch) => {
        ch.assertQueue(config.imageQueueName, {}, (err, q) => {
            ch.sendToQueue(config.imageQueueName, new Buffer('dir/dir/dir/dir/dir/image.png'), {
                headers:{
                    resizeType: 'block_main_1200',
                    mimeType: 'png',
                }
            });
        });
    });
});
```
Здесь на выходе будет файл `dir/dir/dir/dir/dir/image_block_main_1200.png` без размытия.
```js
let config = require('./config'),
    rabbit = require('amqplib/callback_api');


rabbit.connect(config.rabbitServerAddr, (err, conn) => {
    conn.createChannel( (err, ch) => {
        ch.assertQueue(config.imageQueueName, {}, (err, q) => {
            ch.sendToQueue(config.imageQueueName, new Buffer('dir/dir/dir/dir/dir/image.png'), {
                headers:{
                    resizeType: 'block_main_1200',
                    dimensions: '100x100',
                    mimeType: 'png',
                }
            });
        });
    });
});
```
Здесь на выходе будет файл `dir/dir/dir/dir/dir/image_100_100.png` без размытия, параметр `resizeType` игнорируется.
