let config = require('./config'),
    rabbit = require('amqplib/callback_api'),
    controllers = require('./controllers');


rabbit.connect(config.rabbitServerAddr, (err, conn) => {
    conn.createChannel( (err, ch) => {
        ch.prefetch(1);
        ch.assertQueue(config.imageQueueName, {}, (err, q) => {

            ch.consume(q.queue, (msg) => {

                controllers.resize.prepare(msg, (err, status) => {

                    if( status )
                        controllers.resize.processImage( msg , (err) => {
                            if( err )
                                console.log(error.message);
                            else
                                ch.ack(msg);
                        });
                    else {
                        for(let i in err){
                            switch( err[i] ){
                                case 1:
                                    console.log('Error: unknown resize type %s', msg.properties.headers.resizeType);
                                    break;
                                case 2:
                                    console.log('Error: unknown mime type %s', msg.properties.headers.mimeType);
                                    break;
                                case 3:
                                    console.log('Error: empty filepath string');
                                    break;
                                case 4:
                                    console.log('Error: cannot access(rw) file: %s or file doesnt exist', msg.content.toString());
                                    break;
                                default:
                                    console.log(['Error: unknown '+err[i],msg.properties]);
                                    break;
                            }
                        }
                    }
                });
            }, {noAck: false});
        });
    });
});