## Verification

1. Ensure that Kafka is up and running and the topics `event.user.created`, `event.user.updated` are created in Kafka

2. Ensure that .env file with Auth0 credentials exist in the root directory

3. Start the application

4. Attach to the topic `event.user.created` using Kafka console producer

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic event.user.created
``` 

5. Write a message with following structure to the console. 

```
{ "topic":"event.user.created", "originator":"identity-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "handle": "tonyj", "email": "tonyj@topcoder.com", "firstName": "Tony", "lastName": "Jefts", "status": "active"} }
```

6. You will be able to see in the console that message is processed with debug statements like

```
debug: Response from Member API: {"handle":"tonyj","email":"tonyj@topcoder.com","firstName":"Tony","lastName":"Jefts","status":"active"}
```

7. Attach to the topic `event.user.updated` using Kafka console producer

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic event.user.updated
``` 

8. Write a message with following structure to the console. 

```
{ "topic":"event.user.updated", "originator":"identity-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "handle": "tonyj", "email": "tonyj1@topcoder.com", "firstName": "Changed", "lastName": "Jefts", "status": "active"} }
```

9. You will be able to see in the console that message is processed with debug statements like

```
debug: Response from Member API: {"handle":"tonyj","email":"tonyj1@topcoder.com","firstName":"Changed","lastName":"Jefts","status":"active"}
```


10. you may write invalid message like:
```
{ "topic":"event.user.created", "originator":"identity-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "email": "tonyj1@topcoder.com", "firstName": "Changed", "lastName": "Jefts", "status": "active"} }
```


```
{ "topic":"event.user.updated", "originator":"identity-api", "timestamp":"2018-08-06T15:46:05.575Z", "mime-type":"application/json", "payload":{ "handle": "tonyj", "email": "tonyj1", "firstName": "Changed", "lastName": "Jefts", "status": "active"} }
```

You will see Joi errors in the Console

There are multiple such scenarios. Joi handles it all

Health check URL will be accessible at http://localhost:3000/health