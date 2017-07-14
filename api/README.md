# Extra API

This directory contains the Java project that implements the REST API described in [this](api/extra-api.raml) RAML file. That API exposes the main functionality of EXTRA, including management of rules, schemas, taxonomies and topics (create, update, delete), and also document retrieval and tagging. Is built with [Jersey framework](https://jersey.github.io/) and uses Jackson library for the serializatin/deserialization of Java objects to/from Json.

### API Methods

| Resource | Description |
| -------- | ----------- |
| **/rules** | A resource endpoint used to get, create update and delete rules |
| **/schemas** | A resource endpoint used to get, create update and delete schemas |
| **/corpora** | A resource endpoint used to get, create update and delete corpora |
| **/taxonomies** | A resource endpoint used to get, create update and delete taxonomies |
| **/taxonomies/<taxonomy-id>/topics** | A resource endpoint used to get, create update and delete topics in a specific taxonomy |
| **/dictionaries** | A resource endpoint used to get, create update and delete dictionaries |
| **/documents** | A resource endpoint used to retrieve documents given a rule |
| **/classifications** | A resource endpoint used to classify a document |
| **/validations** | A resource endpoint used to validate a rule  |
