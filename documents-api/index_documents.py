import os
import json
from elasticsearch import Elasticsearch

english_analyzers = {
    'filter': {
        'english_stop': {
            'type': 'stop',
            'stopwords':  '_english_'
        },
        'english_possessive_stemmer': {
            'type': 'stemmer',
            'language': 'possessive_english'
        },
        'english_stemmer': {
            'type': 'stemmer',
            'language': 'english'
        }
    },
    'analyzer': {
        'path-analyzer': {
            'type': 'custom',
            'tokenizer': 'path-tokenizer',
            'filter': 'lowercase'
        },
        'path-search-analyzer': {
            'type': 'custom',
            'tokenizer': 'keyword',
            'filter': 'lowercase'
        },
        'english_stemming_analyzer': {
            'tokenizer': 'standard',
            'filter': [
                'english_possessive_stemmer',
                'lowercase',
                'english_stop',
                'english_stemmer'
            ]
        },
        'english_non_stemming_analyzer': {
            'tokenizer': 'standard',
            'filter': [
                'english_possessive_stemmer',
                'lowercase',
                'english_stop'
            ]
        }
    },
    'tokenizer': {
        'path-tokenizer': {
            'type': 'path_hierarchy',
            'delimiter': '/'
        }
    }
}

german_analyzers = {
    'filter': {
        'german_stop': {
            'type': 'stop',
            'stopwords':  '_german_'
        },
        'german_stemmer': {
            'type': 'stemmer',
            'language': 'light_german'
        }
    },
    'analyzer': {
        'path-analyzer': {
            'type': 'custom',
            'tokenizer': 'path-tokenizer',
            'filter': 'lowercase'
        },
        'path-search-analyzer': {
            'type': 'custom',
            'tokenizer': 'keyword',
            'filter': 'lowercase'
        },
        'german_stemming_analyzer': {
            'tokenizer': 'standard',
            'filter': [
                'lowercase',
                'german_stop',
                'german_normalization',
                'german_stemmer'
            ]
        },
        'german_non_stemming_analyzer': {
            'tokenizer': 'standard',
            'filter': [
                'lowercase',
                'german_stop',
                'german_normalization'
            ]
        }
    },
    'tokenizer': {
        'path-tokenizer': {
            'type': 'path_hierarchy',
            'delimiter': '/'
        }
    }
}


def index_documents(es, documents, index_name, doc_type):
    i = 0
    body = []
    for json_document in documents:
        body.append({'index': {'_index': index_name, '_type': doc_type, '_id': json_document['id']}})
        body.append(json_document)
        i += 1
        if i % 200 == 0:
            response = es.bulk(body=body, index=index_name, doc_type=doc_type)
            body.clear()
            print(repr(i) + ' files indexed')
            print(response)
    if len(body) != 0:
        response = es.bulk(body=body, index=index_name, doc_type=doc_type)
        print(response)


def index_documents_from_dir(es, documents_dir, index_name, doc_type):
    i = 0
    body = []
    for filename in os.listdir(documents_dir):
        file = open(documents_dir + filename, "r")
        json_document = json.load(file)

        body.append({'index': {'_index': index_name, '_type': doc_type, '_id': json_document['id']}})
        body.append(json_document)
        i += 1
        if i % 200 == 0:
            response = es.bulk(body=body, index=index_name, doc_type=doc_type)
            body.clear()
            print(repr(i) + ' files indexed')
            print(response)
    if len(body) != 0:
        response = es.bulk(body=body, index=index_name, doc_type=doc_type)
        print(response)


def create_documents_mapping(es: Elasticsearch, index_name, doc_type, lang):
    request_body = {
        'settings': {
            'index':{
                "number_of_shards": 5,
                "number_of_replicas": 1,
                'max_result_window': 20000
            },
            'analysis': english_analyzers if lang == 'english' else german_analyzers
        },
        'mappings': {
            doc_type: {
                '_all': {'enabled': 'false'},
                'properties' : {
                    'id': {'type': 'keyword'},
                    'lang': {'type': 'keyword'},
                    'filename': {'type': 'keyword'},
                    'title': {
                        'type': 'text',
                        'analyzer': lang + '_non_stemming_analyzer',
                        'copy_to': 'text_content'
                    },
                    'stemmed_title': {
                        'type': 'text',
                        'analyzer': lang + '_stemming_analyzer',
                        'copy_to': 'stemmed_text_content'
                    },
                    'headline': {
                        'type': 'text',
                        'analyzer': lang + '_non_stemming_analyzer',
                        'copy_to': 'text_content'
                    },
                    'stemmed_headline': {
                        'type': 'text',
                        'analyzer': lang + '_stemming_analyzer',
                        'copy_to': 'stemmed_text_content'
                    },
                    'body' : {
                         'type': 'text',
                        'analyzer': lang + '_non_stemming_analyzer',
                        'copy_to': 'text_content'
                    },
                    'stemmed_body': {
                        'type': 'text',
                        'analyzer': lang + '_stemming_analyzer',
                        'copy_to': 'stemmed_text_content'
                    },
                    'body_paragraphs': {
                        'type': 'nested',
                        'properties': {
                            'paragraph': {
                                'type': 'text',
                                'analyzer': lang + '_non_stemming_analyzer'
                            }
                        }
                    },
                    'stemmed_body_paragraphs': {
                        'type': 'nested',
                        'properties': {
                            'paragraph': {
                                'type': 'text',
                                'analyzer': lang + '_stemming_analyzer'
                            }
                        }
                    },
                    'versionCreated': {'type': 'date'},
                    'topics': {
                        'type': 'nested',
                        'properties': {
                            'id': {'type': 'keyword'},
                            'name': {'type': 'keyword'},
                            'parent': {'type': 'keyword'},
                            'association': {'type': 'keyword'},
                            'exclude': {'type': 'keyword'}
                        }
                    },
                    'exclude': {'type': 'keyword'},
                    'slugline': {
                        'type': 'text',
                        'fielddata': True,
                        'analyzer': 'path-analyzer',
                        'search_analyzer': 'path-search-analyzer',
                        'copy_to': 'text_content'
                    },
                    'text_content': {
                        'type': 'text',
                        'analyzer': lang + '_non_stemming_analyzer'
                    },
                    'stemmed_text_content': {
                        'type': 'text',
                        'analyzer': lang + '_stemming_analyzer'
                    }
                }
            }
        }
    }
    es.indices.create(index=index_name, body=request_body)


def load_documents(documents_dir):
    documents = []
    for filename in os.listdir(documents_dir):
        document_file = open(documents_dir + filename, 'r')
        json_document = json.load(document_file)
        documents.append(json_document)
    return documents;


def pre_process_documents(documents):
    for document in documents:
        document['exclude'] = 'false'
        document['direct_topics'] = [mt for mt in document['topics'] if mt['association'] == 'why:direct']
        document['ancestor_topics'] = [mt for mt in document['topics'] if mt['association'] == 'why:ancestor']
    return documents


if __name__ == '__main__':
    es = Elasticsearch()
    corpora = [
        ['/disk1_data/EXTRA/APA dataset/json_v2/', 'german', 'apa'],
        ['/disk1_data/EXTRA/Reuters dataset/json_v2/', 'english', 'reuters']
    ]

    for i in 0, 1:
        docs = load_documents(corpora[i][0])

        print(len(docs), 'documents for', corpora[i][2])

        docs = pre_process_documents(docs)
        create_documents_mapping(es, corpora[i][2], 'documents', corpora[i][1])
        index_documents(es, docs, corpora[i][2], 'documents')