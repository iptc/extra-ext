# extra-ext
API implementation, User Interface, and more modules of the IPTC EXTRA project running as Docker containers

See the other repositories of the IPTC EXTRA project:

* https://github.com/iptc/extra-core
* https://github.com/iptc/extra-rules

The services that EXTRA platform is built upon are the following:

* [mongodb](https://www.mongodb.com/) - MongoDB is an open-source, document database. Used to store rules, schemas, dictionaries, taxonomies, topics
* [elasticsearch](https://www.elastic.co/products/elasticsearch) - Elastic search used for the indexing of documents and rules
* [documentsapi](https://github.com/iptc/extra-ext/tree/master/documents-api) - An api for documents indexed in Elstic Search built as a python Flask library.
* [api](https://github.com/iptc/extra-ext/tree/master/api) - EXTRA API built using [Jersey framework](https://jersey.github.io/).
* [ui](https://github.com/iptc/extra-ext/tree/master/ui) - A web interface on top of the previous two APIs.

![EXTRA platform architecture](extra_platform_arch.png)
