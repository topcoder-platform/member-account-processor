# Topcoder member account processor

## Dependencies

- nodejs https://nodejs.org/en/ (v10)
- Kafka (v2)
- AWS DynamoDB

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
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic member.action.profile.create
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic member.action.profile.update
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
{ "topic": "event.user.created", "originator": "some-originator", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "handle": "test", "email": "test@test.com", "firstName": "first-name", "lastName": "last-name", "profiles": [{ "userId": "123" }], "status": "ACTIVE", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "copilot" }], "modifiedBy": "11111", "modifiedAt": "2018-02-18T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
```
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic event.user.created --from-beginning
```

## Configuration

Configuration for the application is at `config/default.js` and `config/production.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: Port for Health check dropin to run
- KAFKA_URL: Kafka server URL
- KAFKA_GROUP_ID: the Kafka group id
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- AMAZON_AWS_REGION: the Amazon AWS region to access DynamoDB
- AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE: the DynamoDB member profile table name
- COPILOT_ROLE_NAME: copilot role name used to check whether user is copilot
- USER_CREATE_TOPIC: Kafka topic related to user creation
- USER_UPDATE_TOPIC: Kafka topic related to user update
- USER_CREATE_OUTPUT_TOPIC: Kafka topic to output member profile creation message
- USER_UPDATE_OUTPUT_TOPIC: Kafka topic to output member profile update message
- OUTPUT_MESSAGE_ORIGINATOR: Kafka output message originator


Due to using dotenv library, env variables may also be set via `.env` file in app root folder.


## AWS Setup

1. Download your AWS Credentials from AWS Console. Refer [AWS Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)

2. Depending on your Operating System, create AWS credentials file in the path listed below

```
Linux, Unix, and macOS users: ~/.aws/credentials

Windows users: C:\Users\{USER_NAME}\.aws\credentials
```

3. credentials file should look like below

```
[default]
aws_access_key_id = SOME_ACCESS_KEY_ID
aws_secret_access_key = SOME_SECRET_ACCESS_KEY
```


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

3. To delete DynamoDB table if needed

```
npm run delete-table
```

4. To create DynamoDB table if needed

```
npm run create-table
```

A table must be created before the app starts.

5. Properly configure the app via config file, env variables or `.env` file in app root folder

6. Start the processor and health check dropin

```
npm start
```

## Notes

- the identity service will raise messages of user created/updated for our processor,
  see (https://github.com/appirio-tech/tc1-api-core/blob/dev/tech.core/tech.core.service.identity/src/main/java/com/appirio/tech/core/service/identity/resource/UserResource.java),
  the message payload is instance of User,
  see (https://github.com/appirio-tech/tc1-api-core/blob/dev/tech.core/tech.core.service.identity/src/main/java/com/appirio/tech/core/service/identity/representation/User.java),
  this User extends AbstractIdResource,
  see (https://github.com/appirio-tech/tc1-api-core/blob/dev/tech.core/tech.core.api/src/main/java/com/appirio/tech/core/api/v3/model/AbstractIdResource.java),
  so we will use these User and inherited AbstractIdResource fields to construct input message payload

- the input message payload should be converted to member profile, see:
  see (https://github.com/appirio-tech/ap-member-microservice/blob/dev/service/src/main/java/com/appirio/service/member/api/MemberProfile.java),
  this is format of example message given in forum, converted data will be saved to DynamoDB and Elasticsearch

- the user data generated by identity service doesn't include all data of member profile, so the converted data are just part of given example payload

- this processor put messages to Kafka topics 'member.action.profile.create' and 'member.action.profile.update', to be consumed by member-processor-es to
  save member profile data in Elasticsearch

- for the bug fix mentioned in challenge spec, this processor uses group consumer, which can consume un-committed Kafka messages created during down time;
  see Validation.md for verification of this bug fix
