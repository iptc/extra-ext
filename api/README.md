# Extra API

This directory contains the Java project that implements the REST API described in [this](api/extra-api.raml) RAML file. That API exposes the main functionality of EXTRA, including management of rules, schemas, taxonomies and topics (create, update, delete), and also document retrieval and tagging. Is built with [Jersey framework](https://jersey.github.io/) and uses Jackson library for the serializatin/deserialization of Java objects to/from Json.

## Configuration, build and execution

To run the API, first you have to edit the [properties file](https://github.com/iptc/extra-ext/blob/master/api/extra-api/src/main/resources/application.properties). MongoDB, Elastic Search and API's base URI should be specified in this file:


```ini
mongodb.host = mongodb
mongodb.port = 27017
mongodb.database = extra
mongodb.username =
mongodb.password =
es.host = elasticsearch
es.port = 9300
base.uri = http://0.0.0.0:8888/extra/api
```

To note that the properties file is ready to be used in conjunction with Docker. For example, the hostname of MongoDB is *mongodb* as that the alias name of the container that run mongodb docker image, In the same way, *elasticsearch* is the alias name for ElasticSearch container. If the user wants to use the API on top of already running services, e.g. a running ElasticSearch cluster, he has to edit the file accordingly.


To build the project:
```sh
$ cd extra-api
$ mvn clean package
```

To execute it:
```sh
$ mvn exec:java
```

If EXTRA platform is deployed using Docker Compose, the image of the API is built during deployment as described in the corresponding [Dockerfile](https://github.com/iptc/extra-ext/blob/master/api/Dockerfile).

## API Methods & Examples

| Resource | Description |
| -------- | ----------- |
| **/rules** | A resource endpoint used to get, create update and delete rules |
| **/schemas** | A resource endpoint used to get, create update and delete schemas |
| **/corpora** | A resource endpoint used to get, create update and delete corpora |
| **/taxonomies** | A resource endpoint used to get, create update and delete taxonomies |
| **/taxonomies/{taxonomy-id}/topics** | A resource endpoint used to get, create update and delete topics in a specific taxonomy |
| **/dictionaries** | A resource endpoint used to get, create update and delete dictionaries |
| **/documents** | A resource endpoint used to retrieve documents given a rule |
| **/classifications** | A resource endpoint used to classify a document |
| **/validations** | A resource endpoint used to validate a rule  |

### Create and update a rule

To create a new rule:

**POST** /rules 
Request

Headers:
Accept: application/json
Authorization: Basic Z2Vla25lc3NfbGV2ZWw6b3V0X29mX3RoaXNfd29ybGQ=

Body:

{
	"name": null,
	“surname": “chatzidimitriou"
	"gender": “female"
	"weight": 3.53
	“imageUrl": "https://www.dropbox.com/s/nn2w5dcaxfudqut/IMG_3540.JPG?dl=0"
	“date_of_birth": “15 Jul 2017"
}

Response

201 Created

{
	“id": 4,
	"name": null,
	“surname": “chatzidimitriou"
	"gender": “female"
	"weight": 3.53
	“imageUrl": "https://www.dropbox.com/s/nn2w5dcaxfudqut/IMG_3540.JPG?dl=0"
	“date_of_birth": “15 Jul 2017"
}



### Validate a rule

### Retrieve documents given a rule

### Submit a final rule

### Classify a new document
