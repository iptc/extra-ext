import math
from datetime import datetime

from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_cors import CORS
from sections import Node

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.aggs import A
from pymongo import MongoClient
from bson.objectid import ObjectId

client = MongoClient('mongodb', 27017)
mongodb = client.extra
es = Elasticsearch(hosts = [{'host': 'elasticsearch', 'port': 9200}])

languages = {'apa': 'german', 'reuters': 'english'}
delimiters = {'apa': '/', 'reuters': '/'}

app = Flask(__name__, static_url_path='')

CORS(app, resources={'/api/*': {'origins': '*'}})
api = Api(app, prefix='/api')


class Document(Resource):
    def get(self, document_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        args = parser.parse_args()

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        document = es.get(index=corpus, id=document_id, doc_type='documents')
        return {'document': document['_source']}

    def put(self, document_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('exclude', type=str, required=True)
        parser.add_argument('topic', type=str, required=True)
        parser.add_argument('association', type=str, required=False)

        args = parser.parse_args()

        exclude = args['exclude']
        topic_id = args['topic']
        association = args['association']

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        if topic_id is None or topic_id == '':
            return {'exclude': 'false', 'msg': ' topic is unset for ' + document_id}

        if exclude != 'true' and exclude != 'false':
            return {'exclude': 'false', 'msg': 'document ' + document_id + ' failed to be flagged for ' + topic_id}

        document = es.get(index=corpus, id=document_id, doc_type='documents')
        if document is None:
            return {'exclude': 'false', 'msg': 'article ' + document_id + ' does not exist. Failed to be flagged.'}

        # update topics set
        topics = document['_source']['topics']
        for topic in topics:
            if topic['id'] == topic_id:
                topic['exclude'] = exclude

        # update topics subset
        if association == 'undefined':
            topics = document['_source']['topics']
            for topic in topics:
                if topic['id'] == topic_id:
                    topics.remove(topic)
                    break

            body = {'doc': {'topics': topics}}
            es.update(index=corpus, doc_type='documents', id=document_id, body=body)
        elif association == 'userdefined' and exclude == 'true':
            topics = document['_source']['topics']
            for topic in topics:
                if topic['id'] == topic_id:
                    topics.remove(topic)
                    break

            body = {'doc': {'topics': topics}}
            es.update(index=corpus, doc_type='documents', id=document_id, body=body)
        else:
            sbt = 'direct_topics' if (association is None or association == 'why:direct') else 'ancestor_topics'
            topics_subset = document['_source'][sbt]
            for topic in topics_subset:
                if topic['id'] == topic_id:
                    topic['exclude'] = exclude

            body = {'doc' : {'topics' : topics, sbt : topics_subset}}
            es.update(index=corpus, doc_type='documents', id=document_id, body=body)

        return {'msg': 'document ' + document_id + ' is flagged as exclude:' + exclude + ' for ' + topic_id}


class DocumentFile(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('documentId', type=str, required=True)

        args = parser.parse_args()

        document_id = args['documentId']

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        article = es.get(index=corpus, id=document_id, doc_type='documents')
        if article is None:
            return {'xml' : ''}

        filename = article['_source']['filename']
        response = {}
        with open('xml/' + corpus + '/' + filename, 'r') as f:
            xml_content = f.read()
            response['xml'] = xml_content

        return response


class Documents(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('q', type=str, required=False)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('excluded', type=str, required=False)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)
        parser.add_argument('since', type=int, required=False)
        parser.add_argument('until', type=int, required=False)
        parser.add_argument('topic', type=str, required=False)
        parser.add_argument('association', type=str, required=False)
        parser.add_argument('section', type=str, required=False)

        args = parser.parse_args()
        search = Search(using=es)

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        lang = languages[corpus]
        delimiter = delimiters[corpus]

        search = search.index(corpus)
        search = search.doc_type('documents')

        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 10
        search = search.sort('-versionCreated')
        search = search[(page-1)*n_per_page : page * n_per_page]
        search = search.source(includes=['slugline', 'title', 'subtitle', 'versionCreated', 'body', 'id', 'topics', 'body_paragraphs'])

        if args['q'] is not None and args['q'] is not '':
            search = search.query('bool', must=Q('query_string', query=args['q'], fields=['title', 'body'], analyzer=lang, analyze_wildcard='true', default_operator='or'))
            search = search.highlight_options(number_of_fragments=0, pre_tags=['<span class="highlight">'], post_tags=['</span>'])
            search = search.highlight('title', fragment_size=0, require_field_match=True,)
            search = search.highlight('body', fragment_size=0, require_field_match=True,)
            search = search.sort('_score', '-versionCreated')

        filters = []
        if args['since'] is not None and args['since'] is not 0:
            since = datetime.fromtimestamp(args['since']).isoformat()
            filters.append(Q('range', versionCreated={'gte':since}))

        if args['until'] is not None and args['until'] is not 0:
            until = datetime.fromtimestamp(args['until']).isoformat()
            filters.append(Q('range', versionCreated={'lt':until}))

        topic_id = args['topic']
        if (topic_id is not None and topic_id is not '') and args['association'] is not None:
            must_query = [
                {'term': {'topics.id': topic_id}},
                {'term': {'topics.association': args['association']}}
            ]

            if args['excluded'] == 'true':
                must_query.append({'term': {'topics.exclude': args['excluded']}})

            topic_query = {
                'nested': {
                    'path': 'topics',
                    'query': {
                        'bool': {
                            'must': must_query
                        }
                    }
                }
            }
            filters.append(topic_query)

        if args['section'] is not None and args['section'] != '':
            filters.append(Q('match', slugline=args['section']))

        if filters:
            search = search.query('bool', filter=filters)

        response = search.execute()

        documents = []
        for hit in response:
            document = hit.to_dict()
            if 'highlight' in hit.meta:
                if 'title' in hit.meta.highlight:
                    for title_fragment in hit.meta.highlight.title:
                        document['title'] = title_fragment
                        break
                if 'body' in hit.meta.highlight:
                    for body_fragment in hit.meta.highlight.body:
                        document['body'] = body_fragment
                        break
            if (topic_id is not None and topic_id is not '') and args['association'] is not None:
                for topic in document['topics']:
                    if topic['id'] == topic_id and 'exclude' in topic and topic['exclude'] == 'true':
                        document['exclude'] = 'true'
                        break
            documents.append(document)

        return {
            'found': search.count(),
            'page': page,
            'nPerPage': n_per_page,
            'lastPage': math.ceil(search.count() / n_per_page) if n_per_page is not 0 else 1,
            'documents': documents,
            'from': (page - 1) * n_per_page,
            'to': page * n_per_page,
            'delimiter':delimiter
        }


class Topics(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('association', type=str, required=False)

        args = parser.parse_args()
        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        field = 'direct_topics'
        if args['association'] is not None and args['association'] == 'why:ancestor':
            field = 'ancestor_topics'

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('documents')

        search = search[0:0]
        aggregations = {
            'nested': {
                'path': field
            },
            'aggs': {
                field+'.id': A('terms', field=field+'.id', size=1200, min_doc_count=1)
            }
        }
        search.aggs.bucket(field, aggregations)
        response = search.execute()

        aggregations = response.aggregations
        buckets = aggregations[field][field+'.id']['buckets']

        response = []
        for bin in buckets:
            id = bin['key']
            result = es.get(index=corpus, id=id, doc_type='topics')
            topic = result['_source']
            topic['doc_count'] = bin['doc_count']
            response.append(topic)
        return response


class Topic(Resource):
    def get(self, topic_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)

        args = parser.parse_args()
        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        result = es.get(index=corpus, id=topic_id, doc_type='topics')
        topic = result['_source']

        return topic

    def put(self, topic_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('document_id', type=str, required=True)

        args = parser.parse_args()

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        document_id = args['document_id']

        result = es.get(index=corpus, id=topic_id, doc_type='topics')
        if result is None:
            return {'msg': 'topic ' + topic_id + ' does not exist. Failed to add user defined topic.'}
        new_topic = result['_source']

        documents = es.get(index=corpus, id=document_id, doc_type='documents')
        if documents is None:
            return {'msg': 'document ' + document_id + ' does not exist. Failed to add user defined topic.'}

        topics = documents['_source']['topics']
        # update topics set
        exists = False
        for topic in topics:
            if topic['id'] == new_topic['id']:
                exists = True
                break

        if not exists:
            if 'association' not in new_topic:
                new_topic['association'] = 'userdefined'
                new_topic['exclude'] = 'false'

            topics.append(new_topic)
            body = {'doc': {'topics': topics}}
            es.update(index=corpus, doc_type='documents', id=document_id, body=body)
            return {'msg': 'document ' + document_id + ' has been annotated with ' + new_topic['id']}
        else:
            return {'msg': 'document ' + document_id + ' is already annotated with ' + new_topic['id']}


class Statistics(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('field', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)

        args = parser.parse_args()
        field = args['field']
        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('documents')

        search = search[0:0]
        search.aggs.metric(field, 'stats', field=field)

        response = search.execute()
        return response.aggregations[field].to_dict()


class Top(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('field', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('size', type=str, required=False)

        args = parser.parse_args()
        field = args['field']

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        size = args['size'] if args['size'] is not None else 500

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('documents')

        search = search[0:0]

        if '.' not in field:
            aggregations = A('terms', field=field, size=size)
            search.aggs.bucket(field, aggregations)
        else:
            parts = field.split('.')
            aggregations = {
                'nested': {
                    'path': parts[0]
                },
                'aggs': {
                    field: A('terms', field=field, size=size)
                }
            }
            search.aggs.bucket(parts[0], aggregations)

        response = search.execute()

        aggregations = response.aggregations
        if '.' not in field:
            buckets = aggregations[field]['buckets']
        else:
            parts = field.split('.')
            buckets = aggregations[parts[0]][field]['buckets']

        response = []
        for bin in buckets:
            response.append(
               bin.to_dict()
            )
        return response


class TopTerms(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('q', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('size', type=str, required=False)

        args = parser.parse_args()
        query = args['q']
        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        size = args['size'] if args['size'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('documents')

        search = search[0:10]

        search = search.query('match', text=query)

        aggregations = A('terms', field='text', size=size)
        search.aggs.bucket('text', aggregations)

        response = search.execute()
        return response.to_dict()
        aggregations = response.aggregations

        return aggregations.to_dict()


class Section(Resource):
    def get(self, section_id=None):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        args = parser.parse_args()

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        if section_id == 'root' or section_id is None:
            search = Search(using=es)
            search = search.index(corpus)
            search = search.doc_type('sections')
            search = search.query(Q('term', level=0))
            response = search.execute()
            for hit in response.hits:
                section = hit.to_dict()
                return {'section': section}
        else:
            section = es.get(index='sections', id=section_id, doc_type=corpus)
            section = section['_source']

            return {'section': section, 'delimiter' : delimiters[corpus]}


class SectionChildren(Resource):
    def get(self, section_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)

        args = parser.parse_args()

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        current = None
        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        if section_id == 'root':
            search = search.query(Q('term', level=0))
        else:
            search = search.query(Q('term', id=section_id))

        response = search.execute()
        for hit in response.hits:
            section_id = hit.id
            current =  hit.to_dict()
            break

        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        search = search[(page-1)*n_per_page : page * n_per_page]
        search = search.query(Q('term', parent=section_id))
        search = search.sort('label')

        response = search.execute()

        sections = []
        for hit in response.hits:
            section = hit.to_dict()
            sections.append(section)

        return {
            'found': response.hits.total,
            'current': current,
            'sections' : sections,
            'delimiter' : delimiters[corpus]
        }


class Sections(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)
        parser.add_argument('q', type=str, required=True)

        args = parser.parse_args()

        corpus_id = args['corpus']
        corpus_obj = mongodb.corpora.find_one({'_id': ObjectId(corpus_id)})
        corpus = corpus_obj['name']

        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        search = search.sort('level')
        search = search[(page - 1) * n_per_page: page * n_per_page]

        query = args['q']
        if query is not None and query != '':
            search = search.query(Q('simple_query_string',query=args['q'], fields=['name'], analyzer='path-analyzer',
                                    default_operator='AND'))

        response = search.execute()

        sections = []
        for hit in response.hits:
            section = hit.to_dict()
            sections.append(section)

        trees = []
        for section in sections:
            parent_node = None
            for tree in trees:
                parent_node = tree.get_by_id(section['parent'])
                if parent_node is not None:
                    break

            if parent_node is None:
                node = Node(section['name'], parent_id=section['parent'], level=section['level'])
                node.id = section['id']
                trees.append(node)
            else:
                node = Node(section['name'])
                node.id = section['id']
                parent_node.add_child(node)

        json_trees = []
        for tree in trees:
            json_trees.append(tree.to_json())

        return {'sections': json_trees, 'delimiter' : delimiters[corpus]}


@app.errorhandler(404)
def page_not_found(error):
    return 'page not found'


@app.errorhandler(400)
def raise_error(error):
    return error


@app.errorhandler(500)
def raise_error(error):
    return error


if __name__ == '__main__':
    api.add_resource(Documents, '/documents')
    api.add_resource(Document, '/documents/<document_id>')
    api.add_resource(DocumentFile, '/documents/xml')
    api.add_resource(Topics, '/topics')
    api.add_resource(Topic, '/topics/<topic_id>')
    api.add_resource(Statistics, '/stats')
    api.add_resource(Top, '/top')
    api.add_resource(Section, '/section/<section_id>', '/section')
    api.add_resource(SectionChildren, '/section/<section_id>/children')
    api.add_resource(Sections, '/sections')
    api.add_resource(TopTerms, '/terms')

    app.run(host='0.0.0.0', port=5000, threaded=True)
