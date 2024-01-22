const express = require('express'); 
const app = express(); 
const { Server } = require('socket.io'); 
const http = require('http'); 
const server = http.createServer(app); 
const io = new Server(server); 
const port = 5000; 
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
	clientId: 'StoopidChat',
	brokers: ['localhost:9092']
})

// function to push message to kafka 
const sendMessage = async (message) => {
	try {
		const producer = kafka.producer()
		await producer.connect()
		await producer.send({
			topic: 'chat',
			messages: [
				{ value: message },
			],
		})
	} catch (error) {
		console.log(error)
	}
}

// function to consume message from kafka
const consumeMessage = async () => {
	try {
		const consumer = kafka.consumer({ groupId: 'chat-group' })
		await consumer.connect()
		await consumer.subscribe({ topic: 'chat', fromBeginning: true })
		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				console.log({
					value: message.value.toString(),
				})
			},
		})
	} catch (error) {
		console.log(error)
	}
}

app.get('/', (req, res) => { 
	res.sendFile(__dirname + '/index.html'); 
});

io.on('connection', (socket) => { 
	socket.on('send name', (username) => { 
		// set kafka clientId on name 
		io.emit('send name', (username)); 
	}); 

	socket.on('send message', (chat) => { 
		io.emit('send message', (chat)); 
	}); 
}); 

server.listen(port, () => { 
	console.log(`Server is listening at the port: ${port}`); 
});
