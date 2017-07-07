# extra-ext
API implementation, User Interface, and more modules of the IPTC EXTRA project running as Docker containers. 

## Description
The services that EXTRA platform is built upon are the following:

* [mongodb](https://www.mongodb.com/) - MongoDB is an open-source, document database that is used to store rules, schemas, dictionaries, taxonomies and topics.
* [elasticsearch](https://www.elastic.co/products/elasticsearch) - Elastic search used for the indexing of documents and rules. Indexed document are used for testing of rules during their development. Rules are indexed into Percolate index of Elastic Search to be used for document classification. 
* [documents-api](https://github.com/iptc/extra-ext/tree/master/documents-api) - An API for documents indexed in Elastic Search built as a Python Flask library.
* [api](https://github.com/iptc/extra-ext/tree/master/api) - EXTRA API built using [Jersey framework](https://jersey.github.io/). That API exposes the main functionality of EXTRA, including management of rules, schemas, taxonomies and topics (create, update, delete), and also document retrieval and tagging using rules. 
* [ui](https://github.com/iptc/extra-ext/tree/master/ui) - A web interface on top of the previous two APIs. 

The architecture of EXTRA platform is depicted in the following figure. All the service are deployed in Docker containers. To make deployment easier, the platform is described in a [docker-compose file](https://github.com/iptc/extra-ext/blob/master/docker-compose.yaml).

![EXTRA platform architecture](extra_platform_arch.png)

## Deployment 

To start EXTRA platform:

```sh
$ cd extra
$ docker-compose up -d
```

This will create or download images and pull in the necessary dependencies for each service. Once done, it runs the Docker and map the ports to whatever is specified in the [docker-compose.yml](https://github.com/iptc/extra-ext/blob/master/docker-compose.yaml) file.

See the other repositories of the IPTC EXTRA project:

* https://github.com/iptc/extra-core
* https://github.com/iptc/extra-rules
