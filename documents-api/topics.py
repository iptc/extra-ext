import os, json
from elasticsearch import Elasticsearch


def get_topics(dir, lang='en'):
    topics = {}
    for filename in os.listdir(dir):
        file = open(dir+filename, "r")
        json_article = json.load(file)

        for topic in json_article['topics']:
            id_parts = topic['id'].split(':')
            topics[topic['id']] = {
                'id': topic['id'],
                'name': topic['name'],
                'parent': topic['parent'],
                'url':  'http://cv.iptc.org/newscodes/mediatopic/'+id_parts[1]+'?lang='+lang,
                'search': topic['name']+' ('+id_parts[1]+')'
            }
    return topics


def index_topics(es, index_name, doc_type, topics={}, update=True):
    properties = { 
        'properties': {
            'id': {'type': 'keyword'},
            'name': {'type': 'keyword'},
            'parent': {'type': 'keyword'},
            'url': {'type': 'keyword'},
            'search': {'type': 'keyword'}
        }
    }
    request_body = {
        'mappings': {
            doc_type: properties
        }
    }

    if update:
        es.indices.put_mapping(index=index_name, doc_type=doc_type, body=properties)
    else:
        es.indices.create(index=index_name, body=request_body)
    for id in topics:
        topic = topics[id]
        es.index(index=index_name, doc_type=doc_type, id=id, body=topic)


if __name__ == '__main__':
    corpora = [
        ['/disk1_data/EXTRA/APA dataset/json_v2/', 'de', 'apa'],
        ['/disk1_data/EXTRA/Reuters dataset/json_v2/', 'en', 'reuters']
    ]

    es = Elasticsearch()
    for i in 0, 1:
        topics = get_topics(corpora[i][0], corpora[i][1])
        print(len(topics), 'topics found for', corpora[i][2])
        index_topics(es, corpora[i][2], 'topics', topics)