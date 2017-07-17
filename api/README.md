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

To create a new rule for a given taxonomy and a topic within that taxonomy:

**POST** /rules

**Request**
*Headers:*
**Accept**: *application/json*

*Body:*

```json
{
	"name": "Test Rule",
	"query": "(or (and (title adj/regexp \"\\d+\\-?\\s+?year\\-?\\s?old\") (body any/stemming \"boy child children girl infant juvenile kid newborn schoolboy schoolgirl toddler\") ) (and (title adj/regexp \"\\d+\\-?\\s+?month\\-?\\s?old\") (body any/stemming \"boy child children girl infant juvenile kid newborn schoolboy schoolgirl toddler\") ) )",
	"taxonomy": "5901b9e5c41479000146ced2",
	"topicId": "medtop:20000790"
}
```

**Response**

*201 - Created*

```json
{
	"id": "5967c20730c49e0001e6df0e",
	"createdAt": 1499972103348,
	"status": "new",
	"name": "Test Rule",
	"query": "(or (and (title adj/regexp \"\\d+\\-?\\s+?year\\-?\\s?old\") (body any/stemming \"boy child children girl infant juvenile kid newborn schoolboy schoolgirl toddler\") ) (and (title adj/regexp \"\\d+\\-?\\s+?month\\-?\\s?old\") (body any/stemming \"boy child children girl infant juvenile kid newborn schoolboy schoolgirl toddler\") ) )",
	"taxonomy": "5901b9e5c41479000146ced2",
	"topicId": "medtop:20000790"
}
```
