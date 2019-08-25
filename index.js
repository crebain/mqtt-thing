import * as mqtt from 'async-mqtt'
import { Thing, Value, Property, WebThingServer, SingleThing } from 'webthing'

const sensor = new Thing(
  'https://fangorn.mozilla-iot.org/things/troll-temperature',
  'Troll temperature',
  'MultiLevelSensor',
  'Temperature under the stairs')

const temperature = new Value(0.0)
sensor.addProperty(
  new Property(
    sensor,
    'temperature',
    temperature,
    {
      '@type': 'LevelProperty',
      title: 'Temperature',
      type: 'number',
      description: 'Current temperature under the stairs',
      minimum: -273.15,
      maximum: Number.POSITIVE_INFINITY,
      unit: '°C',
      readOnly: true
    }
  )
)

const server = new WebThingServer(
  new SingleThing(sensor),
  8888
)

process.on('SIGINT', () => {
  server.stop().then(() => process.exit()).catch(() => process.exit())
});

(async () => {
  const client = await mqtt.connectAsync('mqtt://libreelec.local')
  console.log('Connected to MQTT server')
  const subscription = await client.subscribe('test/temperature')
  subscription.map(sub => {
    console.log(`Subscribed to topic ${sub.topic} with QOS ${sub.qos}`)
  })

  client.on('message', (topic, payload) => {
    var message = payload.toString()
    console.debug(`Received message ${message}`)
    const value = JSON.parse(message)
    temperature.notifyOfExternalUpdate(value.value)
  })

  try {
    await server.start()
  } catch (e) {
    console.log(e)
  }
})()
