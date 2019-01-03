# Topcoder SonarQube Scorer Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v10)
- Kafka (v2)

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to the extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create some topics:
```  
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic event.user.created
  bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic event.user.updated
```
- verify that the topics are created:
```
bin/kafka-topics.sh --list --zookeeper localhost:2181
``` 
  it should list out the created topics
- run the producer and then write some message into the console to send to the topic `event.user.created`:
```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic event.user.created
```
- In the console, write some message, one message per line:
E.g.
```
{ "topic":"event.user.created", "originator":"identity-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "handle": "tonyj", "email": "tonyj@topcoder.com", "firstName": "Tony", "lastName": "Jefts", "status": "active"} }
```
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
```
  bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic event.user.created --from-beginning
```

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: Port for Health check dropin to run
- KAFKA_URL: Kafka server URL
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- USER_CREATE_TOPIC: Kafka topic related to user creation
- USER_UPDATE_TOPIC: Kafka topic related to user update
- MEMBER_API_URL: Member API URL
- All variables starting with prefix `AUTH0` and TOKEN_CACHE_TIME corresponds to Auth0 related credentials

## Local deployment

1. From the project root directory, run the following command to install the dependencies

```
npm i
```

2. To run linters if required

```
npm run lint

npm run lint:fix # To fix possible lint errors
```

3. Ensure that `.env` file is set in root directory with Auth0 credentials

4. Start the processor and health check dropin

```
npm start
```

### Notes

3 security vulnerabilities reported during npm install is from the existing Topcoder package `tc-core-library-js` which is necessary to generate M2M tokens.

https://github.com/appirio-tech/tc-core-library-js/blob/master/package.json

Actually based on my analysis, the way we are trying to link Identity service and Member API is not seemingly relevant.

Identity service is used in the below scenarios

1. Registration of User
2. Validation of login
3. In the profile page, if the User is trying to change password, then the identity service is invoked.

Apart from that all other updates are directly handled in Member API, e.g. Change of name, email, verification of email etc..

And there is no end point to create a user through Member API, only update exists, since User is already created through Identity API in the same Dynamo DB.

Following the Specs, I am just passing on the values to the Mock end point as mentioned.