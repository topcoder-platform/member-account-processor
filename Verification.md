## Verification

- Ensure that Kafka is up and running and the topics `event.user.created`, `event.user.updated` are created in Kafka

- Ensure that the app is properly configured via config file, env variables or `.env` file in app root folder

- Ensure AWS credential is setup and DynamoDB table is created

- Start the application

- Run Kafka console consumer to listen to topic `member.action.profile.create`:

```
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic member.action.profile.create --from-beginning
```

- Run Kafka console producer to write message to topic `event.user.created`:

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic event.user.created
``` 

- Write message of user created:

```
{ "topic": "event.user.created", "originator": "some-originator", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "handle": "test", "email": "test@test.com", "firstName": "first-name", "lastName": "last-name", "profiles": [{ "userId": "123" }], "status": "ACTIVE", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "copilot" }], "modifiedBy": "11111", "modifiedAt": "2018-02-18T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```

- You will see success messages in the app console:

```
info: DynamoDB record is created successfully.
info: Member profile creation message is successfully sent to Kafka topic member.action.profile.create
```

- The above Kafka console consumer will show:

```
{"topic":"member.action.profile.create","originator":"tc-member-account-processor","timestamp":"2019-01-19T21:16:49.056Z","mime-type":"application/json","payload":{"userId":123,"firstName":"first-name","lastName":"last-name","handle":"test","handleLower":"test","email":"test@test.com","status":"ACTIVE","homeCountryCode":"US","country":"USA","copilot":true,"createdAt":"2018-02-17T03:11:11.000Z","createdBy":"11111","updatedAt":"2018-02-18T03:11:22.000Z","updatedBy":"11111"}}
```

- You can log into AWS management console, go to DynamoDB service, to view the created record, like:

```
https://ibb.co/TtRpSrF
```

- Shut down the app

- Wait for several seconds, send another message in the console producer:
```
{ "topic": "event.user.created", "originator": "some-originator", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "handle": "someone", "email": "test@test.com", "firstName": "first-name", "lastName": "last-name", "profiles": [{ "userId": "456" }], "status": "ACTIVE", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "copilot" }], "modifiedBy": "11111", "modifiedAt": "2018-02-18T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```

- Wait for several seconds, then re-start the app, the app should handle the above message which was generated during down time




- Run Kafka console consumer to listen to topic `member.action.profile.update`:

```
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic member.action.profile.update --from-beginning
```

- Run Kafka console producer to write message to topic `event.user.updated`:

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic event.user.updated
``` 

- Write message of user updated:

```
{ "topic": "event.user.updated", "originator": "some-originator", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "handle": "test", "email": "test2@test.com", "firstName": "first-name-2", "lastName": "last-name-2", "profiles": [{ "userId": "123" }], "status": "INACTIVE", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "admin" }], "modifiedBy": "11111", "modifiedAt": "2018-02-19T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```

- You will see success messages in the app console:

```
info: DynamoDB record is updated successfully.
info: Member profile update message is successfully sent to Kafka topic member.action.profile.update
```

- The above Kafka console consumer will show:

```
{"topic":"member.action.profile.update","originator":"tc-member-account-processor","timestamp":"2019-01-19T23:23:12.850Z","mime-type":"application/json","payload":{"userId":123,"firstName":"first-name-2","lastName":"last-name-2","handle":"test","handleLower":"test","email":"test2@test.com","status":"INACTIVE","homeCountryCode":"US","country":"USA","copilot":false,"createdAt":"2018-02-17T03:11:11.000Z","createdBy":"11111","updatedAt":"2018-02-19T03:11:22.000Z","updatedBy":"11111"}}
```

- You can log into AWS management console, go to DynamoDB service, to view the updated record, like:

```
https://ibb.co/R458yvM
```


- you may write invalid messages like:
```
{ "topic": "event.user.updated", "originator": "some-originator", "timestamp": "invalid", "mime-type": "application/json", "payload": { "email": "test@test.com", "firstName": "first-name-2", "lastName": "last-name-2", "profiles": [{ "userId": "123" }], "status": "ACTIVE", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "admin" }], "modifiedBy": "11111", "modifiedAt": "2018-02-19T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```

```
{ "topic": "event.user.updated", "originator": "some-originator", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "handle": "test", "email": "invalid", "country": { "code": "US", "name": "USA" }, "roles": [{ "roleName": "admin" }], "modifiedBy": "11111", "modifiedAt": "2018-02-19T11:11:22", "createdBy": "11111", "createdAt": "2018-02-17T11:11:11" } }
```

```
{ ] abc 123 ()
```


You will see validation error messages in the app console.


- Health check URL can be accessible at http://localhost:3000/health

