# Extra API

This directory contains the Java project that implements the REST API described in [this](api/extra-api.raml) RAML file. That API exposes the main functionality of EXTRA, including management of rules, schemas, taxonomies and topics (create, update, delete), and also document retrieval and tagging. Is built with [Jersey framework](https://jersey.github.io/) and uses Jackson library for the serializatin/deserialization of Java objects to/from Json.

### API Methods

| Resource | Description |
| -------- | ----------- |
| **/rules** | A resources used to get, create update and delete rules |
| **/schemas** | |
| **/corpora** | |
| **/taxonomies** | |
| **/documents** | |
| **/dictionaries** | |
| **/classifications** | |
| **/validations** | |
